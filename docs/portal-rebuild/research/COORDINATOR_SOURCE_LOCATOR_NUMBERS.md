# source locator numeric canonicalization

Owner: Kanuj. Candidate parent `3edb0700eeb423082a99a4e7e617b348364bc3dd`. Coordinator live configuration: `codex/gpt-6.1-sol/xhigh/default`; all eight role overrides match. Node `22.23.0` is explicit.

## problem and bounded correction

The first fresh canonical61 replay reset successfully, but the subsequent pgTAP run stopped in the unchanged `portal_review_guidance_v1.test.sql` at its existing scaled-number source tuple. PostgreSQL accepts the mathematical integer `1.0` in `concierge.integer`, while the later text cast `('1.0')::bigint` fails. The run completed39 files/897 assertions, with the affected file executing37 of its planned42. This was a SQL exception, not a successful canonical run.

The sole forward migration is the actual CLI-allocated `20261031172109_portal_rebuild_source_locator_canonical_numbers_v1.sql`. Prior61 migration files remain byte-exact. It changes two private functions:

- `review_source_location_canonical` first validates the complete original tuple, then uses the existing finite safe-integer parser for source version and locator fields. UUID normalization remains canonical; unknown fields are rejected rather than discarded.
- `review_source_check` replaces only five numeric text casts with the same parser: source version and both text/time bounds. Every other byte of its retained body matches M60. Original-tuple validation before deduplication, exact source/client/version/active checks, source grants, live human checks, locks and final session check remain unchanged.

There is no command, action, field, permission, table, response, request journal, guidance hash framing or global parser change. Fractional, negative, unsafe, reversed/equal ranges and invalid page values remain invalid. The migration guards both retained source hashes before replacement. `CREATE OR REPLACE` preserves existing function identities and attributes; no EXECUTE grant is added.

Migration SHA256: `bd3f54ea2f4bf82912428805b9da0e37f315f0131a9095d00dd1e2163c203861`. New test SHA256: `eb4b6a839f00516d01e0d3f09e13a1e50e9e3151b59b9ede8a1b2584e20f3710`.

## observed red and green

The coordinator owns R8, `canonical-plan-v1-r8`, project `shelv-portal-admission-00b8cdbefc9d`, owner `00b8cdbe-fc9d-47d3-a0df-23f2012af329`. It remains bound to61 migrations, snapshot `4de15a07119be995e8ee394334c00a1351a6e8fde169d6075bdf57409d3bd406`, ledger `56af2cf6e4c4975ea6b4ce754bfefd2927e8c1db85c2c2f4ff992db48d864103`. M62 was exercised only inside transactions that rolled back. R8 was not relabeled or upgraded.

Command, from the integration workspace:

```sh
PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH node .local-artifacts/portal-rebuild/m62-source-locator/probe.mjs
```

- Unchanged original42 test: RED with the exact `invalid input syntax for type bigint: "1.0"` exception. New locator test against the retained functions: same meaningful RED.
- M62 transaction plus the unchanged original test:42/42 PASS.
- M62 transaction plus new locator regression:28/28 PASS. Covers scaled whole/text/time/page tuples, exact maximum safe integer, numeric-scale/UUID tuple equivalence, malformed values, raw duplicate invalid tuples, live scoped source access and changed-version/cross-client/non-advisor/revoked-grant/deleted-source/revoked-advisor denials.
- During replacement, both `pg_proc` rows excluding only `prosrc` remain equal, including OID, owner, ACL, security mode, volatility and search path. After rollback, both complete rows match the baseline.
- All105 concierge tables and every column/row, complete migration ledger, Auth session count0 and refresh count0 match before/after. Baseline and restored snapshot SHA256 both `024e494e3613e9cfe242db8e5d99ac75732bda361fff8940b71cd93b23d0b770`.

The authority cases insert only transaction-local synthetic users/principals/cases/sources. They call the private helper with an explicit actor to exercise real SQL scope and grant checks. They do not claim genuine GoTrue, live-cookie or public-RPC acceptance.

Raw SQL/logs, complete before/after private snapshots and source correspondence are retained under `.local-artifacts/portal-rebuild/m62-source-locator/`. The probe uses the prepared fixture marker, exact owner/project/config/volume/container labels, runtime binding and61-file ledger guards before access. All61 snapshot and live parent migration hashes match.

## setup errors and pending gates

Three local probe setup errors are separate from the product RED: psql command tags preceded the JSON snapshot; pgTAP was not installed outside the CLI test transaction; JavaScript replacement-string dollar handling corrupted the generated transaction. Quiet output, transaction-local extension/search path and a function replacement callback corrected those harness issues. Their logs remain retained. No altered test expectation or production workaround was used.

Fresh canonical62 reset/full pgTAP, independent review, genuine connected Review/Guidance/V3/history execution and exact-head CI remain pending. The earlier composed M58-M61 scoped independent PASS and Root1256-pass/18-existing-skip/type/Expo evidence remain separately attributed. This correction does not close the full portal goal or authorize deployment.
