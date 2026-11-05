import type {FinalExportStagingPorts} from '../../../../../../supabase/functions/concierge-final-export/serializer.ts';

// Structural local types: optional desktop API, no global declaration/shim.
export interface FinalExportWritable {
  write(html: string): Promise<void>;
  close(): Promise<void>;
  abort(): Promise<void>;
}
export interface FinalExportFileHandle {createWritable(): Promise<FinalExportWritable>}
export interface FinalExportPickerHost {
  showSaveFilePicker?(options: {
    suggestedName: 'shelv-final-plan.html'; excludeAcceptAllOption: true;
    types: {description: string; accept: {'text/html': string[]}}[];
  }): Promise<FinalExportFileHandle>;
}
export type BrowserCloseAcknowledgement = Readonly<{kind:'browser-writer-close-acknowledged'}>;
export type WriterDisposition = 'unopened'|'staging'|'aborting'|'abort-acknowledged'|'abort-unconfirmed'|'close-pending'|'close-acknowledged'|'close-unconfirmed';

/** One owned staging stream, with no aggregate/Blob or implicit destination. */
export function createBrowserFinalExportStaging(handle: FinalExportFileHandle, assertCurrent: () => void) {
  const create = handle.createWritable.bind(handle);
  let write: FinalExportWritable['write'] | undefined;
  let close: FinalExportWritable['close'] | undefined;
  let discard: FinalExportWritable['abort'] | undefined;
  let opening = false, opened = false, terminal = false, busy = false;
  let closeDispatched = false, closeAcknowledged = false, abortAcknowledged = false;
  let acquisition: Promise<FinalExportWritable> | null = null;
  let aborting: Promise<void> | null = null;
  let disposition: WriterDisposition = 'unopened';
  const check = () => { assertCurrent(); if (terminal) throw Error('export_retired'); };
  async function abort(): Promise<void> {
    // Fence first. Cleanup owns only the captured stream even after authority loss.
    terminal = true;
    if (closeAcknowledged) return;
    if (aborting) throw Error('export_cleanup_in_progress');
    if (abortAcknowledged) {
      if (!closeDispatched) disposition = 'abort-acknowledged';
      return;
    }
    if (closeDispatched) disposition = 'close-unconfirmed';
    else disposition = 'aborting';
    // Publish the cleanup promise before invoking a potentially reentrant method.
    aborting = Promise.resolve().then(async () => {
      // Loss of authority denies new content work, but cannot suppress cleanup
      // of the exact already-owned stream. No private value returns here.
      try { assertCurrent(); } catch { /* Already fenced above. */ }
      try {
        // An outstanding acquisition still owns the potential late stream.
        // Cleanup cannot acknowledge completion before it settles.
        if (!discard && acquisition) {
          try { await acquisition; }
          catch { if (!closeDispatched) disposition = 'unopened'; return; }
        }
        const ownedDiscard = discard;
        if (!ownedDiscard) {
          // A stream whose methods could not be captured remains unconfirmed.
          if (!closeDispatched) disposition = acquisition ? 'abort-unconfirmed' : 'unopened';
          return;
        }
        await ownedDiscard();
        try { assertCurrent(); } catch { /* Cleanup acknowledgement is not authority. */ }
        abortAcknowledged = true;
        if (!closeDispatched) disposition = 'abort-acknowledged';
      } catch (error) {
        try { assertCurrent(); } catch { /* Remain terminal and unconfirmed. */ }
        if (!closeDispatched) disposition = 'abort-unconfirmed';
        throw error;
      } finally { aborting = null; }
    });
    return aborting;
  }
  async function open() {
    check();
    if (opening || opened) throw Error('export_staging_in_use');
    opening = true;
    try {
      acquisition = create();
      const stream = await acquisition;
      // Capture own methods before a stale result can escape or cleanup can run.
      discard = stream.abort.bind(stream);
      write = stream.write.bind(stream);
      close = stream.close.bind(stream);
      check(); opened = true; disposition = 'staging';
    } catch (error) {
      try { await abort(); } catch { /* Cleanup remains explicitly unconfirmed. */ }
      throw error;
    } finally { opening = false; }
  }
  const ports: FinalExportStagingPorts<BrowserCloseAcknowledgement> = {
    async write(chunk) {
      check();
      if (!opened || busy || !write) throw Error('export_staging_unavailable');
      busy = true;
      try { await write(chunk.html); check(); }
      finally { busy = false; }
    },
    async commit() {
      check();
      if (!opened || busy || !close) throw Error('export_staging_unavailable');
      busy = true; closeDispatched = true; disposition = 'close-pending';
      try {
        await close(); check();
        closeAcknowledged = true; terminal = true; disposition = 'close-acknowledged';
        return Object.freeze({kind:'browser-writer-close-acknowledged'});
      } catch (error) { terminal = true; disposition = 'close-unconfirmed'; throw error; }
      finally { busy = false; }
    },
    abort,
  };
  return {open, abort, ports, getDisposition: () => disposition};
}
export type BrowserFinalExportStaging = ReturnType<typeof createBrowserFinalExportStaging>;
