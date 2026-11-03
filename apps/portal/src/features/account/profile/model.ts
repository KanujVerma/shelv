import {readAccountProfileCommand} from '../../../../../../src/contracts/PortalAccountProfileValidation.ts';
import type {AccountProfileState} from './types.ts';
export const emptyProfileState: AccountProfileState = Object.freeze({
  phase:'unread', current:null, draft:null, pending:null, acknowledgement:null,
  writeState:'idle', busy:false, canEdit:false, canSave:false, canRetry:false, fieldError:null, message:null,
});
/** Same trim_text Unicode length, exact stored bytes and wire budget as Root. */
export function validDisplayName(value: string): boolean {
  try {
    readAccountProfileCommand({schemaVersion:1,action:'set_account_display_name_v1',requestId:'00000000-0000-4000-8000-000000000001',expectedRevision:0,displayName:value});
    return true;
  } catch { return false; }
}
export const nameError = 'enter a name with 1 to 200 characters, excluding surrounding spaces.';
