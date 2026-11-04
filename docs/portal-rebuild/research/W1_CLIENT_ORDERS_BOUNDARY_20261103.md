# Guarded Orders boundary source pin

Owner: Kanuj. Bounded SOURCE-only interface preparation, base8893b0a4bd0fc9e3c485a99d63dcbee7faeb11e0, own worktree `/Users/kanuj/.t3/worktrees/shelv/kanuj-w1-client-orders-boundary-20261103`. No SQL, ACL, backend/provider/registered-boundary switch, cutover, typed write, resource or M02/M65 audit is performed.

The old PortalClientOrdersValues namespace has no content_version_required. Old public v1 SQL can return200/null fields for typed rows, followed by a strict Edge503; unchanged v1 cannot emit a new explicit409. W0 approved preparation of a NEW guarded legacy boundary and future complete typed reader, with direct old EXEC retirement only at a separately reviewed later cutover stage. Existing M02 source/evidence remains bounded to its actual old-only surface.

## Exact separate exports

New `PortalClientOrdersBoundary.ts` exports:

- Closed `ClientOrdersBoundaryErrorCode` and `clientOrdersBoundaryErrorStatuses`: all seven existing meanings/statuses unchanged, plus exact content_version_required409. No uncertain/new permissive success or soft503 alias. A future typed boundary can reuse this base only through its separately frozen contract.
- `GuardedClientOrdersReadRpcCall` and `buildGuardedClientOrdersReadRpc(input)`, with prospective fixed RPC `concierge_client_orders_read_guarded_v1` and the SAME strict legacy command JSON. It delegates only argument normalization to the old builder and supplies the one closed new name. No caller RPC/client/role/format selector.
- `mapGuardedClientOrdersReadResult(input,command)` delegates the unchanged old positive reader. Malformed/typed200 JSON remains a strict parsing failure. Only an actual admitted SQL guard may produce the explicit version-required refusal.

All four original ClientOrders contract/values/validation/mapping files are unchanged. Current old dispatch and validation-only references keep their actual meaning until an explicit owner switch. No function with the new name is asserted present or registered; actual catalog availability is UNRUN.

## Observed proof and inventory

Actual runtime readback remains codex/gpt-6.1-sol/xhigh/default, explicit Node22.23.0; no nested agents. Initial8 new-export assertions fail8/8, exit1 (`exports-red.log`), a new interface export gate rather than an observed historical SQL failure. Current8/8 pass, exit0 (`current8.log`): exact old/new namespace, old/new fixed builder name/args, selector denials, identical legacy positive projection and no malformed200-to409 reinterpretation. Root app/test TypeScript graphs both exit0. Evidence is own ignored `.local-artifacts/w1-orders-boundary/`; npm ci used the unchanged lock under explicit Node22.

W5 repository caller inventory v2 SHA256 `4f80955ee2017db09910578ba747ba7a12d9126f936ee54fbbc62530d1b60524` was read and all23 listed source blobs/SHA256 verified at8893. It expands181 repository aliases/references, not181 calls. Current backend runtime actually dispatches the old fixed RPC; the common builder selects that old target. Shared client-policy also calls the builder only to normalize args, with its name unused there. Handlers/app entry aliases require explicit classification, not blind replacement. Generated/deployed/external consumers remain UNMEASURED. The earlier16-file literal inventory remains an initial reference search, not overwritten or promoted to exhaustive proof.

## Required stage gates

NEW guarded legacy SQL must run actual permanent own-client guards and the same client advisory lock, classify the complete history and delegate unchanged v1 only for fully representable data. The typed public read must include every actual legacy_purchase/purchase with immutable IDs/dates. No filtering, fabricated legacy fields, null-success inference or caller data supplies compatibility. W0 owns shared provider/registration/caller changes and exact current69/predecessor compatibility.

Only after ALL supported callers switch and fresh independent A/B old-only equivalence/mixed/foreign/session/CSRF/no-effects/current69 tests pass may a separately approved execution/release packet retire direct authenticated v1 EXEC while preserving old OID/body. Today old body/OID/EXEC are unchanged; the direct old API is unsupported for typed history and is not claimed version-aware. Typed WRITE ACTIVATION remains held. No protected/stopped fixture is rerun, no M02 artifact relabeled and no held principal/Guidance/M65/photo/private-egress review resumed.
