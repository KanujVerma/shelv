import {PortalError} from '../advisor/api.js';

/** Immutable client-safe snapshots. This adapter has no transport or mutation path. */
export function createReadOnlyPreviewRequests(envelope) {
  const snapshot=structuredClone({clientView:envelope.clientView,payments:envelope.payments,checkins:envelope.checkins});
  const reader=(action,value)=>async(command,{signal}={})=>{
    const paymentV2=action==='client_read'&&value===snapshot.payments&&command?.schemaVersion===2;
    if(!command||typeof command!=='object'||command.action!==action||Object.keys(command).length!==(paymentV2?2:1))throw new PortalError(403,'preview_read_only');
    if(signal?.aborted)throw new DOMException('Aborted','AbortError');
    return structuredClone(value);
  };
  return {core:reader('client_read_v2',snapshot.clientView),payments:reader('client_read',snapshot.payments),checkins:reader('client_read',snapshot.checkins)};
}
