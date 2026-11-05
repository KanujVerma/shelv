# Malformed advisor-client route: render recovery source

Owner: Kanuj. This bounded source successor is based on exact published `4f73c28dfb08f9b387d0170028a5f9cbe0af2fdc`. It addresses ordinary native P2 discussion4476355532. It is frozen for independent SOURCE review, unpublished and not a resolved native finding or genuine acceptance.

## Reproduced failure and minimal correction

The actual route parser accepts `/advisor/clients/not-a-client`. Actual AdvisorClientApplication calls createAdvisorClientEntry in useMemo; the constructor's canonical readUuid validation throws invalid_input during server rendering. The new actual React SSR control reproduces this on exact 4f73: one valid-input control passes and the malformed-input control fails. The native session uses a closed finite session reply and stays READY; no scoped plan/metadata request is dispatched. This is source/finite HTTP/SSR, not an authenticated installed gateway or browser crash observation.

The correction uses the same canonical readUuid validator before constructing the entry, inside the existing memo. Invalid input yields the existing client-workspace header/status wrapper and existing open-plans recovery link. Only canonical UUID validation is caught; constructor/runtime errors are not broadly swallowed. Valid input still constructs the original entry. The constructor, its own validation, owner/currentness/read/disposal fences and the entire EntryView remain unchanged. No route parser, contract, feature controller, gateway, permission or registry changes.

| Priority | Persona and goal | Source issue | Minimal correction | Regression | Evidence |
| --- | --- | --- | --- | --- | --- |
| P2 | Advisor recovering from malformed client deep link | Constructor validation escapes during render | Validate before entry construction; show unavailable state and open plans | Invalid route renders recovery with no scoped read; valid route retains inert loading | Actual React SSR and native session with finite HTTP |

The recovery action uses the existing `/advisor/plans` destination and wording. It does not claim the client exists, grant access, select another client, scan the directory or create a record. Existing navigation and effect cleanup remain responsible for valid-entry lifetime. No new UI system or explanatory paragraph is introduced.

## Verification and preserved originals

- OLD exact 4f73 plus the new control: 1 pass, 1 fail. The failure is unwanted invalid_input from readUuid through the actual constructor and useMemo. Original log and initial control bytes are retained; no failure is relabeled.
- CURRENT final: 20/20, zero fail/skip/cancel. This comprises 16 actual source finite/session/SSR controls and four unchanged lexical preservation controls, not 20 genuine predicates. The two new cases cover malformed-input recovery/no scoped read/READY and valid-input inert loading. The retained cases cover scoped read, route/session retirement, editor opening, complete-page absence and reentrancy; none exercises private publication audit actions.
- The original valid-input label said uppercase, but its UUID fixture contains only digits. The final label removes that unsupported implication; executable bytes/input are unchanged. Initial logs keep their original label. This is not case-folding coverage.
- All four UNMODIFIED configured Root, tests, frontend and session type graphs exit0 with zero diagnostics. Only existing locked root/Portal dependency symlinks are added to the exact source archive. No virtual input, compiler override, flag suppression or namespace facade.
- Removing exactly one canonical-validator import and the guarded-construction/recovery clause restores the entire prior AdvisorClientEntry.tsx preimage. All other production source is exact4f73. The native factory and full EntryView are unchanged.

Node22.23.0 MODULE_TYPELESS_PACKAGE_JSON warnings remain in the raw focused logs. No package/configuration change suppresses them. Selected dependency hashes are source closure pins, not a full runtime census.

## Open gates and scope

Independent complete3 SOURCE review, later publication/current dependency correspondence, exact new-head native/hosted gates and complete actual checkout/parent/tree custody remain required. The current 4f73 native finding is open. Current 4f73 hosted typing/CI does not erase its reproduced SSR failure. No full Root/App/Expo suite, browser/hydration/focus/a11y, live Auth/SQL/provider, private client data or resources were exercised for this fix.

PR211 remains draft; the two known held SQL/photo findings and all principal44 refusal STOP/no retry/reroute/partial/alternate/setup, HN1 DO-NOT-START, A07/Guidance/private-return/Source/photo/M65/final-egress/financial/protected-fixture holds remain unchanged. Actual inline-preview port/mount/lifetime/VIEW/persistence/genuine and W4 no-photo route/resolver/SDK metadata/current care-review-return guard eligibility remain separate and unadmitted. No acceptance count or resource grant follows.
