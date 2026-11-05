import type {FinalExportCommand} from '../../../../../../src/contracts/PortalFinalExport.ts';
import {collectFinalExport, finalExportSha256} from '../../../../../../src/contracts/PortalFinalExportMapping.ts';
import {createFinalExportHtmlSink} from '../../../../../../supabase/functions/concierge-final-export/serializer.ts';
import type {BrowserFinalExportStaging, BrowserCloseAcknowledgement} from './writer.ts';

/** Internal composition. The real factory supplies the actual authenticated
 * request. Pure tests may separately supply labeled finite synthetic wire. */
export function createFinalExportCollection(
  read: (command: FinalExportCommand) => Promise<unknown>,
  writer: BrowserFinalExportStaging,
  assertCurrent: () => void,
) {
  let started=false, retired=false;
  const check=() => { assertCurrent(); if (retired) throw Error('export_retired'); };
  const guarded = async <T>(work: () => Promise<T>): Promise<T> => {
    check();
    try { const value = await work(); check(); return value; }
    catch (error) { check(); throw error; }
  };
  const sink = createFinalExportHtmlSink(writer.ports);
  return {
    // The actual sink clears its labels/expected manifest synchronously before
    // initiating owned writer cleanup. Controller retirement calls this first.
    abort: () => { retired=true;return sink.abort(); },
    async collect(): Promise<BrowserCloseAcknowledgement> {
      if (started) throw Error('export_collection_in_use');
      started=true;
      try {
        const result = await guarded(() => collectFinalExport(
          command => guarded(() => read(command)),
          {stage:(...args) => guarded(() => sink.stage(...args)),
            commit:manifest => guarded(() => sink.commit(manifest)),
            abort:() => sink.abort()},
          text => guarded(() => finalExportSha256(text)),
        ));
        assertCurrent();
        return result.commitResult;
      } catch (error) {
        try { await sink.abort(); } catch { /* Disposition preserves uncertainty. */ }
        assertCurrent(); throw error;
      }
    },
  };
}
export function collectFinalExportToWriter(
  read: (command: FinalExportCommand) => Promise<unknown>,
  writer: BrowserFinalExportStaging, assertCurrent: () => void,
): Promise<BrowserCloseAcknowledgement> {
  return createFinalExportCollection(read,writer,assertCurrent).collect();
}
