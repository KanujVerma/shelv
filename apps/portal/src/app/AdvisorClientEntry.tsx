import {useEffect,useMemo,useState,useSyncExternalStore} from 'react';
import type {ApplicationSession} from './session.ts';
import type {PlanSessionBoundary} from '../features/plan/types.ts';
import type {createAdvisorPorts} from './ports.ts';
import {usePortalNavigation,RouteLink} from '../navigation/react.tsx';
import {ClientWorkspace} from '../features/advisor/client-workspace/ClientWorkspace.tsx';
import {PageHeader} from '../shell/PortalShell.tsx';
import {Button,StatusNotice} from '../ui/index.ts';
import {PublicationAudit} from './PublicationAudit.tsx';
import {createAdvisorClientEntry} from './advisor-client-entry.ts';
import type {AdvisorClientEntry} from './advisor-client-entry.ts';
import {readUuid} from '../../../../src/contracts/ConciergePortalValidation.ts';

type Props={runtime:ApplicationSession;clientId:string;boundary:PlanSessionBoundary;
 publication:ReturnType<typeof createAdvisorPorts>['publication'];adapterCare:ReturnType<typeof createAdvisorPorts>['care'];clientName?:string|null};
export function AdvisorClientApplication({runtime,clientId,...props}:Props){
 const {navigator,path}=usePortalNavigation();
 const entry=useMemo(()=>{
  let id:string;
  try{id=readUuid(clientId);}catch{return null;}
  return createAdvisorClientEntry(runtime,navigator,id);
 },[runtime,navigator,clientId,path]);
 if(!entry)return <><PageHeader title="client workspace"/><StatusNotice tone="denied" title="client workspace unavailable"/><RouteLink route={{name:'advisor-plans'}}>open plans</RouteLink></>;
 return <AdvisorClientEntryView entry={entry} {...props}/>;
}
export function AdvisorClientEntryView({entry,publication,adapterCare,boundary,clientName}:Omit<Props,'runtime'|'clientId'>&{entry:AdvisorClientEntry}){
 const state=useSyncExternalStore(entry.subscribe,entry.getSnapshot,entry.getSnapshot);
 const [auditOwner,setAuditOwner]=useState<ReturnType<AdvisorClientEntry['getSnapshot']>|null>(null);
 useEffect(()=>{entry.start();return()=>entry.stop();},[entry]);
 if(state.phase==='inactive')return null;
 if(!state.controller)return <><PageHeader title="client workspace"/><StatusNotice tone={state.phase==='ended'?'denied':'loading'} title={state.phase==='ended'?'client workspace session ended':'loading client workspace'}/></>;
 return <>
  <ClientWorkspace controller={state.controller} clientName={clientName} onOpenDraft={id=>entry.openDraft(state,id)}/>
  <RouteLink route={{name:'advisor-plans'}}>open plans</RouteLink>
  <Button variant="secondary" onClick={()=>{if(entry.isCurrent(state))setAuditOwner(state);}}>read current publication</Button>
  {auditOwner===state&&entry.isCurrent(state)?<PublicationAudit key={state.clientId} clientId={state.clientId} read={publication} care={adapterCare} session={boundary}/>:null}
 </>;
}
