import type {ApplicationSession} from '../../../app/session.ts';
import {createClientFinalExportRequest} from '../../../app/final-export-request.ts';
import {TransportError} from '../../../transport/session.ts';
import {captureFinalExportClient} from './client.ts';
import {createBrowserFinalExportStaging} from './writer.ts';
import type {BrowserFinalExportStaging, FinalExportPickerHost, WriterDisposition} from './writer.ts';
import {createFinalExportCollection} from './transfer.ts';

export type AccountFinalExportPhase = 'idle'|'saving'|'closed'|'cancelled'|'unavailable'|'invalid'|'unauthorized'|'basis-conflict'|'unknown'|'retired';
export type AccountFinalExportSnapshot = Readonly<{phase:AccountFinalExportPhase; writer:WriterDisposition}>;
/** No destination, request, subscription or browser lookup until user action. */
export function createAccountFinalExport(runtime: ApplicationSession, host?: FinalExportPickerHost) {
  const client = captureFinalExportClient(runtime);
  const listeners = new Set<() => void>();
  let snapshot: AccountFinalExportSnapshot = Object.freeze({phase:'idle', writer:'unopened'});
  let disposed = false, notifying=false;
  type Attempt={abort:AbortController; writer:BrowserFinalExportStaging|null; collection:ReturnType<typeof createFinalExportCollection>|null};
  let active: Attempt | null = null;
  let detachBoundary: (()=>void) | undefined, detachRuntime: (()=>void) | undefined;
  const publish = (phase: AccountFinalExportPhase, writer: WriterDisposition = snapshot.writer) => {
    const next = Object.freeze({phase,writer}); snapshot = next;
    const priorNotification=notifying;notifying=true;
    try {
      for (const observer of [...listeners]) {
        if (snapshot !== next) break;
        try { observer(); } catch { /* One subscriber cannot prevent retirement. */ }
      }
    } finally { notifying=priorNotification; }
    return next;
  };
  const detach = () => { const a=detachBoundary,b=detachRuntime;detachBoundary=detachRuntime=undefined;a?.();b?.(); };
  function retire(phase: 'cancelled'|'retired'|'unavailable') {
    const prior = active;
    active = null; // Deny old relevance before observers, abort or cleanup.
    if (phase === 'retired') { disposed = true; detach(); }
    const closeStarted = prior?.writer?.getDisposition().startsWith('close-') || snapshot.phase==='unknown';
    const cleanup=prior?.collection?.abort()??prior?.writer?.abort();
    const published=publish(closeStarted ? 'unknown' : phase, closeStarted ? 'close-unconfirmed' : prior?.writer ? 'aborting' : snapshot.writer);
    prior?.abort.abort();
    if (prior?.writer && cleanup) {
      const writer = prior.writer;
      void cleanup.then(() => {
        if (!active && snapshot === published) publish(published.phase,writer.getDisposition());
      }, () => {
        if (!active && snapshot === published) publish(published.phase,writer.getDisposition());
      });
    }
  }
  function watch() {
    if (detachRuntime) return;
    detachBoundary = client.boundary?.subscribeInvalidation(() => retire('retired'));
    detachRuntime = runtime.subscribe(() => {
      try { client.assertReady(); }
      catch (error) { retire(error instanceof TransportError && error.status===503?'unavailable':'retired'); }
    });
  }
  async function saveFromUserAction(options: {signal?:AbortSignal} = {}): Promise<void> {
    if (disposed || notifying || active || snapshot.phase === 'unknown' || ['aborting','abort-unconfirmed'].includes(snapshot.writer)) return;
    const signal=options.signal;
    const attempt:Attempt = {abort:new AbortController(), writer:null, collection:null};
    active = attempt;
    const check = () => {
      client.assertReady();
      if (disposed || active !== attempt || attempt.abort.signal.aborted || signal?.aborted) throw new TransportError(503);
    };
    const callerAbort = () => { if (active === attempt) retire('cancelled'); };
    try {
      check();watch();check();
      const pickerHost = host ?? (typeof window === 'undefined' ? undefined : window as FinalExportPickerHost);
      const picker = pickerHost?.showSaveFilePicker?.bind(pickerHost);
      check(); // Capability access/binding may synchronously retire this attempt.
      if (!picker) { active=null;publish('unavailable','unopened');return; }
      signal?.addEventListener('abort',callerAbort,{once:true});
      publish('saving','unopened');check();
      const handle = await picker({suggestedName:'shelv-final-plan.html',excludeAcceptAllOption:true,types:[{description:'HTML document',accept:{'text/html':['.html']}}]});
      check();
      const writer = createBrowserFinalExportStaging(handle,check);
      attempt.writer=writer;
      await writer.open();check();
      const port = createClientFinalExportRequest(runtime);
      attempt.collection=createFinalExportCollection(command => port.execute(command,{signal:attempt.abort.signal,isApplicable:()=>active===attempt&&!disposed}),writer,check);
      await attempt.collection.collect();
      check();active=null;publish('closed',writer.getDisposition());
    } catch (error) {
      if (active === attempt) {
        active = null;
        // No command/model/export bytes are retained in presentation state.
        let phase: AccountFinalExportPhase | undefined;
        try { client.assertReady(); }
        catch (error) {
          if (error instanceof TransportError && error.status===503) phase='unavailable';
          else { disposed=true;detach();phase='retired'; }
        }
        const writer=attempt.writer;
        const cleanup=attempt.collection?.abort()??writer?.abort();
        if (writer?.getDisposition().startsWith('close-')) phase='unknown';
        if (!phase) {
          if (signal?.aborted) phase='cancelled';
          else if (error instanceof TransportError) phase=error.status===401||error.status===403?'unauthorized':error.status===409?'basis-conflict':error.status===400?'invalid':'unavailable';
          else if (error instanceof Error && error.name==='AbortError') phase='cancelled';
          else phase='unavailable';
        }
        const published=publish(phase,writer?.getDisposition()??'unopened');
        attempt.abort.abort();
        if (writer && cleanup) {
          try { await cleanup; } catch { /* Retain explicit disposition. */ }
          if (!active && snapshot===published) publish(phase,writer.getDisposition());
        }
      }
    } finally {
      signal?.removeEventListener('abort',callerAbort);
      // Cleanup hooks may synchronously retire/replace the actual session.
      if (!disposed) {
        try { client.assertReady(); }
        catch (error) { retire(error instanceof TransportError && error.status===503?'unavailable':'retired'); }
      }
    }
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener:()=>void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    saveFromUserAction,
    cancel() { if (active) retire('cancelled'); },
    dispose() { if (!disposed) retire('retired'); listeners.clear(); },
  };
}
export type AccountFinalExportController = ReturnType<typeof createAccountFinalExport>;
