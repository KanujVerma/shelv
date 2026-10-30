import { useEffect, useRef, useState } from 'react';
import type { PlanDecision } from '../../../../../src/contracts/PortalRebuild.ts';
import { Button, StatusNotice } from '../../ui/index.ts';
import type { ClientPlanProps, DecisionCommand } from './types.ts';
type Phase = 'idle' | 'saving' | 'refreshing' | 'uncertain' | 'conflict' | 'denied' | 'error' | 'saved';
interface Intent {
    command: DecisionCommand | null;
    phase: Phase;
}
const fresh = (): Intent => ({ command: null, phase: 'idle' });
function requestId() { const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6]! & 15) | 64; b[8] = (b[8]! & 63) | 128; const h = [...b].map(x => x.toString(16).padStart(2, '0')).join(''); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`; }
export function DecisionControls({ decision, view, mode, session, ports, demoPorts, onViewChange, onSelfPurchase }: ClientPlanProps & {
    decision: PlanDecision;
}) {
    const memoryKey = `plan:${session.key}:${view.plan!.version}:${decision.id}`;
    const [intent, setIntent] = useState<Intent>(() => { const saved = session.memory.get<Intent>(memoryKey); return saved ? { ...saved, phase: saved.phase === 'saving' || saved.phase === 'refreshing' ? 'uncertain' : saved.phase } : fresh(); });
    const alive = useRef(true), busy = useRef(false), latest = useRef({ mode, view });
    latest.current = { mode, view };
    useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
    const port = !onViewChange ? undefined : mode === 'client' && view.access === 'active' ? ports : mode === 'public-demo' && demoPorts?.mode === 'public-demo' && view.access === 'active' ? demoPorts : undefined;
    const current = () => alive.current && session.isCurrent() && latest.current.mode === mode;
    const update = (next: Intent) => { if (!current())
        return; session.memory.set(memoryKey, next); setIntent(next); };
    const refresh = async (command: DecisionCommand | null) => {
        if (!port)
            return;
        const authoritative = await port.read.execute({ schemaVersion: 1, action: 'read_client_plan_v1', version: null });
        if (!current())
            return null;
        onViewChange?.(authoritative);
        if (command && authoritative.plan?.version === command.publicationVersion && authoritative.decisions.some(d => d.decisionId === command.decisionId && d.choice === command.choice && d.reason === command.reason))
            return authoritative;
        return null;
    };
    async function submit(choice: DecisionCommand['choice'], retry = false) {
        if (!port || busy.current || !current() || (!retry && intent.command))
            return;
        busy.current = true;
        const command = retry ? intent.command : { schemaVersion: 1 as const, action: 'record_decision_v1' as const, requestId: requestId(), publicationVersion: view.plan!.version, expectedDecisionRevision: view.decisionRevision, decisionId: decision.id, choice, reason: null };
        if (!command) {
            busy.current = false;
            return;
        }
        const pending = { ...intent, command, phase: 'saving' as const };
        update(pending);
        let acknowledged = false;
        try {
            await port.decision.execute(command);
            acknowledged = true;
            if (!current())
                return;
            update({ ...pending, phase: 'refreshing' });
            const latest = await refresh(command);
            if (!current())
                return;
            update({ ...pending, command: latest ? null : command, phase: latest ? 'saved' : 'uncertain' });
        }
        catch (error) {
            if (!current())
                return;
            const status = (error as {
                status?: number;
            })?.status;
            if (!acknowledged && status === 409) {
                update({ ...pending, command: null, phase: 'conflict' });
                try {
                    await refresh(null);
                }
                catch { /* Preserve the local choice; retry refresh explicitly. */ }
            }
            else if (!acknowledged && [400, 403, 404, 413, 415, 429].includes(status ?? 0))
                update({ ...pending, command: null, phase: status === 403 || status === 404 ? 'denied' : 'error' });
            else
                update({ ...pending, phase: 'uncertain' });
        }
        finally {
            busy.current = false;
        }
    }
    async function reload() { if (!port || busy.current)
        return; busy.current = true; try {
        await port.read.execute({ schemaVersion: 1, action: 'read_client_plan_v1', version: null }).then(v => { if (current()) {
            onViewChange?.(v);
            update({ ...intent, phase: 'idle' });
        } });
    }
    catch {
        update({ ...intent, phase: 'error' });
    }
    finally {
        busy.current = false;
    } }
    const locked = intent.phase === 'saving' || intent.phase === 'refreshing' || !!intent.command;
    const recorded = view.decisions.find(d => d.decisionId === decision.id);
    if (!port)
        return <div className="plan-stack"><h2>your choice</h2><StatusNotice title={view.access === 'read_only' ? 'read-only plan' : mode === 'historical' ? 'historical plan' : mode === 'public-demo' ? 'demo preview' : 'preview only'}>choices are unavailable in this view.</StatusNotice>{recorded ? <p>recorded choice: {recorded.choice}</p> : null}</div>;
    return <div className="plan-stack"><h2>your choice</h2>
  <Button busy={intent.phase === 'saving'} disabled={locked || intent.phase === 'conflict'} onClick={() => void submit('approved')}>{decision.primaryProductId ? 'approve product' : 'approve decision'}</Button>
  <Button variant="secondary" disabled={locked || intent.phase === 'conflict'} onClick={() => void submit('deferred')}>decide later</Button>
  <Button variant="ghost" disabled={locked || intent.phase === 'conflict'} onClick={() => void submit('declined')}>decline</Button>
  {recorded ? <p className="plan-muted">recorded choice: {recorded.choice}</p> : null}
  {intent.phase === 'refreshing' ? <StatusNotice tone="loading" title="checking your choice"/> : null}
  {intent.phase === 'saving' ? <StatusNotice tone="loading" title="recording your choice"/> : null}
  {intent.phase === 'saved' ? <StatusNotice tone="success" title="choice recorded">your current routine has not changed.</StatusNotice> : null}
  {intent.phase === 'uncertain' ? <StatusNotice tone="uncertain" title="result uncertain" action={<Button variant="secondary" onClick={() => void submit(intent.command!.choice, true)}>retry same choice</Button>}>your choice may have been recorded. retry this exact choice to confirm; your choice is kept.</StatusNotice> : null}
  {intent.phase === 'conflict' ? <StatusNotice tone="warning" title="plan changed" action={<Button variant="secondary" onClick={() => void reload()}>review latest plan</Button>}>your choice was not saved. review the latest plan before choosing again. your choice is kept.</StatusNotice> : null}
  {intent.phase === 'denied' ? <StatusNotice tone="denied" title="action unavailable">your choice was not saved. your choice is kept.</StatusNotice> : null}
  {intent.phase === 'error' ? <StatusNotice tone="error" title="choice not saved" action={<Button variant="secondary" onClick={() => void reload()}>refresh plan</Button>}>your choice is kept. try again after checking the latest plan.</StatusNotice> : null}

  <p className="plan-meta">no order or charge yet. we confirm the all-in total and return terms before you pay.</p>
  {onSelfPurchase && mode==='client' && view.access==='active' && decision.primaryProductId ? <><hr /><Button variant="secondary" disabled={locked} onClick={() => onSelfPurchase(decision.primaryProductId!, decision.id)}>i’ll buy it myself</Button></> : null}

 </div>;
}
