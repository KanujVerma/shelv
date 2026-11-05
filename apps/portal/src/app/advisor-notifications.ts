import type {ApplicationSession} from './session.ts';
import type {PortalNavigationCore} from '../navigation/react.tsx';
import {parseRoute} from '../navigation/routes.ts';
import type {AdvisorController} from '../features/advisor/types.ts';
import {createNotificationViewLease} from './notification-owner.ts';
import type {NotificationViewLease} from './notification-owner.ts';
export type AdvisorPublicationNotifications = NotificationViewLease & {readonly prepare:()=>Promise<boolean>};

/** Actual editor context only. Draft/client strings correlate presentation;
 * the unchanged notification transport/backend establish event access. */
export function createAdvisorPublicationNotifications(
 runtime:ApplicationSession,navigation:PortalNavigationCore,advisor:AdvisorController,
 options:{isApplicable?:()=>boolean}={},
):AdvisorPublicationNotifications|null {
 const boundary=runtime.getSnapshot().boundary,path=navigation.getSnapshot(),route=parseRoute(path);
 if(!boundary||runtime.cookie.audience!=='advisor'||runtime.cookie.identity?.role!=='advisor'||
   runtime.cookie.status!=='ready'||route?.name!=='advisor-editor'||route.section!=='review-publish')return null;
 let local:undefined|(()=>boolean);
 try{local=options.isApplicable;}catch{return null;}
 const relevant=()=>{try{return local===undefined||local()===true;}catch{return false;}};
 if(!relevant())return null;
 const state=advisor.getSnapshot(),draft=state.view?.draft;
 if(state.ended||!draft?.clientId||draft.id.toLowerCase()!==route.draftId.toLowerCase())return null;
 const draftId=draft.id,clientId=draft.clientId;
 function applicable(){
  if(runtime.getSnapshot().boundary!==boundary||runtime.cookie.status!=='ready'||navigation.getSnapshot()!==path||!relevant())return false;
  const latest=advisor.getSnapshot();
  if(latest.ended||latest.view?.draft.id!==draftId||latest.view.draft.clientId!==clientId)return false;
  const current=boundary!.isCurrent();
  if(!current||!relevant())return false;
  const final=advisor.getSnapshot();
  return !final.ended&&final.view?.draft.id===draftId&&final.view.draft.clientId===clientId&&
   runtime.getSnapshot().boundary===boundary&&runtime.cookie.status==='ready'&&navigation.getSnapshot()===path;
 }
 if(!applicable())return null;
 const lease=createNotificationViewLease(runtime,{isApplicable:applicable});
 const start=()=>{if(!applicable()){lease.dispose();return false;}return lease.start();};
 return Object.freeze({controller:lease.controller,start,
  async prepare(){
   if(!start())return false;
   const before=lease.controller.getSnapshot();
   // Recover the current presentation of an earlier original before handing
   // this controller to A06. This is a read, never a replay of its write.
   if(before.pending&&before.phase!=='ready'){
    await lease.controller.loadInbox();
    if(!applicable()||lease.controller.getSnapshot().phase!=='ready'){lease.dispose();return false;}
   }
   if(!applicable()||lease.controller.getSnapshot().phase==='ended'){lease.dispose();return false;}
   return true;
  },
  dispose:lease.dispose,
 });
}
