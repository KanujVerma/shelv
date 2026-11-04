import type {ClientServiceCancelCommand,ClientServiceView,ClientServiceReceipt,ClientServiceStatus} from '../../../../../../src/contracts/PortalClientService.ts';

export interface CancellationDraft {
  readonly current:ClientServiceView;
  readonly supportEndsOn:string;
  readonly readOnlyEndsOn:string;
  readonly generation:number;
}
export interface AccountServiceState {
  readonly phase:'unread'|'loading'|'ready'|'unavailable'|'denied'|'inactive'|'ended';
  readonly current:ClientServiceView|null;
  readonly draft:CancellationDraft|null;
  readonly original:ClientServiceCancelCommand|null;
  readonly receipt:ClientServiceReceipt|null;
  readonly originalStatus:ClientServiceStatus|null;
  readonly writeState:'idle'|'reviewing'|'sending'|'uncertain'|'conflict'|'expired'|'acknowledged'|'confirmed';
  readonly busy:'load'|'confirm'|'status'|'retry'|null;
  readonly canReview:boolean;
  readonly canConfirm:boolean;
  readonly canRetry:boolean;
  readonly message:string|null;
}
export interface AccountServiceController {
  getSnapshot():AccountServiceState;
  subscribe(listener:()=>void):()=>void;
  load():Promise<boolean>;
  readCurrent():Promise<boolean>;
  openCancellation(expectedCurrent:ClientServiceView):boolean;
  discardCancellation(expectedDraft:CancellationDraft):boolean;
  confirmCancellation(expectedDraft:CancellationDraft):Promise<boolean>;
  readOriginalStatus(expectedOriginal:ClientServiceCancelCommand):Promise<boolean>;
  retryOriginal(expectedOriginal:ClientServiceCancelCommand):Promise<boolean>;
  dispose():void;
}
