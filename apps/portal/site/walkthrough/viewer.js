import {mountClientPortal} from '../client/view.js';
import {mountCheckinsPanel} from '../features/checkins/index.js';
import {mountPaymentsPanel} from '../features/payments/index.js';
import {mountServicePanel} from '../features/service/index.js';
import {productDescriptor} from '../client/presentation-renderer.js';
import {createWalkthroughAdapters} from './adapters.js';
import {createGuideController} from './guide.js';
import {createAnchoredTour} from './anchored-tour.js';
import {createMayaTourPreferences} from './tour-preferences.js';
const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
const button=(label,action,primary=false)=>{const el=node('button',label,primary?'solid':'quiet');el.type='button';el.addEventListener('click',action);return el;};
/** Only an already-authorized immutable snapshot enters this renderer. */
export function mountWalkthroughViewer(root,{snapshot,authorize=null,onUnavailable=null,guided=true,showSampleDisclosure=false,endLinks=[],tour=null}={}){
 if(tour&&!authorize)return mountAnchoredViewer(root,{snapshot,showSampleDisclosure,endLinks,tour});
 let disposed=false,denied=false,generation=0,portalCleanup=null,lastState=null,checking=null;
 const shell=node('div',undefined,'walkthrough-shell'),guideHost=node('aside',undefined,'walkthrough-guide'),portalHost=node('div',undefined,'walkthrough-portal');
 guideHost.setAttribute('aria-label','Walkthrough guide');shell.append(guideHost,portalHost);root.replaceChildren(shell);
 const clear=()=>{portalCleanup?.();portalCleanup=null;guideHost.replaceChildren();portalHost.replaceChildren();};
 const deny=()=>{if(disposed||denied)return;denied=true;generation++;clear();root.replaceChildren(node('p','This walkthrough is unavailable.','advisor-empty'));onUnavailable?.();};
 async function recheck(){
  if(!authorize)return true;if(checking)return checking;
  shell.inert=true;shell.setAttribute('aria-busy','true');portalCleanup?.setInteractionSuspended?.(true);
  checking=(async()=>{try{const latest=await authorize();if(disposed||denied)return false;if(!latest||latest.caseId!==snapshot.caseId||latest.versionId!==snapshot.versionId){deny();return false;}return true;}catch{deny();return false;}finally{checking=null;if(!disposed&&!denied){portalCleanup?.setInteractionSuspended?.(false);shell.inert=false;shell.setAttribute('aria-busy','false');}}})();return checking;
 }
 function renderGuide(state){
  guideHost.replaceChildren();const kicker=node('p',state.explore?'Explore the plan':`Step ${state.index+1} of ${state.total}`,'advisor-eyebrow walkthrough-kicker');guideHost.append(kicker);
  const heading=node('h2',state.explore?'Take a look around':state.stage.title);heading.tabIndex=-1;guideHost.append(heading,node('p',state.explore?'Open the recommendations, routine and saved review. Your choices stay in this view.':state.stage.body));
  if(!state.explore)for(const message of state.stage.messages||[]){const block=node('blockquote',undefined,'advisor-panel walkthrough-message');block.append(node('strong',message.speaker),node('p',message.text));guideHost.append(block);}
  const controls=node('div',undefined,'walkthrough-controls');
  if(state.explore)controls.append(button('Continue guide',()=>controller.resume(),true));else {const back=button('Back',()=>controller.back());back.disabled=state.index===0;controls.append(back);if(state.index<state.total-1)controls.append(button('Next',()=>controller.next(),true));else controls.append(button('Explore the plan',()=>controller.explore(),true));}
  if(!state.explore&&state.index<state.total-1)controls.append(button('Skip and explore',()=>controller.explore()));controls.append(button('Restart',()=>controller.restart()));guideHost.append(controls);
  if(state.index===state.total-1||state.explore)for(const entry of endLinks){const link=node('a',entry.label,'quiet walkthrough-end-link');link.href=entry.href;link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';guideHost.append(link);}
  guideHost.setAttribute('aria-live','polite');
 }
 async function select(state){
  const current=++generation;lastState=state;if(!await recheck()||disposed||current!==generation)return;
  portalCleanup?.();portalCleanup=null;portalHost.replaceChildren(node('p','Opening plan…','advisor-loading'));renderGuide(state);
  try{
   const adapters=await createWalkthroughAdapters(snapshot,{index:state.index});if(disposed||denied||current!==generation)return;
   const mountFeature=(kind,host,options)=>{
    if(kind==='checkins')return mountCheckinsPanel(host,{...options,request:adapters.checkins,readOnly:true,showSampleDisclosure});
    if(kind==='payments'){const cleanup=mountPaymentsPanel(host,{...options,request:adapters.payments,readOnly:true,showSampleDisclosure,productLabels:adapters.productLabels,productDescriptor:(version,id)=>productDescriptor(adapters.read(),version,id)});host.prepend(node('p','Nothing is charged or sent in this view.','advisor-notice walkthrough-action-note'));return cleanup;}
    if(kind==='service')return mountServicePanel(host,{...options,mode:'client',request:adapters.service.client,clientView:adapters.read(),getClientView:adapters.read,readOnly:true,showSampleDisclosure});
    return()=>{};
   };
   portalCleanup=mountClientPortal(portalHost,{request:adapters.core,mountFeature,clientId:adapters.clientId,preview:true,account:{displayName:snapshot.displayName||null},capabilities:{profile:true},avatar:snapshot.presentation.title.slice(0,1),productLabels:adapters.productLabels,onSignOut:()=>{},now:adapters.now,showSampleDisclosure,manageHistory:false,serviceEnabled:true,readCheckinStatus:options=>adapters.checkins({action:'client_read'},options),readPaymentStatus:adapters.readPaymentStatus,onReady:({navigate})=>{if(!disposed&&current===generation&&!state.explore)navigate(state.stage.section==='profile'?'plan':state.stage.section);}});
  }catch{if(!disposed&&current===generation){portalCleanup?.();portalCleanup=null;portalHost.replaceChildren(node('p','This walkthrough could not open. Try Restart.','advisor-empty'));}}
 }
 const controller=createGuideController({stages:snapshot.stages,guided,onChange:select});
 const resume=async()=>{if(document.visibilityState==='hidden'||disposed||denied)return;if(await recheck()&&lastState&&!portalCleanup)select(lastState);};
 window.addEventListener('focus',resume);document.addEventListener('visibilitychange',resume);controller.start();
 const cleanup=()=>{disposed=true;generation++;controller.dispose();window.removeEventListener('focus',resume);document.removeEventListener('visibilitychange',resume);clear();if(shell.parentNode===root)shell.remove();};cleanup.restart=()=>controller.restart();return cleanup;
}

/** The public sample opts into coaching; authorized private viewers keep their guide. */
function mountAnchoredViewer(root,{snapshot,showSampleDisclosure,endLinks,tour}){
 let disposed=false,generation=0,portalCleanup=null,portal=null,lastState=null;
 const preferences=createMayaTourPreferences(),initial=preferences.initialMode();
 let touring=initial==='resume',welcoming=initial==='welcome';
 const shell=node('div',undefined,'walkthrough-shell maya-tour-shell'),portalHost=node('div',undefined,'walkthrough-portal');shell.append(portalHost);root.replaceChildren(shell);
 const refreshLauncher=()=>portalCleanup?.refreshTourControl?.();
 function exit(){touring=false;welcoming=false;generation++;preferences.end();widget.exit();portal?.closeDialog();refreshLauncher();}
 function replay(){portal?.closeDialog();welcoming=true;touring=false;preferences.markSeen();widget.showWelcome();refreshLauncher();}
 const widget=createAnchoredTour({root:shell,intro:tour.intro,finish:tour.finish,endLinks,onStart:()=>{welcoming=false;touring=true;preferences.begin();controller.restart();refreshLauncher();},onNext:()=>controller.next(),onBack:()=>controller.back(),onExit:exit,onReplay:replay,onFinish:exit});
 const controller=createGuideController({stages:snapshot.stages,onChange:state=>{if(touring)void select(state);}});
 function targetFor(key){
  const cards=snapshot.presentation.categoryCards,keep=cards.find(card=>card.kind==='keep'),treatment=cards.find(card=>card.kind==='addition');
  const card=id=>[...portalHost.querySelectorAll('[data-presentation-card]')].find(el=>el.dataset.presentationCard===id);
  const serviceCard=title=>[...portalHost.querySelectorAll('.service-card')].find(el=>el.querySelector('h3')?.textContent===title);
  const candidates={overview:()=>portalHost.querySelector('#client-profile'), 'keep-card':()=>card(keep?.id)?.querySelector('.card-heading'), 'treatment-card':()=>card(treatment?.id)?.querySelector('.card-heading'), 'approval-controls':()=>card(treatment?.id)?.querySelector('[data-controls]'), 'routine-grid':()=>portalHost.querySelector('.client-daily-grid section'), 'routine-product':()=>portalHost.querySelector('[data-routine-step]'),support:()=>serviceCard('Service, cancellation and final plan')?.querySelector('p'),review:()=>serviceCard('Reviews')?.querySelector('.service-record h4')||serviceCard('Reviews')?.querySelector('h3'),terms:()=>serviceCard('Service, cancellation and final plan')?.querySelector('strong')};
  const target=candidates[key]?.();if(target){target.dataset.tourTarget=key;return target;}return null;
 }
 async function waitForTarget(key,current){
  // Features mount asynchronously. Observe only this portal and stop on cleanup.
  const immediate=targetFor(key);if(immediate)return immediate;
  return new Promise(resolve=>{let timer;const finish=target=>{clearTimeout(timer);observer.disconnect();resolve(target);};const observer=new MutationObserver(()=>{if(disposed||current!==generation)finish(null);else {const target=targetFor(key);if(target)finish(target);}});observer.observe(portalHost,{childList:true,subtree:true});timer=setTimeout(()=>finish(null),4000);});
 }
 async function showCallout(state,current){
  const config=tour.steps[state.stage.id];if(!config)return;
  await portal.navigate(config.view||state.stage.section);
  if(disposed||!touring||current!==generation)return;
  const keep=snapshot.presentation.categoryCards.find(card=>card.kind==='keep'),treatment=snapshot.presentation.categoryCards.find(card=>card.kind==='addition');
  if(config.target==='keep-card')portal.selectCategory(keep?.group||keep?.slot);
  if(config.target==='approval-controls')portal.selectCategory(treatment?.group||treatment?.slot);
  const target=await waitForTarget(config.target,current);if(disposed||!touring||current!==generation)return;
  const invoke=()=>{
   const actions={'open-overview':()=>portal.openOverview(),'open-keep-card':()=>portal.openProduct(keep?.id),'open-treatment-card':()=>portal.openProduct(treatment?.id),'open-routine-product':()=>{const step=portalHost.querySelector('[data-routine-step]');if(step)return portal.openRoutineProduct(step.dataset.routineStep);}};
   const dialog=actions[config.interaction?.action]?.();
   if(dialog?.open){
    const restore=()=>{if(!disposed&&touring&&current===generation)widget.showStep({...state,target:targetFor(config.target),interaction:{label:config.interaction.label,onInvoke:invoke},last:state.index===state.total-1});};
    dialog.addEventListener('close',restore,{once:true});
    widget.showStep({...state,target:dialog.querySelector('h2')||dialog,interaction:null,last:state.index===state.total-1});
   }
  };
  widget.showStep({...state,target,interaction:config.interaction?{label:config.interaction.label,onInvoke:invoke}:null,last:state.index===state.total-1});
 }
 async function select(state){
  const current=++generation;lastState=state;widget.suspend(true);portalCleanup?.();portalCleanup=null;portal=null;
  portalHost.replaceChildren(node('p','Opening Maya’s plan…','advisor-loading'));
  try{
   const adapters=await createWalkthroughAdapters(snapshot,{index:state.index});if(disposed||current!==generation)return;
   const mountFeature=(kind,host,options)=>{
    if(kind==='checkins')return mountCheckinsPanel(host,{...options,request:adapters.checkins,readOnly:true,showSampleDisclosure});
    if(kind==='payments'){const cleanup=mountPaymentsPanel(host,{...options,request:adapters.payments,readOnly:true,showSampleDisclosure,productLabels:adapters.productLabels,productDescriptor:(version,id)=>productDescriptor(adapters.read(),version,id)});host.prepend(node('p','Nothing is charged or sent in this view.','advisor-notice walkthrough-action-note'));return cleanup;}
    if(kind==='service')return mountServicePanel(host,{...options,mode:'client',request:adapters.service.client,clientView:adapters.read(),getClientView:adapters.read,readOnly:true,showSampleDisclosure});return()=>{};
   };
   portalCleanup=mountClientPortal(portalHost,{request:adapters.core,mountFeature,clientId:adapters.clientId,preview:true,account:{displayName:'Maya'},avatar:'M',capabilities:{profile:true},productLabels:adapters.productLabels,onSignOut:()=>{},now:adapters.now,showSampleDisclosure,manageHistory:false,serviceEnabled:true,readCheckinStatus:options=>adapters.checkins({action:'client_read'},options),readPaymentStatus:adapters.readPaymentStatus,tourControl:{onClick:replay,visible:()=>!touring&&!welcoming},onReady:api=>{if(disposed||current!==generation)return;portal=api;widget.suspend(false);if(touring)void showCallout(state,current);else if(welcoming){preferences.markSeen();widget.showWelcome();}refreshLauncher();}});
  }catch{if(!disposed&&current===generation){widget.suspend(false);portalHost.replaceChildren(node('p','Maya’s plan could not open. Reload to try again.','advisor-empty'));}}
 }
 if(touring)controller.start();else {const state=controller.read();void select({...state,index:0,stage:snapshot.stages[0],total:snapshot.stages.length});}
 const cleanup=()=>{disposed=true;generation++;controller.dispose();widget.dispose();portalCleanup?.();shell.remove();};cleanup.restart=replay;return cleanup;
}
