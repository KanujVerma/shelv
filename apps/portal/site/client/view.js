import {UI_COPY} from '../ui/copy.js';
import {createPortalDialog} from '../ui/dialog.js';
import {defaultPlanTab,readClientLocation,clientLocationHref} from './navigation.js';
import {downloadPlanDocument} from './plan-export.js';
import {paymentViewWithMethods} from '../features/payments/methods.js';
import {createCheckinDraftState} from '../features/checkins/draft-state.js';
import {planCheckinContext} from './plan-context.js';
import {wireProductIngredients} from './product-ingredients.js';
import {createPreviewDisplayPlan} from '../preview/model.js';
import {esc,money,title,cartItems} from '../advisor/model.js';
import {catalog} from '../advisor/catalog.js';
import {wireIngredientGuide} from '../advisor/plan-preview.js';
import {legacyRoutineProductDetail} from './legacy-routine.js';
import {ClientReviewState} from './review-state.js';
import {routineMarkup,routineProductDetail} from './routine.js';
import {recommendationFeedMarkup} from './recommendation-feed.js';
import {presentationFeedMarkup,presentationCardDetail,presentationRoutineMarkup,presentationProposalsMarkup,presentationRoutineDetail,presentationConsultationMarkup,presentationGuidesMarkup,presentationSourcesMarkup,presentationText,productDescriptor} from './presentation-renderer.js';

const localCalendarDay = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

const itemPrice = cents => Number.isSafeInteger(cents) ? money(cents) : 'Price to be confirmed';

