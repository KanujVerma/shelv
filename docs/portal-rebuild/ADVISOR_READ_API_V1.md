# authoritative advisor read seam

Owner: Kanuj. Status: designed, not implemented or verified. This bounded read extension is required to connect the approved advisor UI without inventing authority or publication metadata.

The current API returns draft/review state and write receipts. It cannot recover a current exact approval after restart or return the canonical published V3 state to an advisor. W2 correctly leaves its explicit context port blocked rather than reconstructing a publication or assuming a remembered approval is still valid. The client read derives its own owner and must remain that way.

## fixed operations

Add two strict read-only actions to the existing authenticated plans family. Use fixed RPC dispatch only, no arbitrary table/RPC/URL access. Reuse existing live principal/session/client/draft/task/deletion guards and current-policy predicates. Backend implementation pins exact request/result exports before consumers wire them.

- `read_advisor_gate_v1`: exact draft/target identity and an explicit selected publisher (default current authenticated human if safely defined). Return a target-bound client identity, actual current `Approval|null`, first/later publication state and active/inactive coverage, plus server-derived actor capabilities/policy revision needed by the UI. Approval must match client/content/assignment/hash/scope/publisher, remain unrevoked/unconsumed, and satisfy current human/agent policy. Payment-only bookkeeping must not remove it. Content/policy/source/role/revocation changes must be reflected honestly. Mismatched/stale target rejects; no cached receipt is treated as current approval.
- `read_advisor_publication_v1`: explicit client ID and current/specific canonical version. Return an envelope bound to that client/version with the actual immutable public document, actual decision/use/review-schedule state and actual client care-access/entitlement status. Support R1/R2/V3 through the lossless normalized projection. Never rebuild published truth from a mutable draft, fabricate a version/date/entitlement, expose raw private facts/notes/source locators or infer actual use from choice/payment/delivery.

Root DTOs remain distinct from the client's owner-derived read. An authorized advisor may have an audit read while the client's care window is ended; label that state explicitly rather than inventing a client-active/read-only entitlement. No new care writes, support promise or raw-source permission follows from a read. Raw source access remains separately granted. Task-agent access, if supported, requires an explicit finite action and exact client/draft/session scope; a read must not create a global advisor right.

## integration and ownership

The current W2 context port expects `{clientId,approval,publication,coverage}` from real authorized evidence, and separate authenticated directory/payment ports. An adapter may select these fields from the new strict envelope. Unknown data stays blocked. UI permissions come from authenticated server authority rather than display names/model fields. A preview remains `published:false` with safe content; it does not become a `ClientPlanView` with invented metadata.

W1 is the sole writer for this new read seam's root types/validators/mappers, plan handler/runtime and one newly generated forward migration after `20261030223603`. Do not edit the reviewed first migration for this extension. Record exact RPC/field/type decisions and generated filename before another migration writer is allocated. Coordinator owns gateway fixed action/capability integration and frontend app/preview composition; W2/W3 feature paths remain separate. No package/dependency/production config changes or real identity/grant seeds.

## required verification

Behavior tests must prove restart/current approval recovery, payment independence, content/revocation/policy/publisher invalidation, correct target/client/version binding, current/legacy/history projections, expired client versus authorized advisor read, agent scope/revocation/session expiry where supported, denied cross-client/private-source attempts, no raw table/helper grants or unpinned search paths, no writes/clock/outbox/Start effects, and no fabricated publication data. Existing first-slice and fix suites remain green. Genuine Auth/PostgREST/browser and full canonical reset/pgTAP remain coordinator acceptance gates. Independent review must assess the read extension before complete integration acceptance.
