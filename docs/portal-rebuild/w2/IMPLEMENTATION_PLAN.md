# W2 advisor workspace plan

Owner: Kanuj. Base: 8c5c6b2d72e75f620487f1b2b110655b03551b17. Lane: advisor only.

## Constraints
- Source/finite/SSR/browser/genuine/hosted/human acceptance remain separate.
- Guidance private-return, M65 and photo provider holds remain unchanged, no retry/rephrase/reroute.
- Shared routing/composition/auth/UI/contracts are W0/W1-owned; A08 W6.
- W7 independently reviews permitted exact frozen candidates and owns serialized fresh resources.

## First milestone A07
1. Add optional exact ReportRef presentation prop to existing AdvisorGuidanceWorkspace. W0 resolves authorized report/client/publication and composes it. No new authority or endpoint.
2. Show selected immutable report and its original/corrections before drafting. Missing/denied/incomplete page are honest and cannot prepare a different report.
3. Prepare review or reply via existing newReviewBody/newReplyBody and controller. Never replace unsent work or persist on navigation.
4. Bind private-note form to the selected report separately from public review content. Keep generic workspace compatible.
5. Test source UI selection, original/amendment identity, missing pages, unsent draft mismatch, private/public separation, existing current authority holds.
6. Request W0 mount only after permitted source review, W7 packet and unchanged held restrictions.

## Remaining advisor work
- Review existing directory/client context and paging/loading/empty/error states.
- Complete canonical six-section editor/recovery/template/source/import gaps without duplicate logic.
- W5 first-service quote issue UI and separate verify receipt/publication actions.
- W1 notification delivery status/retry via canonical read_event_deliveries/retry_failed_email.
- Shared renderer preview by W3/W0.
- Focused PRs target integration; W0 serial integration and W7 independent acceptance.

## Task map
|step|goal|surface|action|result|recovery|
|---|---|---|---|---|---|
|1|find the right check-in|A07 selected report|review original/corrections|exact report visible|load remaining history or return to client|
|2|write useful response|A07 public draft|prepare review or reply|memory draft, then canonical save|same request status/retry, conflict comparison|
|3|record private context|A07 private panel|save private note|separate canonical command, no client notification|same retained request recovery|
|4|publish deliberately|A07 exact review/authority|review, approve exact revision, publish|canonical immutable guidance receipt|held missing evidence/authority stays blocked|

## UX findings
|priority|persona/goal|observed issue|effect|smallest fix|regression|evidence|
|P0|advisor reviews routed check-in|Application.tsx advisor-review falls to unavailable; generic guidance lacks ReportRef prop|cannot target routed report|W0 mount + additive selected-report UI|exact report/correction/missing/negative cases|source only|
|P1|advisor keeps private note separate|PrivatePreparation requires manual subject selection even for report route|wrong report could be selected|bind note subject to selected ReportRef in targeted mode|private command and public body remain distinct|source only|
|P1|advisor issues initial service quote|no advisor issue_quote UI|client cannot start first service payment|separate deliberate service quote action using W5 contract|uncertainty retry, no publication, denied actor|source only|
|P1|advisor sees notification outcome|A06 always says queued from publication receipt|cannot see failure/retry|canonical event deliveries UI using W1 seam|retry exact delivery, no republish|source only|