export function mountClientPortal(root,{request,mountFeature,onSignOut,clientId=null,preview=false,readOnly=false,draft=null,previewLabel=null,managerPreview=false,avatar='A',capabilities={profile:true},productLabels={},draftState=null,readPaymentStatus=null,readCheckinStatus=null,onReady=null,now=()=>new Date(),showSampleDisclosure=true,manageHistory=true,serviceEnabled=false,tourControl=null,account=null}) {
  let view=null,section='plan',planTab='recommendations',disposed=false,featureCleanup=null,pending=null,busy=false,sequence=0,readyNotified=false,interactionSuspended=false,productRef=null,accountOpen=false,paymentAttention=null,checkinAttention=null;
  const navigationKey='shelvClientNavigation',navigationScope=()=>location.pathname+'|'+(location.hash.startsWith('#/advisor')?'advisor':location.hash.startsWith('#/client')?'client':'');
  const mountedScope=navigationScope();
  const sections=()=>['plan','checkins','payments','about','history','product',...(serviceEnabled?['service']:[])];
  const readNavigation=state=>{const entry=state?.[navigationKey];return manageHistory&&navigationScope()===mountedScope&&entry?.version===1&&entry.scope===mountedScope&&sections().includes(entry.section)&&['recommendations','routine'].includes(entry.planTab)?entry:null;};
  const requested=readNavigation(history.state)||(manageHistory?readClientLocation(new URL(location.href)):null),restored=requested&&sections().includes(requested.section)?requested:null;if(restored){section=restored.section;planTab=restored.planTab;productRef=restored.productRef||null;}let explicitEntry=Boolean(restored);
  function recordNavigation(push=false,{position=null}={}){if(!manageHistory)return;try{const state=history.state&&typeof history.state==='object'&&!Array.isArray(history.state)?history.state:{};const entry={version:1,scope:mountedScope,section,planTab,productRef,...(position||{})};history[push?'pushState':'replaceState']({...state,[navigationKey]:entry},'',clientLocationHref(location.href,entry));}catch{}}
  function rememberPosition(trigger=null){recordNavigation(false,{position:{scrollY:window.scrollY,focusId:trigger?.id||null,focusProduct:trigger?.dataset.routineStep||null}});}
  const historyChanged=event=>{const target=readNavigation(event.state)||readClientLocation(new URL(location.href));if(target)void openSection(target.section,{restore:true,planView:target.planTab,product:target.productRef,position:target});};
  const controller=new AbortController(),draftPlan=readOnly?createPreviewDisplayPlan(draft):null,displayPlan=()=>draftPlan||view?.plan;
  const ownsCheckinDraft=!draftState,checkinDraft=draftState||createCheckinDraftState();
  const reviewState=new ClientReviewState(),{reviewed,expanded}=reviewState,presentation=()=>displayPlan()?.presentation?.schemaVersion===2?displayPlan().presentation:null;
  const dialogMarkup=html=>`<div class="client-dialog-header"><button class="close" data-close aria-label="Close dialog">×</button></div>${html}`;
  function showDialog(html){if(interactionSuspended||disposed)return dialog;const heading=document.createElement('div');heading.innerHTML=html;return modal.open({title:heading.querySelector('h2')?.textContent||'Plan details',content:dialogMarkup(html),trigger:document.activeElement});}
  function recommendationDetail(key){const p=presentation(),card=p?.categoryCards.find(card=>card.id===key);if(!card)return presentationCardDetail(null);const ownSteps=new Set((card.how?.steps||[]).map(step=>step.body));return presentationCardDetail(card)+presentationGuidesMarkup((p.routineGuides||[]).filter(guide=>guide.productId!==null&&guide.productId===(card.proposedProduct||card.currentProduct)?.id&&(guide.steps||[]).some(step=>!ownSteps.has(step.body))));}
  function productDetail(key){showDialog(recommendationDetail(key));wireIngredientGuide(dialog,showDialog,()=>productDetail(key));return dialog;}
  function openOverview(){return showDialog(presentationConsultationMarkup(presentation(),{includeProfile:capabilities.profile!==false}));}
  function openRoutineProduct(key){const open=()=>{showDialog(presentationRoutineDetail(view,key));wireIngredientGuide(dialog,showDialog,open);return dialog;};return open();}
  function selectCategory(group){if(busy||pending||interactionSuspended)return;const tabs=[...root.querySelectorAll('[data-category]')],tab=tabs.find(el=>el.dataset.category===group);if(!tab)return;tabs.forEach(el=>el.setAttribute('aria-pressed',String(el===tab)));const panel=[...root.querySelectorAll('.feed-item')].find(el=>el.id===group+'-panel');panel?.scrollIntoView({behavior:'instant',block:'start'});panel?.focus({preventScroll:true});}
  function refreshTourControl(){const launcher=root.querySelector('[data-view-tour]');if(launcher)launcher.hidden=!tourControl||tourControl.visible?.()===false;}
  function accountName(){const value=view?.account?.displayName||account?.displayName;return typeof value==='string'&&value.trim()&&Array.from(value).length<=200?value.trim():'Your account';}
  function closeAccount(focus=false){accountOpen=false;const menu=root.querySelector('.account-menu'),trigger=root.querySelector('.account-trigger');if(menu)menu.hidden=true;trigger?.setAttribute('aria-expanded','false');if(focus)trigger?.focus();}
  const $=s=>root.querySelector(s),read=()=>request({action:'client_read_v2'},{signal:controller.signal});
  const modal=createPortalDialog({className:'advisor-dialog client-dialog'}),dialog=modal.element;
  dialog.addEventListener('click',event=>{if(event.target.dataset.close!==undefined)dialog.close();});
  dialog.addEventListener('cancel',event=>{if(interactionSuspended)event.preventDefault();});
  const syncBanner = () => root.style.setProperty('--portal-banner-height',(document.querySelector('#preview-banner:not([hidden])')?.getBoundingClientRect().height||0)+'px');
  const bannerObserver = new ResizeObserver(syncBanner), banner = document.querySelector('#preview-banner');
  if(banner)bannerObserver.observe(banner);
  window.addEventListener('resize',syncBanner);
  function frame(content) {
    syncBanner();
    const name=accountName(),initials=name==='Your account'?'•':name.split(/\s+/).map(word=>word[0]).slice(0,2).join('');
    root.innerHTML=`<div class="portal client-portal"><aside class="navigation"><a href="#/client" class="wordmark" aria-label="Shelv"><img src="${new URL('../assets/shelv-mark.png',import.meta.url).href}" alt="" width="32" height="32"><span class="brand-copy"><b>Shelv</b></span></a><nav aria-label="Portal"><button id="client-plan" class="nav-item ${['plan','about','history','product'].includes(section)?'active':''}" ${['plan','about','history','product'].includes(section)?'aria-current="page"':''}><span aria-hidden="true">▤</span> ${UI_COPY.navigation.plan}</button><button id="client-checkins" class="nav-item ${section==='checkins'?'active':''}" ${section==='checkins'?'aria-current="page"':''}><span aria-hidden="true">◷</span> ${UI_COPY.navigation.checkins}</button></nav><div class="client-profile-footer"><button type="button" class="account-trigger" aria-expanded="${accountOpen}" aria-controls="client-account-menu"><span class="avatar" aria-hidden="true">${esc(initials)}</span><span>${esc(name)}</span><span aria-hidden="true">⌄</span></button><div id="client-account-menu" class="account-menu" ${accountOpen?'':'hidden'}><button id="client-payments" class="account-menu-item">${UI_COPY.navigation.payments}</button>${serviceEnabled?'<button id="client-service" class="account-menu-item">Your service</button>':''}<button id="client-history" class="account-menu-item">${UI_COPY.navigation.history}</button><a class="account-menu-item" href="https://derive-beta-site.vercel.app/support" target="_blank" rel="noopener noreferrer">Help</a>${tourControl?`<button class="account-menu-item" data-view-tour>${UI_COPY.actions.replayTour}</button>`:''}${!preview||managerPreview?`<button class="account-menu-item" id="client-signout">${preview?'Exit preview':'Sign out'}</button>`:''}</div></div></aside><div class="workspace">${previewLabel||draftPlan?`<div class="plan-meta preview-label" role="note"><span data-preview-label>${esc(draftPlan?'Unpublished':previewLabel)}</span>${draftPlan?`<small data-preview-revision>Saved revision ${draft.savedRevision}</small>`:''}</div>`:''}${content}</div></div>`;
    for(const next of ['plan','checkins','payments','service','history'])$('#client-'+next)?.addEventListener('click',()=>openSection(next));
    root.querySelector('.wordmark').onclick=event=>{event.preventDefault();void navigate('plan',planTab);};
    const trigger=root.querySelector('.account-trigger');trigger.onclick=()=>{accountOpen=!accountOpen;root.querySelector('.account-menu').hidden=!accountOpen;trigger.setAttribute('aria-expanded',String(accountOpen));if(accountOpen)root.querySelector('.account-menu button,.account-menu a')?.focus();};
    if(accountOpen)root.querySelector('.account-menu button,.account-menu a')?.focus({preventScroll:true});
    $('#client-profile')?.addEventListener('click',()=>openSection('about'));
    root.querySelector('[data-view-tour]')?.addEventListener('click',()=>{closeAccount();tourControl.onClick();});refreshTourControl();
    $('#client-signout')?.addEventListener('click',()=>{if(busy)return;if(pending&&!confirm('Leave before this update is confirmed? You’ll lose the option to retry the same update here.'))return;pending=null;onSignOut();});
  }
  async function openSection(next,{restore=false,planView=planTab,product=null,position=null,trigger=null}={}) {
    if(disposed||!sections().includes(next)||!['recommendations','routine'].includes(planView))return;
    if(busy){if(restore)recordNavigation();return;}
    if(!view){if(restore){section=next;planTab=planView;}return;}
    if(pending&&!confirm('Leave before this update is confirmed? You’ll lose the option to retry the same update here.')){if(restore)recordNavigation();return;}
    if(!restore)rememberPosition(trigger||document.activeElement);const changed=section!==next||planTab!==planView||productRef!==product;if(restore&&!changed)return;
    closeAccount();pending=null;++sequence;featureCleanup?.();featureCleanup=null;section=next;planTab=planView;productRef=product;explicitEntry=true;if(changed&&!restore)recordNavigation(true,{position:{fromPortal:true}});dialog.close();
    if(next==='plan')await load();else render();
    if(disposed||section!==next||accountOpen)return;
    window.scrollTo({top:restore&&position?position.scrollY||0:0,behavior:'instant'});if(restore&&position){const focus=position.focusId?document.getElementById(position.focusId):position.focusProduct?[...root.querySelectorAll('[data-routine-step]')].find(el=>el.dataset.routineStep===position.focusProduct):null;if(focus){focus.focus({preventScroll:true});return;}}const heading=$('.workspace>header h1');
    if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
  }
  async function load() {
    frame('<div class="advisor-loading" role="status">Loading your plan…</div>');const current=++sequence;
    try {const result=await read();if(disposed||current!==sequence)return;reviewState.accept(result.plan);view=result;if(!explicitEntry){planTab=defaultPlanTab(result);explicitEntry=true;}recordNavigation();render();void loadAttention(current);if(!readyNotified){readyNotified=true;onReady?.({navigate,downloadPlan,openOverview,openProduct:productDetail,openRoutineProduct,openCart:showCart,closeDialog:()=>dialog.close(),getDialog:()=>dialog,selectCategory});}}
    catch(error){if(disposed||current!==sequence)return;frame(`<div class="advisor-empty" role="alert"><h1>${error.status===403?'Invitation access required':'Your plan couldn’t load'}</h1><p>${esc(error.message)}</p><button class="solid" id="retry-client-plan">Try again</button></div>`);$('#retry-client-plan').onclick=load;}
  }
  function render() {
    if(['about','history','product'].includes(section)){renderDetail();return;}
    if(section!=='plan'){frame(`<header><h1>${section==='payments'?'Payments':section==='service'?'Your service':'Check-ins'}</h1></header><main id="client-feature" class="advisor-tab-content"></main>`);renderFeature();return;}
    const plan=displayPlan(),approved=cartItems(view);
    if(!plan){void renderPlanAvailability();return;}
    frame(`<header><div class="client-page-title"><h1>${esc(presentation()?.title||'Your plan')}</h1>${presentation()?'<button id="client-profile" class="text-button">About this plan</button>':''}</div><div class="header-actions"><details class="plan-actions"><summary class="quiet">Plan actions</summary><div><button id="download-plan" class="text-button">Download plan (HTML)</button><button data-plan-history class="text-button">Plan history</button></div></details>${!readOnly&&approved.length?`<button id="client-cart" class="quiet" aria-label="Open cart, ${approved.length} ${approved.length===1?'product':'products'}">Cart <span class="cart-badge">${approved.length}</span></button>`:''}</div></header><div class="view-tabs" role="group" aria-label="Plan view"><button id="client-recommendations" class="${planTab==='recommendations'?'selected':''}" aria-pressed="${planTab==='recommendations'}">${UI_COPY.navigation.recommendations}</button><button id="client-routine" class="${planTab==='routine'?'selected':''}" aria-pressed="${planTab==='routine'}">${UI_COPY.navigation.routine}</button></div><div id="client-attention"></div><main id="client-plan-content"></main><div id="client-update-notice" aria-live="polite"></div>`);
    $('#client-recommendations').onclick=()=>openSection('plan',{planView:'recommendations'});$('#client-routine').onclick=()=>openSection('plan',{planView:'routine'});$('#client-cart')?.addEventListener('click',showCart);$('#download-plan')?.addEventListener('click',downloadPlan);root.querySelector('[data-plan-history]')?.addEventListener('click',()=>openSection('history'));
    renderAttention();const content=$('#client-plan-content');
    if(planTab==='routine') {
      const generalGuides=[],seen=new Set();
      for(const step of view.activeRoutine||[])for(const guide of step.guides||[]){
        const key=step.source?.publicationVersion+':'+guide.id;
        if(guide.productId===null&&!seen.has(key)){seen.add(key);generalGuides.push(guide);}
      }
      content.innerHTML=presentation()?presentationRoutineMarkup(view)+presentationProposalsMarkup({...view,plan},{readOnly})+(generalGuides.length?`<details class="advisor-panel routine-reference-guides"><summary>More plan guidance</summary>${presentationGuidesMarkup(generalGuides)}</details>`:''):routineMarkup(view);
      wireProductIngredients(content,showDialog);
      content.querySelectorAll('[data-plan-card]').forEach(button=>button.onclick=()=>openSection('product',{product:'card:'+button.dataset.planCard,trigger:button}));
      content.querySelectorAll('[data-review-proposal]').forEach(button=>button.onclick=()=>{
        if(busy||pending)return;const key=button.dataset.reviewProposal;if(planTab!=='recommendations'){planTab='recommendations';recordNavigation(true);}render();
        const card=[...root.querySelectorAll('[data-presentation-card]')].find(el=>el.dataset.presentationCard===key);
        card?.scrollIntoView({block:'start',behavior:'instant'});card?.querySelector('button,input')?.focus({preventScroll:true});
      });
      content.querySelectorAll('[data-legacy-product]').forEach(button=>button.onclick=()=>{void openSection('product',{product:'legacy:'+button.dataset.legacySlot+':'+button.dataset.legacyProduct,trigger:button});});
      content.querySelectorAll('[data-routine-step]').forEach(button=>button.onclick=()=>openSection('product',{product:'step:'+button.dataset.routineStep,trigger:button}));
      content.querySelectorAll('[data-routine-product]').forEach(button=>button.onclick=()=>{void openSection('product',{product:'routine:'+button.dataset.routineProduct,trigger:button});});return;
    }
    content.innerHTML=`<section id="decisions-view">${!readOnly&&plan.recommendations.length?`<p class="advisor-subtitle client-choice-context">${presentation()?.categoryCards.some(card=>card.kind==='optional_alternative')?'Optional products are included in a quote only if you choose them. Reference prices exclude tax and shipping; confirm the final quote before paying.':'Approve a product to include it in a quote. Reference prices exclude tax and shipping; confirm the final quote before paying.'}</p>`:''}${presentation()?presentationFeedMarkup(presentation(),{reviewed,expanded,readOnly}):recommendationFeedMarkup(plan,{reviewed,expanded,readOnly})}</section>${presentation()?presentationSourcesMarkup(presentation().sources):''}`;
    wireProductIngredients(content,showDialog);
    content.querySelectorAll('[data-plan-card]').forEach(button=>button.onclick=()=>openSection('product',{product:'card:'+button.dataset.planCard,trigger:button}));
    content.querySelectorAll('[data-category]').forEach(button=>button.onclick=()=>{if(busy||pending)return;content.querySelectorAll('[data-category]').forEach(tab=>tab.setAttribute('aria-pressed',String(tab===button)));const panel=[...content.querySelectorAll('.feed-item')].find(el=>el.id===button.dataset.category+'-panel');panel?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});panel?.focus({preventScroll:true});});
    if(!readOnly)content.querySelectorAll('[data-review],[data-undo-review],[data-expand]').forEach(button=>button.onclick=()=>{if(busy||pending)return;const key=button.dataset.review||button.dataset.undoReview||button.dataset.expand;if(button.dataset.expand)expanded.has(key)?expanded.delete(key):expanded.add(key);else if(reviewed.has(key)){reviewed.delete(key);expanded.add(key);}else{reviewed.add(key);expanded.delete(key);}render();});
    wireIngredientGuide(content,showDialog,()=>dialog.close());
    if(readOnly)return;
    plan.recommendations.forEach(item=>{
      const state=plan.itemStates.find(s=>s.recommendationId===item.id);if(!state)return;
      const optional=presentation()?.categoryCards.find(card=>card.recommendationId===item.id)?.kind==='optional_alternative';
      const footer=[...content.querySelectorAll('[data-controls]')].find(el=>el.dataset.controls===item.id);if(!footer)return;
      footer.innerHTML=state.startedOn?`<p class="client-state-note">Started ${esc(state.startedOn)} · part of your routine</p>`:state.received?`<form data-start-form="${esc(item.id)}"><label>Actual start date<input name="startedOn" type="date" max="${localCalendarDay(now())}" value="${localCalendarDay(now())}" required></label><button class="solid">Record start</button></form><p class="client-state-note">Received. Record your start date when you begin using it.</p>`:state.choice==='approved'?`<p class="client-state-note">Approved · in your cart</p><button class="quiet" data-received="${esc(item.id)}">I received this product</button><button class="quiet" data-decline="${esc(item.id)}">Change to decline</button><p class="client-state-note">Mark the product received only after it arrives. You can change your choice until then.</p>`:state.choice==='declined'?`<p class="client-state-note">Declined · your feedback is saved.</p><button class="quiet" data-approve="${esc(item.id)}">Approve instead</button>`:`<div class="approval"><span class="price">${itemPrice(item.priceCents)}</span><div class="approval-actions"><button class="solid" data-approve="${esc(item.id)}">${optional?'Add to cart':'Approve product'}</button><button class="decline-button" data-decline="${esc(item.id)}">Decline</button></div></div>`;
    });
    content.querySelectorAll('[data-approve]').forEach(button=>button.onclick=()=>write({action:'decide',version:plan.version,recommendationId:button.dataset.approve,choice:'approved',reason:''}));
    content.querySelectorAll('[data-received]').forEach(button=>button.onclick=()=>write({action:'receive',version:plan.version,recommendationId:button.dataset.received}));
    content.querySelectorAll('[data-start-form]').forEach(form=>form.onsubmit=event=>{event.preventDefault();write({action:'start',version:plan.version,recommendationId:form.dataset.startForm,startedOn:form.elements.startedOn.value});});
    content.querySelectorAll('[data-decline]').forEach(button=>button.onclick=()=>{if(interactionSuspended||disposed)return;const changing=plan.itemStates.find(state=>state.recommendationId===button.dataset.decline)?.choice==='approved';showDialog(`<h2>${changing?'Change your product choice':'Tell your advisor'}</h2>${changing?'<p>This removes the product from your cart. It does not reverse a verified payment or cancel a purchase arranged with your advisor.</p>':''}<label for="decline-reason">What would you like to change?</label><textarea id="decline-reason" rows="4" maxlength="1000"></textarea><div class="advisor-dialog-actions"><button data-close class="quiet">Cancel</button><button class="solid" id="send-decline">Decline product</button></div>`);dialog.querySelector('#send-decline').onclick=()=>{const reason=dialog.querySelector('#decline-reason').value.trim();if(!reason){dialog.querySelector('#decline-reason').focus();return;}dialog.close();write({action:'decide',version:plan.version,recommendationId:button.dataset.decline,choice:'declined',reason});};});
  }
  function renderAttention(){const host=$('#client-attention');if(!host)return;host.innerHTML=[paymentAttention?`<div class="plan-attention"><span>${esc(paymentAttention)}</span><button class="text-button" data-attention="payments">View payments</button></div>`:'',checkinAttention?`<div class="plan-attention"><span>${esc(checkinAttention)}</span><button class="text-button" data-attention="checkins">Open check-in</button></div>`:''].join('');host.querySelectorAll('[data-attention]').forEach(button=>button.onclick=()=>openSection(button.dataset.attention));}
  async function loadAttention(current){
    const jobs=[];
    if(readPaymentStatus)jobs.push((async()=>{try{const status=paymentViewWithMethods(await readPaymentStatus({signal:controller.signal}),{recipientRequired:false});if(disposed||current!==sequence)return;paymentAttention=status.claims.some(claim=>claim.status==='submitted_unverified')?'Payment awaiting confirmation':status.quotes.some(quote=>quote.status==='payable')?'Payment ready to review':null;renderAttention();}catch{}})());
    if(readCheckinStatus)jobs.push((async()=>{try{const status=await readCheckinStatus({signal:controller.signal});if(disposed||current!==sequence)return;const day=status.nextCheckinOn;checkinAttention=typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)?`Next check-in · ${new Date(day+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'})}`:null;renderAttention();}catch{}})());
    await Promise.allSettled(jobs);
  }
  async function renderPlanAvailability() {
    const current=sequence;
    const show=(state,heading,message,pay=false)=>{
      if(disposed||current!==sequence||section!=='plan'||displayPlan())return;
      frame(`<header><h1>Your plan</h1></header><main class="advisor-empty" data-no-plan-state="${state}" ${state==='error'?'role="alert"':state==='checking'?'role="status"':''}><h2>${esc(heading)}</h2><p>${esc(message)}</p>${pay?'<button class="solid" id="client-no-plan-payments">View payments</button>':''}${state!=='checking'?'<button class="quiet" id="retry-plan-status">Check again</button>':''}</main>`);
      $('#client-no-plan-payments')?.addEventListener('click',()=>openSection('payments'));
      $('#retry-plan-status')?.addEventListener('click',()=>void load());
    };
    if(!readPaymentStatus){show('unknown','Your plan isn’t available to view yet.','We couldn’t check its availability. Get help if you’re expecting a plan.');return;}
    show('checking','Checking your plan status…','Checking the latest service status.');
    try {
      const status=paymentViewWithMethods(await readPaymentStatus({signal:controller.signal}),{recipientRequired:false});
      if(status.service.status==='pending_publication')show('preparing','Your advisor is preparing your plan.','Your service payment is confirmed. Your plan will appear here once your advisor publishes it.');
      else if(status.service.status==='active')show('unavailable','Your plan isn’t available to view yet.','Your service is active. Check again or get help if you’re expecting a plan.');
      else if(status.service.status==='cancelled')show('cancelled','Your service is cancelled.','Get help to discuss your plan access with your advisor.');
      else {
        const quote=status.quotes.find(q=>q.status==='payable'&&q.serviceCents>0);
        if(quote&&status.claims.some(c=>c.quoteId===quote.id&&c.quoteVersion===quote.version&&c.status==='submitted_unverified'))show('awaiting-verification','Your payment is awaiting confirmation.','Your advisor needs to verify your submitted service payment. Your plan also needs to be published before it appears here.');
        else if(quote)show('payment-required','Review your service payment.','A service quote is ready. Your plan becomes available after payment is confirmed and your advisor publishes it.',true);
        else show('no-quote','Your plan isn’t ready yet.','No service quote is ready yet. Your advisor will prepare your plan and payment details. Get help if you’re waiting for an update.');
      }
    } catch {show('error','Your plan status couldn’t load.','Check again to retry, or get help if the problem continues.');}
  }
  async function write(command=null) {
    if(readOnly||busy)return;
    if(command){if(pending)return;pending={...command,requestId:crypto.randomUUID(),expectedRevision:view.revision};}
    busy=true;let saved=false;root.querySelectorAll('.client-decision-footer button,.client-decision-footer input,[data-category],[data-review],[data-undo-review],[data-expand],#client-recommendations,#client-routine,#client-cart').forEach(el=>el.disabled=true);
    const notice=$('#client-update-notice');notice.innerHTML='<p class="advisor-notice" role="status">Saving your update…</p>';
    try {const receipt=await request(structuredClone(pending));if(!Number.isSafeInteger(receipt?.revision)||receipt.revision<=view.revision||receipt.operation!==pending.action)throw Object.assign(new Error('We couldn’t confirm whether the update was saved.'),{status:503});saved=true;pending=null;const result=await read();if(disposed)return;reviewState.accept(result.plan);view=result;render();$('#client-update-notice').innerHTML='<p class="advisor-notice" role="status">Your update is saved.</p>';}
    catch(error){if(disposed)return;const conflict=error.status===409,uncertain=!saved&&(!error.status||error.status>=500||error.status===408||error.status===429);if(!uncertain)pending=null;notice.innerHTML=`<div class="advisor-notice error" role="alert"><p>${esc(saved?'Your update was saved. Reload to see the latest plan.':conflict?'Your plan changed. Load the latest version before updating it.':error.message)}</p><button id="retry-client-update" class="quiet">${uncertain?'Retry same update':'Load latest plan'}</button></div>`;$('#retry-client-update').onclick=()=>uncertain?write():load();}
    finally {busy=false;}
  }
  function showCart() {
    if(busy||pending||interactionSuspended)return;
    const items=cartItems(view);
    showDialog(`<h2>Your cart</h2>${items.length?items.map(item=>`<div class="order-row"><span>${esc(presentation()?productDescriptor(view,view.plan.version,item.id)?.name||'Product details unavailable':catalog[item.proposedProductId]?.name||item.proposedProductId)}</span><strong>${itemPrice(item.priceCents)}</strong></div>`).join(''):'<p>Your cart is empty. Choose products from your plan to include in a quote.</p>'}${items.length?'<p>Your quote will confirm the products, any service charge, tax and shipping before you pay. This cart does not place an order.</p><button id="cart-payments" class="solid">Review payment details</button>':''}`);dialog.querySelector('#cart-payments')?.addEventListener('click',()=>{if(busy||pending)return;dialog.close();openSection('payments');});
  }
  function downloadPlan(){const plan=displayPlan();downloadPlanDocument({...view,plan,history:draftPlan?[...(view.history||[]),...(view.plan?[view.plan]:[])]:view.history});}
  function renderDetail(){
    const p=presentation();let titleText='',markup='';
    if(section==='about'){titleText='About this plan';markup=p?presentationConsultationMarkup(p,{includeProfile:capabilities.profile!==false}).replace(/^<h2[^>]*>[^<]*<\/h2>/,''):'<p>No published plan is available yet.</p>';}
    else if(section==='history'){titleText='Plan history';const publications=[...(view?.history||[]),...(view?.plan?[view.plan]:[])].slice().reverse();markup=publications.length?`<ol class="plan-history-list">${publications.map(plan=>`<li class="plan-history-entry"><h2>${plan.version===view.plan?.version?'Current plan':'Earlier plan'} · version ${plan.version}</h2>${plan.presentation?.preparedBy?`<p>Prepared by ${esc(plan.presentation.preparedBy)}${plan.presentation.preparedOn?' · '+esc(plan.presentation.preparedOn):''}</p>`:''}<button class="text-button" data-history-download="${plan.version}">Download version ${plan.version} (HTML)</button></li>`).join('')}</ol>`:'<p>No published plans yet.</p>';}
    else{const [kind,key,extra]=String(productRef||'').split(':');markup=kind==='step'?presentationRoutineDetail(view,key):kind==='card'?recommendationDetail(key):kind==='routine'?routineProductDetail(view,key):kind==='legacy'?legacyRoutineProductDetail(view,key,extra):'<h2>Product unavailable</h2><p>Return to your plan and choose a product.</p>';const holder=document.createElement('div');holder.innerHTML=markup;titleText=holder.querySelector('h2')?.textContent||'Product details';holder.querySelector('h2')?.remove();markup=holder.innerHTML;}
    frame(`<button class="text-button product-back" id="client-detail-back">← Back to ${planTab==='routine'?'daily routine':'your plan'}</button><header><h1>${esc(titleText)}</h1></header><main class="${section==='product'?'client-product-page':'advisor-panel'}">${markup}</main>`);
    $('#client-detail-back').onclick=()=>{if(manageHistory&&history.state?.[navigationKey]?.fromPortal)history.back();else void openSection('plan',{planView:planTab});};
    root.querySelectorAll('[data-history-download]').forEach(button=>button.onclick=()=>{const plan=[...(view.history||[]),view.plan].find(plan=>plan?.version===Number(button.dataset.historyDownload));if(plan)downloadPlanDocument({...view,plan,historical:plan!==view.plan,activeRoutine:plan===view.plan?view.activeRoutine:[],routine:plan===view.plan?view.routine:[],history:(view.history||[]).filter(item=>item.version<plan.version)});});
    wireProductIngredients(root,showDialog);wireIngredientGuide(root,showDialog,()=>{dialog.close();return root;});
  }
  async function renderFeature() {
    const host=$('#client-feature');host.innerHTML=`<div class="advisor-loading" role="status">${section==='payments'?'Loading payment details…':section==='service'?'Loading service details…':'Loading check-ins…'}</div>`;
    const active=section,featureSequence=sequence;
    try {const cleanup=await mountFeature(section,host,{clientId,mode:'client',...(section==='checkins'?{draftState:checkinDraft}:{}),planContext:planCheckinContext(view),canWrite:!readOnly,readOnly,showSampleDisclosure,now,clientView:view,getClientView:read,displayName:accountName(),productLabels:{...Object.fromEntries((view.plan?.recommendations||[]).map(item=>[item.id,catalog[item.proposedProductId]?.name||item.proposedProductId])),...productLabels},...(view.schemaVersion===2?{productDescriptor:(version,id)=>productDescriptor(view,version,id)}:{})});if(disposed||active!==section||featureSequence!==sequence)cleanup?.();else featureCleanup=cleanup;}
    catch(error){if(disposed||active!==section||featureSequence!==sequence)return;host.innerHTML=`<div class="advisor-empty" role="alert"><h2>${section==='payments'?'Payments':section==='service'?'Your service':'Check-ins'} unavailable</h2><p>This section couldn’t load. Try again.</p><button class="quiet" id="retry-client-feature">Try again</button></div>`;host.querySelector('#retry-client-feature').onclick=renderFeature;}
  }
  const imageError=event=>{const img=event.target;if(img.tagName!=='IMG'||img.dataset.failed)return;img.dataset.failed='true';img.hidden=true;const label=document.createElement('span');label.className='product-image-placeholder';label.textContent='Image unavailable';label.setAttribute('role','img');label.setAttribute('aria-label',img.alt?img.alt+' · image unavailable':'Product image unavailable');img.after(label);};root.addEventListener('error',imageError,true);dialog.addEventListener('error',imageError,true);
  function navigate(next,planView){return next==='routine'?openSection('plan',{planView:'routine'}):openSection(next,{planView:planView||'recommendations'});}
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&accountOpen){event.preventDefault();closeAccount(true);}},{signal:controller.signal});document.addEventListener('pointerdown',event=>{if(accountOpen&&!event.target.closest('.client-profile-footer'))closeAccount();},{signal:controller.signal});if(manageHistory)window.addEventListener('popstate',historyChanged);load();
  const cleanup=()=>{root.removeEventListener('error',imageError,true);dialog.removeEventListener('error',imageError,true);disposed=true;bannerObserver.disconnect();window.removeEventListener('resize',syncBanner);window.removeEventListener('popstate',historyChanged);controller.abort();++sequence;featureCleanup?.();if(ownsCheckinDraft)checkinDraft.dispose();modal.dispose();root.innerHTML='';};
  // The caller can suspend this mount's body-level modal without affecting any
  // other portal or dialog. A successful check leaves it closed for reopening.
  cleanup.setInteractionSuspended=value=>{if(disposed)return;interactionSuspended=value===true;dialog.inert=interactionSuspended;if(interactionSuspended)dialog.close();};
  cleanup.navigate=navigate;cleanup.refreshTourControl=refreshTourControl;return cleanup;
}
