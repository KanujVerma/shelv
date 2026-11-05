import type {AccountProfileCommand, AccountProfileReceipt, AccountProfileView} from '../../../../../../src/contracts/PortalAccountProfile.ts';
export type ProfileView = Readonly<AccountProfileView>;
export type ProfileCommand = Extract<AccountProfileCommand, {action:'set_account_display_name_v1'}>;
export interface ProfileDraft {
  readonly base: ProfileView;
  readonly displayName: string;
  readonly generation: number;
}
export interface AccountProfileState {
  readonly phase: 'unread'|'loading'|'ready'|'error'|'denied'|'inactive'|'ended';
  readonly current: ProfileView|null;
  readonly draft: ProfileDraft|null;
  readonly pending: Readonly<ProfileCommand>|null;
  readonly acknowledgement: Readonly<AccountProfileReceipt>|null;
  readonly writeState: 'idle'|'saving'|'uncertain'|'conflict'|'acknowledged'|'saved';
  readonly busy: boolean;
  readonly canEdit: boolean;
  readonly canSave: boolean;
  readonly canRetry: boolean;
  readonly fieldError: string|null;
  readonly message: string|null;
}
export interface AccountProfileController {
  getSnapshot(): AccountProfileState;
  subscribe(fn:()=>void): ()=>void;
  load(): Promise<boolean>;
  editDisplayName(): boolean;
  setDisplayName(value:string): void;
  /** A pending command is retried only by this explicit action, byte-for-byte. */
  save(): Promise<boolean>;
  readCurrent(): Promise<boolean>;
  /** Discards only local unsent work, never a dispatched command. */
  discardEdit(): void;
  dispose(): void;
}
