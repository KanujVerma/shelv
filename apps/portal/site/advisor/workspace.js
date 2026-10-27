import {createAdmissionDialog} from './admission.js';
import {DraftSession,esc,money,title,validateDraft,parseDraftPaste} from './model.js';
import {catalog} from './catalog.js';
import {previewHref,savedPreviewTarget} from '../preview/target.js';
import {mountPresentationEditor} from './presentation-editor.js';
import {deriveRecommendations,validatePresentation} from './presentation-model.js';
import {intakeAuthoringValue,planAuthoringValue} from './authoring.js';
import {productDescriptor} from '../client/presentation-renderer.js';

const tabs=['overview','draft','payments','checkins'];
const copy={overview:'Consultation',draft:'Plan draft',payments:'Payments',checkins:'Check-ins'};
const copyError=error=>error.status===409?'This record changed while you were working. Your edits are still here. Copy anything you need, then load the latest version.':error.message || 'We could not load this workspace. Try again.';

export function mountAdvisorWorkspace(root,{request,mountFeature,onSignOut,requestAdmission=null,preview=false,scenario='ready',initialDirectory=null}) {
  let directory=null,selected=null,session=null,activeTab='overview',filter='',query='',disposed=false,featureCleanup=null,sequence=0,readController=null,intakeIntent=null,intakeUncertain=false,privateBusy=false,meetingDraft=null,draftEditor=null,intakeEditor=null;
  let canAddClient=false;
  const admission=requestAdmission?createAdmissionDialog({request:requestAdmission,onAdded:()=>loadDirectory(),onOpenClient:async id=>{const current=await loadDirectory();if(current&&!disposed)await openClient(id);}}):null;
  const $=selector=>root.querySelector(selector);
  const dialog=document.createElement('dialog');dialog.className='advisor-dialog';document.body.append(dialog);
  const closeDialog=()=>{dialog.close();dialog.innerHTML='';};
  dialog.addEventListener('click',event=>{if(event.target.dataset.dismiss!==undefined)closeDialog();});
  const isBusy=()=>session?.status==='saving'||privateBusy;
  const hasUnsavedNotes=()=>$('#intake-form')?.dataset.dirty==='true'||$('#meeting-form')?.dataset.dirty==='true';
  const hasPending=()=>admission?.hasPending() || session?.dirty || session?.pending || intakeIntent || meetingDraft || hasUnsavedNotes();
  const canEdit=()=>directory?.capabilities?.edit===true&&(!selected||selected.enrollmentStatus==='active');
  const canPublish=()=>directory?.capabilities?.publish===true&&(!selected||selected.enrollmentStatus==='active');
  const cleanupFeature=()=>{featureCleanup?.();featureCleanup=null;draftEditor?.destroy();intakeEditor?.destroy();draftEditor=null;intakeEditor=null;};
  function frame(content) {
    root.innerHTML=`<div class="portal advisor-portal"><aside class="navigation"><a href="#/advisor" class="wordmark">shelv<span>concierge</span></a><nav aria-label="Advisor workspace"><button class="nav-item active" id="advisor-clients"><span aria-hidden="true">▤</span> Clients</button></nav><div class="advisor-sidebar-note">${preview?'Synthetic preview':'Private workspace'}<small>${directory?canEdit()?'Advisor access':'View-only access':'Authorized advisors only'}</small></div><button id="advisor-signout" class="quiet advisor-signout">${preview?'Exit preview':'Sign out'}</button></aside><div class="workspace advisor-workspace">${content}</div></div>`;
    $('#advisor-clients').onclick=()=>backToClients();$('#advisor-signout').onclick=()=>{if(hasPending()&&!confirm('Leave this workspace? Unsaved edits and pending retry information will be lost.'))return;onSignOut();};
  }
  function status(text,tone='neutral',actions='') {
    const host=$('#advisor-notice');if(host)host.innerHTML=`<div class="advisor-notice ${esc(tone)}" role="${tone==='error'?'alert':'status'}"><p>${esc(text)}</p>${actions}</div>`;
    $('#retry-intent')?.addEventListener('click',()=>mutate('retry'));
    $('#reload-record')?.addEventListener('click',()=>reloadSelected());
  }
  function showDialog(markup) {dialog.innerHTML=`<button class="close" data-dismiss aria-label="Close dialog">×</button>${markup}`;if(!dialog.open)dialog.showModal();dialog.querySelector('h2')?.focus();}
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
  function backToClients() {
    if(isBusy()||!beforeLeave())return;
    ++sequence;readController?.abort();cleanupFeature();selected=null;session=null;intakeIntent=null;meetingDraft=null;intakeUncertain=false;loadDirectory();
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
    frame(`<header class="advisor-header"><div><p class="advisor-eyebrow">Your workspace</p><h1>Clients</h1><p class="advisor-subtitle">A clear view of each plan and the next conversation.</p></div><div class="advisor-header-buttons">${canAddClient?'<button class="solid" id="add-client">Add client</button>':''}<span class="advisor-access-pill">${canEdit()?'Advisor':'View only'}</span></div></header><div class="advisor-metrics"><div><strong>${clients.filter(c=>c.enrollmentStatus==='active').length}</strong><span>Active clients</span></div><div><strong>${clients.filter(c=>c.hasDraft).length}</strong><span>Drafts to review</span></div><div><strong>${clients.filter(c=>!c.publishedVersion&&c.enrollmentStatus==='active').length}</strong><span>First plan pending</span></div></div><section class="advisor-directory" aria-label="Client directory"><div class="advisor-directory-tools"><label class="advisor-search"><span class="sr-only">Search clients</span><span aria-hidden="true">⌕</span><input id="client-search" type="search" placeholder="Find a client" autocomplete="off" value="${esc(query)}"></label><label><span class="sr-only">Filter clients</span><select id="client-filter"><option value="">All clients</option><option value="draft">Has a draft</option><option value="pending">Needs first plan</option><option value="cancelled">Cancelled</option></select></label></div><div id="client-results"></div></section><section class="advisor-panel advisor-sample" aria-label="Sample plan"><div><strong>Alex</strong><small>Sample · original example plan</small></div><a class="quiet" id="alex-sample" target="_blank" rel="noopener noreferrer" href="${esc(previewHref({kind:'sample',sampleId:'alex'},location.origin+location.pathname,{freshSignIn:true}))}">Alex · Sample ↗</a></section><section class="advisor-panel advisor-sample" aria-label="Maya sample plan"><div><strong>Maya</strong><small>Sample · approved example plan</small></div><a class="quiet" id="maya-sample" target="_blank" rel="noopener noreferrer" href="${esc(previewHref({kind:'sample',sampleId:'maya'},location.origin+location.pathname,{freshSignIn:true}))}">Maya · Sample ↗</a></section>`);
    $('#add-client')?.addEventListener('click',()=>admission.open());
    $('#client-filter').value=filter;$('#client-filter').onchange=event=>{filter=event.target.value;renderRows();};$('#client-search').oninput=event=>{query=event.target.value;renderRows();};renderRows();
  }
  function renderRows() {
    const clients=directory.clients.filter(client=>(client.displayName||'').toLowerCase().includes(query.toLowerCase())&&(!filter || filter==='draft'&&client.hasDraft || filter==='pending'&&!client.publishedVersion&&client.enrollmentStatus==='active' || filter==='cancelled'&&client.enrollmentStatus==='cancelled'));
    $('#client-results').innerHTML=clients.length?`<div class="advisor-table"><div class="advisor-table-heading" aria-hidden="true"><span>Client</span><span>Plan</span><span>Client access</span><span></span></div>${clients.map(client=>`<button class="advisor-client-row" data-client="${esc(client.clientId)}"><span class="advisor-client-name"><span class="avatar" aria-hidden="true">${esc((client.displayName||'C').split(' ').map(n=>n[0]).slice(0,2).join(''))}</span><span><strong>${esc(client.displayName||'Client')}</strong><small>${client.hasDraft?'Draft ready to review':client.publishedVersion?`Published plan · version ${client.publishedVersion}`:'Consultation to complete'}</small></span></span><span class="advisor-plan-status">${client.hasDraft?'<i class="advisor-status-dot"></i> Draft':client.publishedVersion?'Published':'Not started'}</span><span class="advisor-service-status">${client.enrollmentStatus==='revoked'?'Revoked':client.enrollmentStatus==='cancelled'?'Cancelled':'Active'}</span><span class="advisor-row-arrow" aria-hidden="true">↗</span></button>`).join('')}</div>`:`<div class="advisor-empty"><h2>${directory.clients.length?'No matching clients':'No clients yet'}</h2><p>${directory.clients.length?'Try another name or filter.':'Invited clients will appear here when their access is ready.'}</p></div>`;
    root.querySelectorAll('[data-client]').forEach(button=>button.onclick=()=>openClient(button.dataset.client));
  }
  async function openClient(clientId) {
    const summary=directory.clients.find(c=>c.clientId===clientId);if(!summary)return;
    const current=++sequence;readController?.abort();readController=new AbortController();cleanupFeature();selected=summary;activeTab='overview';
    frame(`<button id="back-clients" class="text-button">← All clients</button><div class="advisor-loading" role="status">Loading ${esc(summary.displayName)}’s workspace…</div>`);$('#back-clients').onclick=backToClients;
    try {const view=await request({action:'advisor_read_v2',clientId},{signal:readController.signal});if(disposed||current!==sequence)return;session=new DraftSession(clientId,view);intakeIntent=null;intakeUncertain=false;renderClient();}
    catch(error){if(error.name==='AbortError'||disposed||current!==sequence)return;frame(`<button id="back-clients" class="text-button">← All clients</button><div class="advisor-empty" role="alert"><h2>Unable to load this client</h2><p>${esc(copyError(error))}</p><button class="solid" id="retry-client">Try again</button></div>`);$('#back-clients').onclick=backToClients;$('#retry-client').onclick=()=>openClient(clientId);}
  }
  async function reloadSelected() {
    if(!selected||isBusy())return;
    if(hasPending()&&!confirm('Load the latest server version? Copy any edits you need first. Your local edits will be replaced.'))return;
    const id=selected.clientId,tab=activeTab;meetingDraft=null;await openClient(id);if(session){activeTab=tab;renderClient();}
  }
  function renderClient() {
    cleanupFeature();
    frame(`<button id="back-clients" class="text-button advisor-back">← All clients</button><header class="advisor-header"><div><p class="advisor-eyebrow">Client workspace</p><h1>${esc(selected.displayName)}</h1><p class="advisor-subtitle">${selected.enrollmentStatus==='cancelled'?'Cancelled service · last entitled plan remains available':`Plan ${session.publishedVersion?`v${session.publishedVersion} published`:'not yet published'}`}</p></div><div class="advisor-header-buttons"><a class="quiet" id="preview-client" target="_blank" rel="noopener noreferrer">View as client ↗</a><button class="solid" id="publish-plan" ${!canPublish()?'disabled':''}>Publish plan</button></div></header>${!canEdit()?'<p class="advisor-readonly">View-only access. Changes and publishing are unavailable.</p>':''}<div id="advisor-notice" aria-live="polite"></div><div class="view-tabs advisor-tabs" role="group" aria-label="Client workspace section">${tabs.map(tab=>`<button data-tab="${tab}" class="${tab===activeTab?'selected':''}" aria-pressed="${tab===activeTab}">${copy[tab]}</button>`).join('')}</div><section id="advisor-tab-content" class="advisor-tab-content" aria-label="${copy[activeTab]}"></section>`);
    $('#back-clients').onclick=backToClients;wirePreviewLink($('#preview-client'),'published');$('#publish-plan').onclick=confirmPublish;
    root.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{
      if(isBusy())return;if(activeTab==='draft')readDraft();if(activeTab==='overview'&&(hasUnsavedNotes()||intakeIntent)){if(!confirm('Leave your unsaved or pending private notes?'))return;intakeIntent=null;meetingDraft=null;}
      activeTab=button.dataset.tab;renderClient();
    });
    if(activeTab==='overview')renderOverview();else if(activeTab==='draft')renderDraft();else renderFeature();
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
  function renderWriteStatus() {
    if(session.status==='uncertain')status('The reply was interrupted. Retry the same write to confirm its result. Editing is paused to protect that request.','error','<button id="retry-intent" class="quiet">Retry same write</button><button id="reload-record" class="text-button">Load latest version</button>');
    if(session.status==='conflict')status('This record changed. Your edits are preserved. Copy them before loading the latest version.','error','<button id="reload-record" class="quiet">Load latest version</button>');
    if(session.status==='saved')status('Draft saved. Review the client preview before publishing.');
    if(session.status==='published')status(`Plan version ${session.publishedVersion} published. Service payment controls when the client can access it.`);
  }
  function renderOverview() {
    const view=session.view;
    $('#advisor-tab-content').innerHTML=`<div class="advisor-overview-grid"><section class="advisor-panel"><div class="advisor-section-title"><div><h2>Consultation notes</h2><p>Private · visible to authorized advisors only</p></div><span class="advisor-private-mark" aria-label="Private">◈</span></div><form id="intake-form"><label for="intake-goal">What the client wants to change</label><textarea id="intake-goal" maxlength="4000" rows="3" placeholder="Their goal, in their words…" ${!canEdit()?'disabled':''}>${esc(view.intake?.goal||'')}</textarea><label for="intake-notes">Intake & call notes</label><textarea id="intake-notes" maxlength="4000" rows="8" placeholder="Paste or write notes after a Zoom or in-person conversation…" ${!canEdit()?'disabled':''}>${esc(view.intake?.note||'')}</textarea><div class="advisor-form-footer"><span>${view.intake?'':'No consultation saved yet'}</span><button class="solid" id="save-intake" ${!canEdit()?'disabled':''}>Save notes</button></div><p id="intake-status" role="status"></p></form></section><aside class="advisor-overview-aside"><section class="advisor-panel"><h2>Plan progress</h2><dl class="advisor-progress"><div><dt>Published</dt><dd>${session.publishedVersion?`Version ${session.publishedVersion}`:'Not yet'}</dd></div><div><dt>Draft</dt><dd>${view.draft?'Saved privately':'Not started'}</dd></div><div><dt>Client access</dt><dd>${selected.enrollmentStatus==='revoked'?'Revoked':selected.enrollmentStatus==='cancelled'?'Cancelled':'Active'}</dd></div></dl><button id="open-draft" class="quiet">${view.draft?'Review draft':'Write the plan'} →</button></section><section class="advisor-panel"><h2>Product decisions</h2>${view.client.plan?.itemStates?.length?view.client.plan.itemStates.map(state=>{const item=view.client.plan.recommendations.find(r=>r.id===state.recommendationId);return `<div class="advisor-decision"><strong>${esc(title(item?.slot||'Product'))}</strong><span>${state.startedOn?`Started ${esc(state.startedOn)}`:state.received?'Received · start pending':state.choice==='approved'?'Approved · receipt pending':state.choice==='declined'?'Declined':'Awaiting decision'}</span>${state.reason?`<p>${esc(state.reason)}</p>`:''}</div>`;}).join(''):'<p class="advisor-subtitle">Decisions appear after a plan is published.</p>'}</section></aside></div>`;
    $('#intake-goal').maxLength=300;
    const baseline=document.createElement('section');baseline.className='advisor-public-consultation';baseline.innerHTML='<h3>Client-visible consultation & current routine</h3><p class="advisor-field-hint">Write what the client may read in their published plan. Private notes above stay in this workspace.</p><div id="intake-presentation"></div>';
    $('#intake-form').insertBefore(baseline,$('#intake-form .advisor-form-footer'));
    intakeEditor=mountPresentationEditor($('#intake-presentation'),{kind:'intake',value:intakeAuthoringValue(view),baselineLocked:Boolean(view.intake),disabled:!canEdit(),onChange:()=>{$('#intake-form').dataset.dirty='true';$('#intake-status').textContent='Unsaved consultation';updateControls();}});
    const meeting=document.createElement('section');meeting.className='advisor-panel advisor-meeting-notes';meeting.innerHTML=`<div class="advisor-section-title"><div><h2>Meeting notes</h2><p>Write or paste notes after a conversation</p></div></div><div class="advisor-note-history">${(view.meetingNotes||[]).slice().reverse().map(note=>`<article><time datetime="${esc(note.createdAt)}">${esc(new Date(note.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}))}</time><p>${esc(note.text).replace(/\n/g,'<br>')}</p></article>`).join('')||'<p class="advisor-field-hint">No meeting notes yet.</p>'}</div><form id="meeting-form"><label for="meeting-text">New meeting note</label><textarea id="meeting-text" rows="5" maxlength="20000" placeholder="Write or paste your notes…" ${!canEdit()?'disabled':''}></textarea><div class="advisor-form-footer"><span></span><button id="save-meeting" class="solid" ${!canEdit()?'disabled':''}>Save meeting note</button></div><p id="meeting-status" role="status"></p></form>`;
    $('#advisor-tab-content').append(meeting);
    $('#meeting-form').oninput=()=>{meetingDraft={clientId:selected.clientId,text:$('#meeting-text').value};$('#meeting-form').dataset.dirty='true';$('#meeting-status').textContent='Unsaved meeting note';updateControls();};$('#meeting-form').onsubmit=event=>{event.preventDefault();saveMeeting();};
    if(meetingDraft?.clientId===selected.clientId){$('#meeting-text').value=meetingDraft.text;$('#meeting-form').dataset.dirty='true';$('#meeting-status').textContent='Unsaved meeting note';}
    $('#open-draft').onclick=()=>{if(isBusy())return;if((hasUnsavedNotes()||intakeIntent)&&!confirm('Leave your unsaved or pending private notes?'))return;meetingDraft=null;intakeIntent=null;activeTab='draft';renderClient();};
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
    $('#advisor-tab-content').innerHTML=`<div class="advisor-section-title"><div><h2>The next plan</h2><p>Write the complete client-facing plan, with one selected replacement per category.</p></div><button class="quiet" id="paste-draft" ${!canEdit()?'disabled':''}>Paste draft</button></div>${needsCurrentRoutine?'<section class="advisor-notice"><p>Review this draft against the client’s current routine. Start a fresh plan from their current products before publishing.</p><button class="quiet" id="use-current-routine">Use current routine</button></section>':''}<form id="draft-form"><div id="plan-presentation"></div><section class="advisor-panel advisor-private-draft"><label for="draft-private-note">Private draft note</label><textarea id="draft-private-note" rows="3" maxlength="4000">${esc(draft.advisorNote)}</textarea></section><div id="draft-errors" role="alert"></div><div class="advisor-save-bar"><span id="draft-save-state" role="status">All changes saved</span><div><a class="quiet" id="preview-draft" target="_blank" rel="noopener noreferrer">Preview saved draft ↗</a><button class="solid" id="save-draft">Save draft</button></div></div></form>`;
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
    try {const receipt=await promise;if(disposed)return;if(['publish','publish_v2'].includes(receipt.operation)){try{const latest=await request({action:'advisor_read_v2',clientId:selected.clientId});if(disposed)return;session.reload(latest);session.status='published';}catch{if(disposed)return;renderClient();status(`Plan version ${receipt.publishedVersion} was published. Load the latest version to refresh its details.`,'neutral','<button id="reload-record" class="quiet">Load latest version</button>');return;}}renderClient();}catch(error){if(disposed)return;status(copyError(error),'error');renderWriteStatus();updateControls();}
  }
  function confirmPublish() {
    if(!canPublish()||isBusy()||intakeIntent||hasUnsavedNotes()||session.dirty||!session.view.draft)return;
    showDialog(`<h2 tabindex="-1">Publish this plan?</h2><p>${esc(selected.displayName)} will receive this version once service payment is verified. Private consultation and draft notes stay in this workspace.</p><p>${session.draft.recommendations.length} selected ${session.draft.recommendations.length===1?'replacement':'replacements'} · next version ${session.publishedVersion+1}</p><div class="advisor-dialog-actions"><button class="quiet" data-dismiss>Keep editing</button><button class="solid" id="confirm-publish">Publish plan</button></div>`);
    dialog.querySelector('#confirm-publish').onclick=()=>{closeDialog();mutate('publish');};
  }
  async function renderFeature() {
    const host=$('#advisor-tab-content');host.innerHTML='<div class="advisor-loading" role="status">Loading…</div>';
    try {const current=sequence,tab=activeTab;const cleanup=await mountFeature(activeTab,host,{clientId:selected.clientId,mode:'advisor',canWrite:canEdit(),canConfirm:directory.capabilities.confirmPayments===true,capabilities:directory.capabilities,productLabels:Object.fromEntries((session.view.client.plan?.recommendations||[]).map(item=>[item.id,catalog[item.proposedProductId]?.name||item.proposedProductId])),...(session.view.client.schemaVersion===2?{productDescriptor:(version,id)=>productDescriptor(session.view.client,version,id)}:{})});if(disposed||current!==sequence||tab!==activeTab)cleanup?.();else featureCleanup=cleanup;}
    catch(error){if(disposed)return;host.innerHTML=`<div class="advisor-empty" role="alert"><h2>${copy[activeTab]} unavailable</h2><p>This section could not load. Try again in a moment.</p><button class="quiet" id="retry-feature">Try again</button></div>`;$('#retry-feature')?.addEventListener('click',renderFeature);}
  }
  if(requestAdmission)requestAdmission({action:'capabilities'}).then(result=>{if(disposed)return;canAddClient=result?.canAddClient===true;if(directory&&!selected)renderDirectory();}).catch(()=>{});
  const beforeUnload=event=>{if(hasPending()) {event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',beforeUnload);
  if(initialDirectory){directory=initialDirectory;renderDirectory();}else loadDirectory();
  return ()=>{disposed=true;admission?.dispose();++sequence;readController?.abort();cleanupFeature();closeDialog();dialog.remove();window.removeEventListener('beforeunload',beforeUnload);root.innerHTML='';};
}
