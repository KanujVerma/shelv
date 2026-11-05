import {useEffect,useMemo,useState,useSyncExternalStore} from 'react';
import type {ApplicationSession} from './session.ts';
import {usePortalNavigation} from '../navigation/react.tsx';
import {AdvisorWorkspace} from '../features/advisor/AdvisorWorkspace.tsx';
import type {AdvisorWorkspaceProps} from '../features/advisor/AdvisorWorkspace.tsx';
import {createAdvisorPublicationNotifications} from './advisor-notifications.ts';
import type {NotificationViewLease} from './notification-owner.ts';

/** The feature receives a live handle only after commit. Each effect setup
 * creates its own handle, including StrictMode cleanup/setup. */
export function AdvisorWorkspaceNotifications({runtime,isApplicable,...props}:
 Omit<AdvisorWorkspaceProps,'publicationNotifications'>&{runtime:ApplicationSession;isApplicable?:()=>boolean}){
 const {navigator,path}=usePortalNavigation();
 const session=useSyncExternalStore(runtime.subscribe,runtime.getSnapshot,runtime.getSnapshot);
 const state=useSyncExternalStore(props.controller.subscribe,props.controller.getSnapshot,props.controller.getSnapshot);
 const draftId=state.view?.draft.id,clientId=state.view?.draft.clientId;
 const context=useMemo(()=>Object.freeze({}),[runtime,navigator,props.controller,path,session.boundary,session.status,draftId,clientId,isApplicable]);
 const [active,setActive]=useState<{context:object;lease:NotificationViewLease}|null>(null);
 useEffect(()=>{
  if(session.status!=='ready'||navigator.getSnapshot()!==path)return;
  const latest=props.controller.getSnapshot().view?.draft;
  if(latest?.id!==draftId||latest?.clientId!==clientId)return;
  const lease=createAdvisorPublicationNotifications(runtime,navigator,props.controller,{isApplicable});
  if(!lease)return;
  let live=true;
  void lease.prepare().then(ready=>{if(live&&ready)setActive({context,lease});}).catch(()=>lease.dispose());
  return()=>{live=false;lease.dispose();};
 },[context,runtime,navigator,path,props.controller,session.status,draftId,clientId,isApplicable]);
 const notifications=active?.context===context?active.lease.controller:undefined;
 return <AdvisorWorkspace {...props} publicationNotifications={notifications}/>;
}
