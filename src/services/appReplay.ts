import {createAppReplayController} from '../presentation/session-replay/controller.ts';

/** Customer capture is unavailable through this singleton.
 * No environment flag, usage-consent record or remote flag can change these gates.
 * Generated UIKit and local React Native recorders are separate explicitly started tests.
 * Supply an actual native adapter only after its build, masking, synchronous
 * revocation and transport admission are verified and activation is approved.
 */
export const appReplayController = createAppReplayController({
 activationApproved: false, nativeBuildVerified: false, maskingVerified: false, driver: null,
});
