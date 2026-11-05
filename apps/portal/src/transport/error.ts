import type {OperationKind} from './session.ts';

export class TransportError extends Error {
  readonly status: number;
  readonly outcome: 'rejected'|'uncertain'|'session-ended';
  constructor(status: number, kind: OperationKind='read') {
    super(status===401?'your session has ended. sign in again.':status===403?'you do not have access to this action.':status===409?'this changed. review the latest version before trying again.':status===503 && kind==='write'?'the result is uncertain. check its status before retrying.':'we could not complete this request.');
    this.name='TransportError';this.status=status;
    this.outcome=status===401?'session-ended':status===503 && kind==='write'?'uncertain':'rejected';
  }
}
