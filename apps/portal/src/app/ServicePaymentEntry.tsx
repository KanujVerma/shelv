import {useEffect,useSyncExternalStore} from 'react';
import {PageHeader} from '../shell/PortalShell.tsx';
import {StatusNotice} from '../ui/index.ts';
import {ServicePayments} from '../features/payments/ServicePayments.tsx';
import type {ServicePaymentEntry} from './service-payment-entry.ts';

export function ServicePaymentEntryView({entry}:{entry:ServicePaymentEntry}){
 const state=useSyncExternalStore(entry.subscribe,entry.getSnapshot,entry.getSnapshot);
 useEffect(()=>{void entry.start();return()=>entry.stop();},[entry]);
 if(state.phase==='inactive')return null;
 return <><PageHeader title="service"/>{state.controller?<ServicePayments controller={state.controller}/>:
  <StatusNotice tone={state.phase==='ended'?'denied':'loading'} title={state.phase==='ended'?'your session has ended. sign in again.':'loading service payment'}/>}</>;
}
