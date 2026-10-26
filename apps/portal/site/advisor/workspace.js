import {createAdmissionDialog} from './admission.js';
import {DraftSession,esc,money,title,validateDraft,parseDraftPaste} from './model.js';
import {catalog} from './catalog.js';
import {previewHref,savedPreviewTarget} from '../preview/target.js';
import {mountPresentationEditor} from './presentation-editor.js';
import {deriveRecommendations,validatePresentation} from './presentation-model.js';
import {intakeAuthoringValue,planAuthoringValue} from './authoring.js';
import {productDescriptor,presentationFeedMarkup,presentationCardDetail,presentationConsultationMarkup,presentationGuidesMarkup} from '../client/presentation-renderer.js';
import {planPreviewMarkup,wireIngredientGuide} from './plan-preview.js';
import {mountWalkthroughLibrary} from './walkthrough-library.js';
import {createCheckinDraftState} from '../features/checkins/draft-state.js';
import {createAdvisorNavigation} from './navigation.js';
import {createPortalDialog} from '../ui/dialog.js';
import {UI_COPY} from '../ui/copy.js';

const tabs=['overview','draft','payments','checkins','history'];
const copy={overview:'Consultation',draft:'Plan draft',payments:UI_COPY.navigation.payments,checkins:UI_COPY.navigation.checkins,history:UI_COPY.navigation.history,service:'Service and reviews'};
const copyError=error=>error.status===409?'This record changed while you were working. Your edits are still here. Copy anything you need, then load the latest version.':error.message || 'We could not load this workspace. Try again.';

