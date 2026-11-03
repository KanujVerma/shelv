import {readDate} from '../../../../../../src/contracts/ConciergePortalValidation.ts';
import type {ClientServiceView} from '../../../../../../src/contracts/PortalClientService.ts';
import type {AccountServiceState,CancellationDraft} from './types.ts';

export function initialServiceState():AccountServiceState {
  return Object.freeze({phase:'unread',current:null,draft:null,original:null,receipt:null,originalStatus:null,
    writeState:'idle',busy:null,canReview:false,canConfirm:false,canRetry:false,message:null});
}

/** Equality with the actual current projection, never a client-authored date. */
export function matchesCancellationDraft(current:ClientServiceView|null,draft:CancellationDraft|null):boolean {
  if(!current||!draft)return false;
  const e=current.periodEndCancellation;
  return e.state==='available' && current.coverage.status==='active' &&
    current.serviceRevision===draft.current.serviceRevision && current.basisHash===draft.current.basisHash &&
    current.asOfDay===draft.current.asOfDay && current.coverage.paidSupportEndsOn===draft.supportEndsOn &&
    e.supportEndsOn===draft.supportEndsOn && e.readOnlyEndsOn===draft.readOnlyEndsOn;
}

/** Presentation only. Never derives coverage or a new boundary from a date. */
export function serviceDateLabel(value:unknown):string {
  try { return readDate(value); } catch { return 'unavailable'; }
}

/** Only a proven source amount is displayed. The offer is not a receipt. */
export function serviceAmountLabel(cents:unknown):string {
  if(typeof cents!=='number' || !Number.isSafeInteger(cents) || cents<0)return 'unavailable';
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
}
