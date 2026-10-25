import {mountClientPortal} from '../client/view.js';
import {mountCheckinsPanel} from '../features/checkins/index.js';
import {mountPaymentsPanel} from '../features/payments/index.js';
import {mountServicePanel} from '../features/service/index.js';
import {productDescriptor} from '../client/presentation-renderer.js';
import {createWalkthroughAdapters} from './adapters.js';
import {createGuideController} from './guide.js';
const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
const button=(label,action)=>{const el=node('button',label);el.type='button';el.addEventListener('click',action);return el;};
/** Only an already-authorized immutable snapshot enters this renderer. */
export function mountWalkthroughViewer(root,{snapshot,authorize=null,onUnavailable=null,guided=true,showSampleDisclosure=false,endLinks=[]}={}){
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
  guideHost.replaceChildren();const kicker=node('p',state.explore?'Explore the plan':`Step ${state.index+1} of ${state.total}`,'walkthrough-kicker');guideHost.append(kicker);
  const heading=node('h2',state.explore?'Take a look around':state.stage.title);heading.tabIndex=-1;guideHost.append(heading,node('p',state.explore?'Open the recommendations, routine and saved review. Your choices stay in this view.':state.stage.body));
  if(!state.explore)for(const message of state.stage.messages||[]){const block=node('blockquote',undefined,'walkthrough-message');block.append(node('strong',message.speaker),node('p',message.text));guideHost.append(block);}
  const controls=node('div',undefined,'walkthrough-controls');
  if(state.explore)controls.append(button('Continue guide',()=>controller.resume()));else {const back=button('Back',()=>controller.back());back.disabled=state.index===0;controls.append(back);if(state.index<state.total-1)controls.append(button('Next',()=>controller.next()));else controls.append(button('Explore the plan',()=>controller.explore()));}
  if(!state.explore&&state.index<state.total-1)controls.append(button('Skip and explore',()=>controller.explore()));controls.append(button('Restart',()=>controller.restart()));guideHost.append(controls);
  if(state.index===state.total-1||state.explore)for(const entry of endLinks){const link=node('a',entry.label,'walkthrough-end-link');link.href=entry.href;link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';guideHost.append(link);}
  guideHost.setAttribute('aria-live','polite');
 }
 async function select(state){
  const current=++generation;lastState=state;if(!await recheck()||disposed||current!==generation)return;
  portalCleanup?.();portalCleanup=null;portalHost.replaceChildren(node('p','Opening plan…','advisor-loading'));renderGuide(state);
  try{
   const adapters=await createWalkthroughAdapters(snapshot,{index:state.index});if(disposed||denied||current!==generation)return;
   const mountFeature=(kind,host,options)=>{
    if(kind==='checkins')return mountCheckinsPanel(host,{...options,request:adapters.checkins,readOnly:true,showSampleDisclosure});
    if(kind==='payments'){const cleanup=mountPaymentsPanel(host,{...options,request:adapters.payments,readOnly:true,showSampleDisclosure,productLabels:adapters.productLabels,productDescriptor:(version,id)=>productDescriptor(adapters.read(),version,id)});host.prepend(node('p','Nothing is charged or sent in this view.','walkthrough-action-note'));return cleanup;}
    if(kind==='service')return mountServicePanel(host,{...options,mode:'client',request:adapters.service.client,clientView:adapters.read(),getClientView:adapters.read,readOnly:true,showSampleDisclosure});
    return()=>{};
   };
   portalCleanup=mountClientPortal(portalHost,{request:adapters.core,mountFeature,clientId:adapters.clientId,preview:true,capabilities:{profile:true},avatar:snapshot.presentation.title.slice(0,1),productLabels:adapters.productLabels,onSignOut:()=>{},now:adapters.now,showSampleDisclosure,manageHistory:false,serviceEnabled:true,readPaymentStatus:adapters.readPaymentStatus,onReady:({navigate})=>{if(!disposed&&current===generation&&!state.explore)navigate(state.stage.section==='profile'?'plan':state.stage.section);}});
  }catch{if(!disposed&&current===generation){portalCleanup?.();portalCleanup=null;portalHost.replaceChildren(node('p','This walkthrough could not open. Try Restart.','advisor-empty'));}}
 }
 const controller=createGuideController({stages:snapshot.stages,guided,onChange:select});
 const resume=async()=>{if(document.visibilityState==='hidden'||disposed||denied)return;if(await recheck()&&lastState&&!portalCleanup)select(lastState);};
 window.addEventListener('focus',resume);document.addEventListener('visibilitychange',resume);controller.start();
 const cleanup=()=>{disposed=true;generation++;controller.dispose();window.removeEventListener('focus',resume);document.removeEventListener('visibilitychange',resume);clear();if(shell.parentNode===root)shell.remove();};cleanup.restart=()=>controller.restart();return cleanup;
}