export function mountAdvisorWorkspace(root,{request,mountFeature,onSignOut,requestAdmission=null,requestWalkthroughs=null,serviceEnabled=false,preview=false,scenario='ready',initialDirectory=null}) {
  const availableTabs=serviceEnabled?[...tabs,'service']:tabs;
  let libraryCleanup=null;
  let directory=null,selected=null,session=null,activeTab='overview',filter='',query='',disposed=false,featureCleanup=null,sequence=0,readController=null,intakeIntent=null,intakeUncertain=false,privateBusy=false,meetingDraft=null,draftEditor=null,intakeEditor=null;
  let canAddClient=false;
  let checkinDraft=null,paymentDraft=null,serviceDraft=null;
  const taskMemory=()=>({pending:null,quoteDraft:null,forms:new Map(),closed:false,hasUnsent(){return this.pending!==null||this.quoteDraft!==null||this.forms.size>0;},dispose(){this.closed=true;this.pending=null;this.quoteDraft=null;this.forms.clear();}});
  const clearTaskDrafts=()=>{checkinDraft?.dispose();paymentDraft?.dispose();serviceDraft?.dispose();checkinDraft=null;paymentDraft=null;serviceDraft=null;};
  const navigation=createAdvisorNavigation({tasks:availableTabs,onNavigate:restoreNavigation});
  const admission=requestAdmission?createAdmissionDialog({request:requestAdmission,onAdded:()=>loadDirectory(),onOpenClient:async id=>{const current=await loadDirectory();if(current&&!disposed)await openClient(id);}}):null;
  const $=selector=>root.querySelector(selector);
  const modal=createPortalDialog({document:root.ownerDocument,canClose:reason=>reason==='close'||!dialog.querySelector('#paste-content')?.value.trim()||confirm('Discard this pasted draft? It has not been applied.')}),dialog=modal.element;
  const closeDialog=()=>modal.close();
  const isBusy=()=>session?.status==='saving'||privateBusy||Boolean($('#advisor-tab-content [aria-busy="true"]'));
  const hasUnsavedNotes=()=>$('#intake-form')?.dataset.dirty==='true'||$('#meeting-form')?.dataset.dirty==='true';
  const featureEdits=()=>Boolean($('#advisor-tab-content form[data-dirty="true"]'))||featureCleanup?.hasPending?.();
  const hasPending=()=>admission?.hasPending() || session?.dirty || session?.pending || intakeIntent || meetingDraft || hasUnsavedNotes()||checkinDraft?.hasUnsent()||paymentDraft?.hasUnsent()||serviceDraft?.hasUnsent()||featureEdits();
  const canEdit=()=>directory?.capabilities?.edit===true&&(!selected||selected.enrollmentStatus==='active');
  const canPublish=()=>directory?.capabilities?.publish===true&&(!selected||selected.enrollmentStatus==='active');
  const cleanupFeature=()=>{featureCleanup?.();featureCleanup=null;draftEditor?.destroy();intakeEditor?.destroy();draftEditor=null;intakeEditor=null;};
  function frame(content) {
    libraryCleanup?.();libraryCleanup=null;
    root.innerHTML=`<div class="portal advisor-portal"><aside class="navigation"><a href="#/advisor" class="wordmark">Shelv</a><nav aria-label="Advisor workspace"><button class="nav-item active" id="advisor-clients"><span aria-hidden="true">▤</span> Clients</button></nav><div class="advisor-sidebar-note">${preview?'Synthetic preview':'Private workspace'}<small>${directory?canEdit()?'Advisor access':'View-only access':'Authorized advisors only'}</small></div><button id="advisor-signout" class="quiet advisor-signout">${preview?'Exit preview':'Sign out'}</button></aside><div class="workspace advisor-workspace">${content}</div></div>`;
    root.querySelector('.wordmark').onclick=event=>{event.preventDefault();backToClients();};
    $('#advisor-clients').onclick=()=>backToClients();$('#advisor-signout').onclick=()=>{if(hasPending()&&!confirm('Leave this workspace? Unsaved edits and pending retry information will be lost.'))return;onSignOut();};
  }
  function status(text,tone='neutral',actions='') {
    const host=$('#advisor-notice');if(host)host.innerHTML=`<div class="advisor-notice ${esc(tone)}" role="${tone==='error'?'alert':'status'}"><p>${esc(text)}</p>${actions}</div>`;
    $('#retry-intent')?.addEventListener('click',()=>mutate('retry'));
    $('#reload-record')?.addEventListener('click',()=>reloadSelected());
  }
  function showDialog(markup) {const template=document.createElement('template');template.innerHTML=markup;return modal.open({title:template.content.querySelector('h2')?.textContent.trim()||'Plan details',content:`<button class="close" data-dismiss aria-label="Close dialog">×</button>${markup}`});}
  function currentPreviewTarget(mode){
    return savedPreviewTarget({clientId:selected?.clientId,revision:session?.revision,draft:session?.view.draft,intakeVersion:session?.view.intake?.version,dirty:session?.dirty,pending:session?.pending,status:session?.status,hasUnsavedNotes:hasUnsavedNotes(),hasPendingPrivate:Boolean(intakeIntent),revoked:selected?.enrollmentStatus==='revoked'},mode);
  }
  function updatePreviewLink(link,mode){
    if(!link)return;
    const target=currentPreviewTarget(mode);
    if(target){link.href=previewHref(target,location.origin+location.pathname,{freshSignIn:true});link.removeAttribute('aria-disabled');link.removeAttribute('title');}
    else{link.removeAttribute('href');link.setAttribute('aria-disabled','true');link.title=mode==='draft'?'Save the current draft and resolve pending edits before previewing.':'Client preview is unavailable.';}
  }
  function wirePreviewLink(link,mode){
    if(!link)return;updatePreviewLink(link,mode);
    link.onclick=event=>{if(activeTab==='draft')readDraft();updatePreviewLink(link,mode);if(!currentPreviewTarget(mode))event.preventDefault();};
  }
  function beforeLeave() {return !hasPending() || confirm('Leave these edits? Unsaved changes and pending retry information will be lost.');}
  function backToClients({restore=false}={}) {
    if(isBusy()||!beforeLeave())return false;
    ++sequence;readController?.abort();cleanupFeature();clearTaskDrafts();selected=null;session=null;intakeIntent=null;meetingDraft=null;intakeUncertain=false;if(!restore)recordNavigation();void loadDirectory();return true;
  }
  function recordNavigation(replace=false){navigation.record({clientId:selected?.clientId||null,task:selected?activeTab:'overview'},{replace});}
  function selectTask(next,{restore=false}={}){
    if(!availableTabs.includes(next)||!selected||!session)return false;
    if(next===activeTab)return true;
    if(isBusy())return false;
    if(activeTab==='draft')readDraft();
    if(activeTab==='overview'&&(hasUnsavedNotes()||intakeIntent)){
      if(!confirm('Discard unsaved consultation and meeting notes? Pending retry information will also be lost.'))return false;
      intakeIntent=null;meetingDraft=null;
    }
    closeDialog();activeTab=next;if(!restore)recordNavigation();renderClient();return true;
  }
  async function restoreNavigation(target){
    if(disposed||!directory)return false;
    if(!target.clientId)return selected?backToClients({restore:true}):true;
    if(target.clientId===selected?.clientId)return selectTask(target.task,{restore:true});
    if(isBusy()||!beforeLeave())return false;
    if(!directory.clients.some(client=>client.clientId===target.clientId))return false;
    await openClient(target.clientId,{tab:target.task,replace:true,guard:false});return true;
  }
  async function loadDirectory() {
    const current=++sequence;readController?.abort();const controller=new AbortController();readController=controller;
    frame('<div class="advisor-loading" role="status" aria-live="polite"><span class="advisor-spinner" aria-hidden="true"></span> Loading your clients…</div>');
    try {
      const result=await request({action:'advisor_list'},{signal:controller.signal});if(disposed||current!==sequence)return false;
      if(!result || !Array.isArray(result.clients) || result.capabilities?.view!==true)throw Object.assign(new Error('Advisor access is not available for this account.'),{status:403});
      directory=result;renderDirectory();return true;
    }catch(error){if(error.name==='AbortError'||disposed||current!==sequence)return false;frame(`<header><h1>Clients</h1></header><div class="advisor-empty" role="alert"><h2>${error.status===403?'Advisor access required':'Unable to load clients'}</h2><p>${esc(copyError(error))}</p><button class="solid" id="retry-directory">Try again</button></div>`);$('#retry-directory').onclick=loadDirectory;return false;}
  }
  function renderDirectory() {
    const clients=directory.clients;
    frame(`<header class="advisor-header"><div><h1>Clients</h1></div><div class="advisor-header-buttons">${canAddClient?'<button class="solid" id="add-client">Add client</button>':''}<span class="advisor-access-pill">${canEdit()?'Advisor':'View only'}</span></div></header><div class="advisor-metrics"><div><strong>${clients.filter(c=>c.enrollmentStatus==='active').length}</strong><span>Active clients</span></div><div><strong>${clients.filter(c=>c.hasDraft).length}</strong><span>Drafts to review</span></div><div><strong>${clients.filter(c=>!c.publishedVersion&&c.enrollmentStatus==='active').length}</strong><span>First plan pending</span></div></div><section class="advisor-directory" aria-label="Client directory"><div class="advisor-directory-tools"><label class="advisor-search"><span class="sr-only">Search clients</span><span aria-hidden="true">⌕</span><input id="client-search" type="search" placeholder="Find a client" autocomplete="off" value="${esc(query)}"></label><label><span class="sr-only">Filter clients</span><select id="client-filter"><option value="">All clients</option><option value="draft">Has a draft</option><option value="pending">Needs first plan</option><option value="cancelled">Cancelled</option></select></label></div><div id="client-results"></div></section><details class="advisor-panel advisor-examples"><summary>Examples</summary><section class="advisor-sample" aria-label="Sample plan"><div><strong>Alex</strong><small>Sample · original example plan</small></div><a class="quiet" id="alex-sample" target="_blank" rel="noopener noreferrer" href="${esc(previewHref({kind:'sample',sampleId:'alex'},location.origin+location.pathname,{freshSignIn:true}))}">Alex · Sample ↗</a></section><section class="advisor-sample" aria-label="Maya sample plan"><div><strong>Maya</strong><small>Sample · approved example plan</small></div><a class="quiet" id="maya-sample" target="_blank" rel="noopener noreferrer" href="${esc(previewHref({kind:'sample',sampleId:'maya'},location.origin+location.pathname,{freshSignIn:true}))}">Maya · Sample ↗</a></section></details>`);
    if(requestWalkthroughs){const host=document.createElement('section');host.className='advisor-panel';host.setAttribute('aria-label','Walkthrough library');root.querySelector('.advisor-workspace').append(host);libraryCleanup=mountWalkthroughLibrary(host,{request:requestWalkthroughs});}
    $('#add-client')?.addEventListener('click',()=>admission.open());
    $('#client-filter').value=filter;$('#client-filter').onchange=event=>{filter=event.target.value;renderRows();};$('#client-search').oninput=event=>{query=event.target.value;renderRows();};renderRows();
  }
  function renderRows() {
    const clients=directory.clients.filter(client=>(client.displayName||'').toLowerCase().includes(query.toLowerCase())&&(!filter || filter==='draft'&&client.hasDraft || filter==='pending'&&!client.publishedVersion&&client.enrollmentStatus==='active' || filter==='cancelled'&&client.enrollmentStatus==='cancelled'));
    $('#client-results').innerHTML=clients.length?`<div class="advisor-table"><div class="advisor-table-heading" aria-hidden="true"><span>Client</span><span>Plan</span><span>Client access</span><span></span></div>${clients.map(client=>`<button class="advisor-client-row" data-client="${esc(client.clientId)}"><span class="advisor-client-name"><span class="avatar" aria-hidden="true">${esc((client.displayName||'C').split(' ').map(n=>n[0]).slice(0,2).join(''))}</span><span><strong>${esc(client.displayName||'Client')}</strong><small>${client.publishedVersion?`Published version ${client.publishedVersion}`:client.hasDraft?'First publication pending':'Consultation pending'}${client.enrollmentStatus==='cancelled'?' · Cancelled':client.enrollmentStatus==='revoked'?' · Revoked':''}</small></span></span><span class="advisor-plan-status">${client.hasDraft?'<i class="advisor-status-dot"></i> Draft saved':'No draft'}</span><span class="advisor-service-status">${client.enrollmentStatus==='revoked'?'Revoked':client.enrollmentStatus==='cancelled'?'Cancelled':'Active'}</span><span class="advisor-row-arrow" aria-hidden="true">›</span></button>`).join('')}</div>`:`<div class="advisor-empty"><h2>${directory.clients.length?'No matching clients':'No clients yet'}</h2><p>${directory.clients.length?'Try another name or filter.':'Invited clients will appear here when their access is ready.'}</p></div>`;
    root.querySelectorAll('[data-client]').forEach(button=>button.onclick=()=>openClient(button.dataset.client));
  }
  async function openClient(clientId,{tab='overview',replace=false,guard=true}={}) {
    const summary=directory.clients.find(c=>c.clientId===clientId);if(!summary)return;
    if(guard&&selected&&selected.clientId!==clientId&&!beforeLeave())return;
    const current=++sequence;readController?.abort();readController=new AbortController();cleanupFeature();
    if(selected?.clientId!==clientId){clearTaskDrafts();checkinDraft=createCheckinDraftState();paymentDraft=taskMemory();serviceDraft=taskMemory();}
    selected=summary;activeTab=availableTabs.includes(tab)?tab:'overview';
    frame(`<button id="back-clients" class="text-button">← All clients</button><div class="advisor-loading" role="status">Loading ${esc(summary.displayName)}’s workspace…</div>`);$('#back-clients').onclick=backToClients;
    try {const view=await request({action:'advisor_read_v2',clientId},{signal:readController.signal});if(disposed||current!==sequence)return;session=new DraftSession(clientId,view);intakeIntent=null;intakeUncertain=false;recordNavigation(replace);renderClient();}
    catch(error){if(error.name==='AbortError'||disposed||current!==sequence)return;frame(`<button id="back-clients" class="text-button">← All clients</button><div class="advisor-empty" role="alert"><h2>Unable to load this client</h2><p>${esc(copyError(error))}</p><button class="solid" id="retry-client">Try again</button></div>`);$('#back-clients').onclick=backToClients;$('#retry-client').onclick=()=>openClient(clientId);}
  }
  async function reloadSelected() {
    if(!selected||isBusy())return;
    if(hasPending()&&!confirm('Load the latest server version? Copy any edits you need first. Your local edits will be replaced.'))return;
    const id=selected.clientId,tab=activeTab;meetingDraft=null;clearTaskDrafts();checkinDraft=createCheckinDraftState();paymentDraft=taskMemory();serviceDraft=taskMemory();await openClient(id,{tab,replace:true});
  }
  function renderClient() {
    cleanupFeature();
    frame(`<button id="back-clients" class="text-button advisor-back">← All clients</button><header class="advisor-header"><div><h1>${esc(selected.displayName)}</h1><p class="advisor-subtitle">${selected.enrollmentStatus==='cancelled'?'Cancelled service · last entitled plan remains available':`Plan ${session.publishedVersion?`v${session.publishedVersion} published`:'not yet published'}`}</p></div><div class="advisor-header-buttons"><a class="quiet" id="preview-client" target="_blank" rel="noopener noreferrer">View as client ↗</a><button class="${activeTab==='draft'?'solid':'quiet'}" id="publish-plan" ${!canPublish()?'disabled':''}>Publish plan</button></div></header>${!canEdit()?'<p class="advisor-readonly">View-only access. Changes and publishing are unavailable.</p>':''}<div id="advisor-notice" aria-live="polite"></div><div class="view-tabs advisor-tabs" role="group" aria-label="Client workspace section">${availableTabs.map(tab=>`<button data-tab="${tab}" class="${tab===activeTab?'selected':''}" aria-pressed="${tab===activeTab}">${copy[tab]}</button>`).join('')}</div><section id="advisor-tab-content" class="advisor-tab-content" aria-label="${copy[activeTab]}"></section>`);
    $('#back-clients').onclick=backToClients;wirePreviewLink($('#preview-client'),'published');$('#publish-plan').onclick=confirmPublish;
    root.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{
      selectTask(button.dataset.tab);
    });
    root.querySelector('[data-tab].selected')?.scrollIntoView({block:'nearest',inline:'nearest'});
    if(activeTab==='overview')renderOverview();else if(activeTab==='draft')renderDraft();else if(activeTab==='history')renderHistory();else renderFeature();
    renderWriteStatus();updateControls();
  }
  function updateControls() {
    const locked=isBusy()||session.status==='uncertain'||session.status==='conflict';
    const publish=$('#publish-plan');if(publish)publish.disabled=!canPublish()||locked||session.dirty||!session.view.draft||(!session.draft.presentation&&!session.draft.recommendations.length)||Boolean(intakeIntent)||hasUnsavedNotes();
    const save=$('#save-draft');if(save)save.disabled=!canEdit()||locked;
    const privateLocked=privateBusy||Boolean(intakeIntent);
    draftEditor?.setDisabled(!canEdit()||locked);intakeEditor?.setDisabled(!canEdit()||privateLocked);
    root.querySelectorAll('#intake-goal,#intake-notes,#meeting-text').forEach(input=>{input.disabled=false;input.readOnly=!canEdit()||privateLocked;});
    root.querySelectorAll('#intake-form>select,#intake-form>button[type=button]').forEach(input=>input.disabled=!canEdit()||privateLocked);
    const saveIntakeButton=$('#save-intake');if(saveIntakeButton)saveIntakeButton.disabled=!canEdit()||privateBusy||Boolean(intakeIntent&&!['save_intake','save_intake_v2'].includes(intakeIntent.action));
    const saveMeetingButton=$('#save-meeting');if(saveMeetingButton)saveMeetingButton.disabled=!canEdit()||privateBusy||Boolean(intakeIntent&&intakeIntent.action!=='save_meeting_note');
    const openDraft=$('#open-draft');if(openDraft)openDraft.disabled=isBusy();
    root.querySelectorAll('#draft-private-note,#paste-draft,#use-current-routine').forEach(input=>{if(input.tagName==='TEXTAREA'||input.tagName==='INPUT'){input.disabled=false;input.readOnly=!canEdit()||locked;}else input.disabled=!canEdit()||locked;});
    updatePreviewLink($('#preview-client'),'published');updatePreviewLink($('#preview-draft'),'draft');
    if($('#draft-save-state'))$('#draft-save-state').textContent=session.dirty?'Unsaved changes':session.status==='saved'?'Draft saved':'All changes saved';
  }
  function renderHistory(){
    const publications=[...(session.view.client.history||[]),...(session.view.client.plan?[session.view.client.plan]:[])].sort((a,b)=>b.version-a.version);
    $('#advisor-tab-content').innerHTML=`<div class="advisor-section-title"><h2>Published plans</h2></div><div class="advisor-plan-history">${publications.length?publications.map(plan=>`<article class="advisor-panel advisor-history-item"><h3>Plan version ${plan.version}</h3><p class="advisor-subtitle">${plan.version===session.publishedVersion?'Current publication':'Earlier publication'}${plan.presentation?.preparedOn?` · Prepared ${esc(plan.presentation.preparedOn)}`:''}</p>${plan.presentation?.summary?`<p>${esc(plan.presentation.summary)}</p>`:''}<button class="quiet" data-history-version="${plan.version}">View plan version ${plan.version}</button></article>`).join(''):'<div class="advisor-empty"><h3>No published plan yet</h3></div>'}</div>`;
    root.querySelectorAll('[data-history-version]').forEach(button=>button.onclick=()=>openHistoryPlan(publications.find(plan=>plan.version===Number(button.dataset.historyVersion))));
  }
  function openHistoryPlan(plan){
    if(!plan)return;
    const presentation=plan.presentation;
    showDialog(`<h2 tabindex="-1">Plan version ${plan.version}</h2><p class="advisor-field-hint">Saved publication. Today’s routine is tracked separately.</p>${presentation?presentationConsultationMarkup(presentation)+presentationFeedMarkup(presentation,{readOnly:true})+presentationGuidesMarkup(presentation.routineGuides):planPreviewMarkup(plan)}`);
    dialog.querySelectorAll('[data-category]').forEach(button=>button.onclick=()=>{dialog.querySelectorAll('[data-category]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));dialog.querySelector(`#${CSS.escape(button.dataset.category)}-panel`)?.scrollIntoView({block:'start'});});
    dialog.querySelectorAll('[data-plan-card]').forEach(button=>button.onclick=()=>{
      const card=presentation.categoryCards.find(card=>card.id===button.dataset.planCard),open=()=>{showDialog(`<button class="text-button" data-history-back>Back to plan version ${plan.version}</button>${presentationCardDetail(card)}`);dialog.querySelector('[data-history-back]').onclick=()=>openHistoryPlan(plan);wireIngredientGuide(dialog,showDialog,open);return dialog;};open();
    });
    wireIngredientGuide(dialog,showDialog,()=>{openHistoryPlan(plan);return dialog;});
    return dialog;
  }
  function renderWriteStatus() {
    if(session.status==='uncertain')status('The reply was interrupted. Retry the same write to confirm its result. Editing is paused to protect that request.','error','<button id="retry-intent" class="quiet">Retry same write</button><button id="reload-record" class="text-button">Load latest version</button>');
    if(session.status==='conflict')status('This record changed. Your edits are preserved. Copy them before loading the latest version.','error','<button id="reload-record" class="quiet">Load latest version</button>');
    if(session.status==='published')status(`Plan version ${session.publishedVersion} published. Service payment controls when the client can access it.`);
  }
  function renderOverview() {
    const view=session.view;
    $('#advisor-tab-content').innerHTML=`<div class="advisor-overview-grid"><section class="advisor-panel"><div class="advisor-section-title"><div><h2>Private consultation notes</h2></div><span class="advisor-private-mark" aria-label="Private">◈</span></div><form id="intake-form"><label for="intake-goal">What the client wants to change</label><textarea id="intake-goal" maxlength="4000" rows="3" placeholder="Their goal, in their words…" ${!canEdit()?'disabled':''}>${esc(view.intake?.goal||'')}</textarea><label for="intake-notes">Intake & call notes</label><textarea id="intake-notes" maxlength="4000" rows="8" placeholder="Paste or write notes after a Zoom or in-person conversation…" ${!canEdit()?'disabled':''}>${esc(view.intake?.note||'')}</textarea><div class="advisor-form-footer"><span>${view.intake?'':'No consultation saved yet'}</span><button class="solid" id="save-intake" ${!canEdit()?'disabled':''}>Save notes</button></div><p id="intake-status" role="status"></p></form></section><aside class="advisor-overview-aside"><section class="advisor-panel"><h2>Plan progress</h2><dl class="advisor-progress"><div><dt>Published</dt><dd>${session.publishedVersion?`Version ${session.publishedVersion}`:'Not yet'}</dd></div><div><dt>Draft</dt><dd>${view.draft?'Saved privately':'Not started'}</dd></div><div><dt>Client access</dt><dd>${selected.enrollmentStatus==='revoked'?'Revoked':selected.enrollmentStatus==='cancelled'?'Cancelled':'Active'}</dd></div></dl><button id="open-draft" class="quiet">${view.draft?'Review draft':'Write the plan'} →</button></section><section class="advisor-panel"><h2>Product decisions</h2>${view.client.plan?.itemStates?.length?view.client.plan.itemStates.map(state=>{const item=view.client.plan.recommendations.find(r=>r.id===state.recommendationId);return `<div class="advisor-decision"><strong>${esc(title(item?.slot||'Product'))}</strong><span>${state.startedOn?`Started ${esc(state.startedOn)}`:state.received?'Received · start pending':state.choice==='approved'?'Approved · receipt pending':state.choice==='declined'?'Declined':'Awaiting decision'}</span>${state.reason?`<p>${esc(state.reason)}</p>`:''}</div>`;}).join(''):'<p class="advisor-subtitle">Decisions appear after a plan is published.</p>'}</section></aside></div>`;
    $('#intake-goal').maxLength=300;
    const baseline=document.createElement('section');baseline.className='advisor-public-consultation';baseline.innerHTML='<h3>Client-visible consultation & current routine</h3><p class="advisor-field-hint">Included in the published plan.</p><div id="intake-presentation"></div>';
    $('#intake-form').insertBefore(baseline,$('#intake-form .advisor-form-footer'));
    intakeEditor=mountPresentationEditor($('#intake-presentation'),{kind:'intake',value:intakeAuthoringValue(view),baselineLocked:Boolean(view.intake),disabled:!canEdit(),onChange:()=>{$('#intake-form').dataset.dirty='true';$('#intake-status').textContent='Unsaved consultation';updateControls();}});
    const meeting=document.createElement('section');meeting.className='advisor-panel advisor-meeting-notes';meeting.innerHTML=`<div class="advisor-section-title"><div><h2>Private meeting notes</h2></div></div><div class="advisor-note-history">${(view.meetingNotes||[]).slice().reverse().map(note=>`<article><time datetime="${esc(note.createdAt)}">${esc(new Date(note.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}))}</time><p>${esc(note.text).replace(/\n/g,'<br>')}</p></article>`).join('')||'<p class="advisor-field-hint">No meeting notes yet.</p>'}</div><form id="meeting-form"><label for="meeting-text">New meeting note</label><textarea id="meeting-text" rows="5" maxlength="20000" placeholder="Write or paste your notes…" ${!canEdit()?'disabled':''}></textarea><div class="advisor-form-footer"><span></span><button id="save-meeting" class="solid" ${!canEdit()?'disabled':''}>Save meeting note</button></div><p id="meeting-status" role="status"></p></form>`;
    $('#advisor-tab-content').append(meeting);
    $('#meeting-form').oninput=()=>{meetingDraft={clientId:selected.clientId,text:$('#meeting-text').value};$('#meeting-form').dataset.dirty='true';$('#meeting-status').textContent='Unsaved meeting note';updateControls();};$('#meeting-form').onsubmit=event=>{event.preventDefault();saveMeeting();};
    if(meetingDraft?.clientId===selected.clientId){$('#meeting-text').value=meetingDraft.text;$('#meeting-form').dataset.dirty='true';$('#meeting-status').textContent='Unsaved meeting note';}
    $('#open-draft').onclick=()=>selectTask('draft');
    $('#intake-form').oninput=()=>{$('#intake-form').dataset.dirty='true';$('#intake-status').textContent='Unsaved notes';updateControls();};
    $('#intake-form').onsubmit=event=>{event.preventDefault();saveIntake();};
  }
  async function saveIntake() {
    if(!canEdit()||isBusy())return;
    if(session.hasLocalDraftEdits||session.pending){$('#intake-status').textContent='Save or resolve your plan changes before saving a new consultation version.';return;}
    if(intakeIntent&&!['save_intake','save_intake_v2'].includes(intakeIntent.action)){status('Resolve the pending meeting note before saving consultation notes.','error');return;}
    if(!intakeIntent){
      const goal=$('#intake-goal').value.trim(),note=$('#intake-notes').value,presentation=intakeEditor.getValue(),baseline=presentation.baselineRoutine.filter(step=>step.kind==='product').map(step=>({slot:step.slot,productId:step.productId}));
      const savedBaseline=session.view.intake?intakeAuthoringValue(session.view).baselineRoutine.filter(step=>step.kind==='product').map(step=>({slot:step.slot,productId:step.productId})):baseline;
      const errors=validatePresentation(presentation,{kind:'intake',baseline:savedBaseline});
      if(!goal||Array.from(goal).length>300)errors.unshift('Add a goal of at most 300 characters.');
      if(errors.length){$('#intake-status').textContent=errors.join(' ');return;}
      intakeIntent={action:'save_intake_v2',clientId:selected.clientId,requestId:crypto.randomUUID(),expectedRevision:session.revision,goal,note,baseline,presentation};
    }
    privateBusy=true;updateControls();const button=$('#save-intake');button.disabled=true;$('#intake-status').textContent='Saving notes…';root.querySelectorAll('#intake-form textarea').forEach(input=>input.readOnly=true);
    try {const result=await request(structuredClone(intakeIntent));if(disposed)return;if(!Number.isSafeInteger(result?.revision)||result.operation!==intakeIntent.action||result.revision<=session.revision)throw Object.assign(new Error('Could not verify the saved notes.'),{status:503});intakeIntent=null;intakeUncertain=false;const id=selected.clientId;await openClient(id);if(!disposed)status('Consultation notes saved.');}
    catch(error){if(disposed)return;intakeUncertain=!error.status||error.status>=500||error.status===408||error.status===429;if(!intakeUncertain)intakeIntent=null;$('#intake-status').textContent=copyError(error);button.disabled=false;button.textContent=intakeUncertain?'Retry same save':'Save notes';root.querySelectorAll('#intake-form textarea').forEach(input=>input.disabled=intakeUncertain);if(error.status===409)status(copyError(error),'error','<button class="quiet" id="reload-record">Load latest version</button>');}finally{privateBusy=false;if(!disposed)updateControls();}
  }
  async function saveMeeting() {
    if(!canEdit()||isBusy())return;
    if(session.hasLocalDraftEdits||session.pending||$('#intake-form')?.dataset.dirty==='true'){ $('#meeting-status').textContent='Save or resolve your other changes before adding a meeting note.';return; }
    if(intakeIntent&&intakeIntent.action!=='save_meeting_note'){status('Resolve the pending consultation save before adding a meeting note.','error');return;}
    const text=$('#meeting-text').value;if(!intakeIntent&&!text.trim()){$('#meeting-status').textContent='Write or paste a note first.';return;}
    if(!intakeIntent)intakeIntent={action:'save_meeting_note',clientId:selected.clientId,requestId:crypto.randomUUID(),expectedRevision:session.revision,kind:'notes',text};
    privateBusy=true;updateControls();const button=$('#save-meeting');button.disabled=true;$('#meeting-text').readOnly=true;$('#meeting-status').textContent='Saving private note…';
    try {const result=await request(structuredClone(intakeIntent));if(disposed)return;if(!Number.isSafeInteger(result?.revision)||result.operation!=='save_meeting_note'||result.revision<=session.revision)throw Object.assign(new Error('Could not verify the saved note.'),{status:503});intakeIntent=null;meetingDraft=null;await openClient(selected.clientId);if(!disposed)status('Meeting note saved.');}
    catch(error){if(disposed)return;const uncertain=!error.status||error.status>=500||error.status===408||error.status===429;if(!uncertain)intakeIntent=null;button.disabled=false;button.textContent=uncertain?'Retry same note':'Save meeting note';$('#meeting-text').disabled=uncertain;$('#meeting-status').textContent=copyError(error);if(error.status===409)status(copyError(error),'error','<button class="quiet" id="reload-record">Load latest version</button>');}finally{privateBusy=false;if(!disposed)updateControls();}
  }
  function productOptions(value) {
    return `${value&&!catalog[value]?`<option value="${esc(value)}">${esc(value)} · details unavailable</option>`:''}<option value="">Choose product</option>${Object.entries(catalog).map(([id,p])=>`<option value="${id}" ${id===value?'selected':''}>${esc(p.name)}</option>`).join('')}`;
  }
  function renderDraft() {
    draftEditor?.destroy();draftEditor=null;
    if(!session.draft.presentation)session.edit({...session.draft,presentation:planAuthoringValue(session.view,selected.displayName)});
    const draft=session.draft,currentPresentation=planAuthoringValue({...session.view,draft:null},selected.displayName),needsCurrentRoutine=currentPresentation.routineBasis&&(draft.presentation?.routineBasis?JSON.stringify(currentPresentation.routineBasis)!==JSON.stringify(draft.presentation.routineBasis):currentPresentation.routineBasis.products.some(product=>product.source.kind==='activation'));
    $('#advisor-tab-content').innerHTML=`<div class="advisor-section-title"><div><h2>Plan draft</h2><p>Client-visible after publication.</p></div><button class="quiet" id="paste-draft" ${!canEdit()?'disabled':''}>Paste draft</button></div>${needsCurrentRoutine?'<section class="advisor-notice"><p>Review this draft against the client’s current routine. Start a fresh plan from their current products before publishing.</p><button class="quiet" id="use-current-routine">Use current routine</button></section>':''}<form id="draft-form"><div id="plan-presentation"></div><section class="advisor-panel advisor-private-draft"><label for="draft-private-note">Private draft note</label><textarea id="draft-private-note" rows="3" maxlength="4000">${esc(draft.advisorNote)}</textarea></section><div id="draft-errors" role="alert"></div><div class="advisor-save-bar"><span id="draft-save-state" role="status">All changes saved</span><div><a class="quiet" id="preview-draft" target="_blank" rel="noopener noreferrer">Preview saved draft ↗</a><button class="solid" id="save-draft">Save draft</button></div></div></form>`;
    draftEditor=mountPresentationEditor($('#plan-presentation'),{value:draft.presentation,disabled:!canEdit()||['saving','uncertain','conflict'].includes(session.status),onChange:presentation=>{session.edit({...session.draft,presentation,recommendations:deriveRecommendations(presentation)});updateControls();}});
    $('#use-current-routine')?.addEventListener('click',()=>{if(!canEdit()||isBusy()||['uncertain','saving','conflict'].includes(session.status))return;if(!confirm('Replace the plan content in this editor with a fresh plan based on the client’s current routine? Copy any plan text you want to keep first. Your private note stays here. Nothing changes for the client until you save and publish.'))return;session.edit({...session.draft,intakeVersion:session.view.intake?.version||session.draft.intakeVersion,recommendations:[],presentation:currentPresentation});renderDraft();updateControls();});
    $('#draft-private-note').oninput=()=>{readDraft();updateControls();};
    $('#draft-form').onsubmit=event=>{event.preventDefault();mutate('save');};wirePreviewLink($('#preview-draft'),'draft');
    $('#paste-draft').onclick=()=>{showDialog('<h2 tabindex="-1">Paste a draft</h2><p>Paste the full draft JSON with intakeVersion, recommendations, advisorNote and presentation. Review it before saving or publishing.</p><label for="paste-content">Draft JSON</label><textarea id="paste-content" rows="12" spellcheck="false"></textarea><p id="paste-error" role="alert"></p><div class="advisor-dialog-actions"><button data-dismiss class="quiet">Cancel</button><button id="apply-paste" class="solid">Use this draft</button></div>');dialog.querySelector('#apply-paste').onclick=()=>{try{const draft=parseDraftPaste(dialog.querySelector('#paste-content').value);if(!draft.presentation)throw new Error('Include the full presentation so client-visible content is preserved.');session.edit(draft);closeDialog();renderDraft();updateControls();}catch(error){dialog.querySelector('#paste-error').textContent=error.message;}};};
  }
  function readDraft() {
    if(!draftEditor||!$('#draft-form')||['uncertain','saving','conflict'].includes(session.status))return;
    const presentation=draftEditor.getValue();session.edit({...session.draft,presentation,recommendations:deriveRecommendations(presentation),advisorNote:$('#draft-private-note').value});
  }
  async function mutate(action) {
    if(!canEdit()||isBusy())return;
    if(action==='save') {readDraft();const errors=validateDraft(session.draft);if(session.draft.presentation&&session.view.intake?.presentation)errors.push(...validatePresentation(session.draft.presentation,{baseline:session.draft.presentation.routineBasis?.products||session.view.intake.presentation.baselineRoutine.filter(step=>step.kind==='product').map(step=>({slot:step.slot,productId:step.productId})),recommendations:session.draft.recommendations}));if(errors.length){$('#draft-errors').innerHTML=`<div class="advisor-notice error"><p>${errors.map(esc).join('<br>')}</p></div>`;$('#draft-errors').scrollIntoView({block:'nearest'});return;}}
    const promise=action==='save'?session.save(request):action==='retry'?session.retry(request):session.publish(request);updateControls();
    try {const receipt=await promise;if(disposed)return;if(['publish','publish_v2'].includes(receipt.operation)){try{const latest=await request({action:'advisor_read_v2',clientId:selected.clientId});if(disposed)return;session.reload(latest);session.status='published';activeTab='history';recordNavigation(true);}catch{if(disposed)return;renderClient();status(`Plan version ${receipt.publishedVersion} was published. Load the latest version to refresh its details.`,'neutral','<button id="reload-record" class="quiet">Load latest version</button>');return;}}renderClient();}catch(error){if(disposed)return;status(copyError(error),'error');renderWriteStatus();updateControls();}
  }
  function confirmPublish() {
    if(!canPublish()||isBusy()||intakeIntent||hasUnsavedNotes()||session.dirty||!session.view.draft)return;
    showDialog(`<h2 tabindex="-1">Publish this plan?</h2><p>${esc(selected.displayName)} will receive this version once service payment is verified. Private consultation and draft notes stay in this workspace.</p><p>${session.draft.recommendations.length} selected ${session.draft.recommendations.length===1?'replacement':'replacements'} · next version ${session.publishedVersion+1}</p><div class="advisor-dialog-actions"><button class="quiet" data-dismiss>Keep editing</button><button class="solid" id="confirm-publish">Publish plan</button></div>`);
    dialog.querySelector('#confirm-publish').onclick=()=>{closeDialog();mutate('publish');};
  }
  async function renderFeature() {
    const host=$('#advisor-tab-content');host.innerHTML='<div class="advisor-loading" role="status">Loading…</div>';
    try {const current=sequence,tab=activeTab,clientId=selected.clientId;let clientView=session.view.client;
      if(tab==='payments'){clientView=(await request({action:'advisor_read_v2',clientId},{signal:readController?.signal})).client;if(disposed||current!==sequence||tab!==activeTab)return;}
      const plan=clientView.plan;
      const quoteContext={publicationVersion:plan?.version||0,recommendations:(plan?.recommendations||[]).map(item=>{const product=plan.presentation?.categoryCards?.find(card=>card.recommendationId===item.id)?.proposedProduct,name=product?.name||catalog[item.proposedProductId]?.name||title(item.slot),brand=product?.brand;return {id:item.id,label:brand&&!name.toLowerCase().includes(brand.toLowerCase())?brand+' '+name:name,approved:plan.itemStates?.some(state=>state.recommendationId===item.id&&state.choice==='approved')===true};})};
      const cleanup=await mountFeature(activeTab,host,{clientId,mode:'advisor',canWrite:activeTab==='service'?directory.capabilities.edit===true:canEdit(),canConfirm:directory.capabilities.confirmPayments===true,capabilities:directory.capabilities,canPublish:directory.capabilities.publish===true,canConfirmPayments:directory.capabilities.confirmPayments===true,clientView,getClientView:async()=>{const fresh=await request({action:'advisor_read_v2',clientId});return fresh.client;},displayName:selected.displayName,quoteContext,...(activeTab==='checkins'?{draftState:checkinDraft}:activeTab==='payments'?{taskState:paymentDraft}:activeTab==='service'?{taskState:serviceDraft}:{}),productLabels:Object.fromEntries((plan?.recommendations||[]).map(item=>[item.id,catalog[item.proposedProductId]?.name||item.proposedProductId])),...(clientView.schemaVersion===2?{productDescriptor:(version,id)=>productDescriptor(clientView,version,id)}:{})});if(disposed||current!==sequence||tab!==activeTab)cleanup?.();else featureCleanup=cleanup;}
    catch(error){if(disposed)return;host.innerHTML=`<div class="advisor-empty" role="alert"><h2>${copy[activeTab]} unavailable</h2><p>This section could not load. Try again in a moment.</p><button class="quiet" id="retry-feature">Try again</button></div>`;$('#retry-feature')?.addEventListener('click',renderFeature);}
  }
  if(requestAdmission)requestAdmission({action:'capabilities'}).then(result=>{if(disposed)return;canAddClient=result?.canAddClient===true;if(directory&&!selected)renderDirectory();}).catch(()=>{});
  const beforeUnload=event=>{if(hasPending()) {event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',beforeUnload);
  const markFeatureEdit=event=>{if(['payments','service'].includes(activeTab)){const form=event.target.closest('form');if(form&&$('#advisor-tab-content')?.contains(form))form.dataset.dirty='true';}};
  root.addEventListener('input',markFeatureEdit);root.addEventListener('change',markFeatureEdit);
  const target=navigation.read();
  const initialize=async()=>{if(initialDirectory){directory=initialDirectory;renderDirectory();}else await loadDirectory();if(disposed||!directory)return;if(target?.clientId&&directory.clients.some(client=>client.clientId===target.clientId))await openClient(target.clientId,{tab:target.task,replace:true});else recordNavigation(true);};void initialize();
  return ()=>{disposed=true;navigation.dispose();libraryCleanup?.();admission?.dispose();++sequence;readController?.abort();cleanupFeature();clearTaskDrafts();modal.dispose();window.removeEventListener('beforeunload',beforeUnload);root.removeEventListener('input',markFeatureEdit);root.removeEventListener('change',markFeatureEdit);root.innerHTML='';};
}
