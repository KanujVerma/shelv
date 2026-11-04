# W7-W5-S1: historical claim ACK contradicts current status

Owner: Kanuj. **Current4a9 first-service disposition: HOLD, P2 correction required.** The [prior22-case source pass](W5_SERVICE_4A9.md) and hosted clean review remain preserved as narrower historical proof. They do not defeat this additional independently reproduced case.

At `4a9b97d2623f0b4a63de840c2c634e2abf04c214`, controller submit/retry always sets outcome submitted_unverified after a valid original receipt. ServicePayments then says awaiting receipt verification and suppresses the quote form. An immutable retry receipt is not current claim status.

Reproduce with actual ApplicationSession/cookie/transport/codecs under closed synthetic HTTP:

1. Dispatch the first sent claim and lose its acknowledgement with503; retain original UUID/body.
2. Refresh/read canonical revision5 showing that same claim confirmed, or rejected. Keep the original uncertain command for deliberate recovery.
3. Retry the exact original. Return its historical submitted_unverified receipt.
4. The controller clears pending but restores the awaiting-verification outcome while its already-read view still contains confirmed/rejected. Actual SSR shows both the current verified/rejected row and the contradictory awaiting banner; the rejected form is suppressed again.

Both independent state controls fail0/2, exit1. Separate customer-visible SSR controls also fail0/2, exit1. These are not bank/financial acceptance: all inputs are synthetic and no Auth, SQL, browser or provider resource executes. The natural server schedule is supported by canonical V2 SQL line71 returning prior.result on exact replay. [Exact controls/raw hashes](W5_S1_HISTORICAL_ACK_RESULT.json) preserve evidence. One incorrect reviewer write path failed before test creation and stays separate.

W5 owns the smallest correction: separate historical acknowledgement from the last canonical projection, or obtain a fresh canonical read before claiming its present state. Preserve exact-original retry, current-owner checks and newer pending custody. No automatic resend, replacement UUID, verification/publication/Start or backend change is authorized by this finding. Implementation may choose its internal enum; customer-visible truth and recoverability are the required behavior.

The finding and raw controls were sent to W5/W0 before this report; W5 acknowledged and is reproducing in a separate checkout. W7 makes no product fix. New immutable full-scope source review is required before first-service acceptance. M02, all product numerators and principal44/other provider holds remain unchanged.
