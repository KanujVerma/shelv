import { useEffect, useSyncExternalStore } from 'react';
import { Button, Dialog, Field, Select, StatusNotice } from '../../../ui/index.ts';
import type { OwnerPolicyController } from './controller.ts';
import './owner-policy.css';
const label = (required: boolean) => required ? 'approval required' : 'approval not required';
/** Parent owns the actual runtime/controller lifetime and disposes on route exit.
 * This is the publishing-policy section of A08, not task/source administration. */
export function OwnerPolicy({ controller }: {
    controller: OwnerPolicyController;
}) {
    const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
    useEffect(() => { void controller.refresh(); }, [controller]);
    const confirmation = state.confirmation, pending = state.pending;
    const changed = state.current !== null && state.desired !== null && state.current.requireKanujApproval !== state.desired;
    return <section className="owner-policy" data-design-frame="503:558" aria-labelledby="owner-policy-heading">
  <h1 id="owner-policy-heading" data-page-heading tabIndex={-1}>workspace permissions</h1>
  <div className="owner-policy-panel">
   <h2>publishing policy</h2>
   <div className="owner-policy-current">
    <div><h3>Sami’s skincare updates</h3><p>{state.current ? (state.current.requireKanujApproval ? 'requires Kanuj’s approval of the exact client and revision' : 'does not require Kanuj’s approval before publication') : 'read the current policy before making a change.'}</p></div>
    {state.current ? <span className="owner-policy-value">{label(state.current.requireKanujApproval)}</span> : null}
   </div>
   {state.current ? <dl className="owner-policy-meta"><div><dt>policy owner</dt><dd>{state.current.ownerActorId}</dd></div><div><dt>revision</dt><dd>{state.current.revision}</dd></div></dl> : null}
   {state.phase === 'loading' ? <StatusNotice tone="loading" title="reading the current policy"/> : null}
   {state.phase === 'unread' ? <StatusNotice title="current policy not loaded"/> : null}
   {state.phase === 'ended' || state.phase === 'denied' ? <StatusNotice tone="denied" title={state.message ?? 'this policy is unavailable'}/> : null}
   {state.phase === 'error' ? <StatusNotice tone="error" title={state.message ?? 'the current policy is unavailable'}/> : null}
   {state.current && state.desired !== null ? <Field label="Kanuj’s approval for Sami’s skincare updates">
    <Select value={state.desired ? 'required' : 'independent'} onValueChange={value => controller.edit(value === 'required')} disabled={!state.writable} options={[{ value: 'required', label: 'approval required' }, { value: 'independent', label: 'approval not required' }]}/>
   </Field> : null}
   {state.current && !state.writable ? <p className="owner-policy-muted">only the current owner with publishing access can change this policy.</p> : null}
   {state.writeState === 'conflict' ? <StatusNotice tone="warning" title="the policy changed">
    {state.base ? <p>your starting policy: {label(state.base.requireKanujApproval)} · revision {state.base.revision}</p> : null}
    {state.current ? <p>current policy: {label(state.current.requireKanujApproval)} · revision {state.current.revision}</p> : null}
    {state.desired !== null ? <p>your change: {label(state.desired)}</p> : null}
    <Button variant="secondary" disabled={!state.current || !state.writable} onClick={controller.reapply}>reapply my change</Button>
   </StatusNotice> : null}
   {pending ? <StatusNotice tone="uncertain" title={state.writeState === 'saving' ? 'saving the policy' : 'the original change is still uncertain'}>
    <p>original change: {label(pending.desired)}. check its result before saving another change.</p>
    <div className="owner-policy-actions"><Button variant="secondary" disabled={state.writeState === 'saving'} onClick={() => void controller.checkStatus()}>check result</Button><Button variant="secondary" disabled={state.writeState === 'saving' || !state.writable} onClick={() => void controller.retryOriginal()}>retry original change</Button></div>
   </StatusNotice> : null}
   {!pending && state.phase !== 'error' && state.message && state.writeState !== 'conflict' && state.phase !== 'denied' && state.phase !== 'ended' ? <StatusNotice tone={state.writeState === 'saved' ? 'success' : 'neutral'} title={state.message}/> : null}
   <div className="owner-policy-actions">
    <Button disabled={!state.writable || !changed || !!pending || state.writeState === 'conflict' || state.phase === 'loading'} onClick={() => controller.requestSave()}>save policy</Button>
    <Button variant="secondary" disabled={state.phase === 'loading' || state.writeState === 'saving' || state.phase === 'ended'} onClick={() => void controller.refresh()}>refresh policy</Button>
   </div>
   <div className="owner-policy-separate"><h3>external agents</h3><p>specific authorization is always required to publish. this setting does not change source access, first-payment checks or section review.</p></div>
  </div>
  <Dialog open={confirmation !== null} title="confirm publishing policy" description={confirmation?.desired ? 'Sami’s skincare updates will require Kanuj’s approval of the exact client and revision.' : 'Sami’s skincare updates will no longer require Kanuj’s approval before publication.'} onOpenChange={open => { if (!open)
        controller.cancelConfirmation(); }}>
   <p>this policy change is recorded.</p><div className="owner-policy-actions"><Button variant="secondary" onClick={controller.cancelConfirmation}>keep editing</Button><Button onClick={() => { if (confirmation)
        void controller.confirmSave(confirmation); }}>confirm policy change</Button></div>
  </Dialog>
 </section>;
}
