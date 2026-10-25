import type { ConciergeAuthenticatedPorts } from '../../../src/contracts/ConciergePortal.ts';
import type { CheckinPhotoAngle, CheckinPhotoType } from './photos.ts';
export type CheckinWriteAction = 'submit_report' | 'set_next_checkin' | 'add_meeting_note' | 'send_advisor_reply' | 'reserve_photo' | 'complete_photo';
export type CheckinRpcCall = { name: 'concierge_checkin_read' | 'concierge_checkin_advisor_read'; args: { p_client_id: string } }
  | { name: 'concierge_checkin_photo_authorize'; args: { p_client_id: string; p_photo_id: string } }
  | { name: 'concierge_checkin_write'; args: { p_client_id: string; p_action: CheckinWriteAction;
      p_expected_revision: number; p_request_id: string; p_payload: Record<string, unknown> } };
export type PrivateCheckinPhoto = Readonly<{ revision: number; photoId: string; ownerId: string; bucket: 'concierge-checkin-photos';
  path: string; angle: CheckinPhotoAngle; contentType: CheckinPhotoType; sizeBytes: number; sha256: string; state: 'pending' | 'complete' }>;
export type CheckinStorage = {
  origin: string;
  upload(photo: PrivateCheckinPhoto, body: Blob, signal?: AbortSignal): Promise<'uploaded' | 'exists'>;
  read(photo: PrivateCheckinPhoto, signal?: AbortSignal): Promise<Blob>;
  sign(photo: PrivateCheckinPhoto, expiresIn: number, signal?: AbortSignal): Promise<string>;
};
export type CheckinPorts = ConciergeAuthenticatedPorts<CheckinRpcCall> & { storage: CheckinStorage };
