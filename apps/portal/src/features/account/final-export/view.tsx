import {useSyncExternalStore} from 'react';
import {Button, StatusNotice} from '../../../ui/index.ts';
import type {AccountFinalExportController, AccountFinalExportPhase} from './controller.ts';

const messages: Record<AccountFinalExportPhase, string> = {
  idle:'choose where to save your final plan',
  saving:'preparing your final plan',
  closed:'the browser acknowledged writing your final plan',
  cancelled:'export cancelled',
  unavailable:'saving is unavailable here. try again in a supported desktop browser.',
  invalid:'the final plan could not be verified. try again.',
  unauthorized:'access to this final plan is unavailable. sign in again or contact shelv.',
  'basis-conflict':'the final plan changed. choose a destination again to retry.',
  unknown:'the file result is unknown. check your chosen destination before trying again.',
  retired:'this export session has ended',
};

export function AccountFinalExportView({controller}: {controller:AccountFinalExportController}) {
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  const cleanupPending=['aborting','abort-unconfirmed'].includes(state.writer);
  const maySave=!['saving','retired','unknown'].includes(state.phase)&&!cleanupPending;
  return <section aria-label="final plan">
    <h2>final plan</h2>
    <p>your last entitled plan and instructions remain available after care access ends. this copy does not extend skincare support.</p>
    <StatusNotice tone={cleanupPending||['unknown','unauthorized','invalid'].includes(state.phase)?'warning':'neutral'} title={state.writer==='abort-unconfirmed'?messages.unknown:messages[state.phase]}>
      {state.phase==='closed'?<p>check the file in your chosen destination.</p>:null}
      {state.writer==='abort-unconfirmed'||state.writer==='aborting'?<p>stopping the file write is not yet confirmed.</p>:null}
    </StatusNotice>
    {maySave?<Button onClick={()=>{void controller.saveFromUserAction();}}>choose where to save</Button>:null}
    {state.phase==='saving'?<Button variant="secondary" onClick={()=>controller.cancel()}>cancel export</Button>:null}
  </section>;
}
