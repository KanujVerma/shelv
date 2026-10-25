# Portal admission local Auth fixture

The portal uses its own browser-bound PKCE confirmation links. The root Expo configuration intentionally uses a different email-code experience. Do not change the root configuration or point this acceptance test at its code-only mail template.

The versioned `supabase/config.toml` selects a separate project prefix, loopback callback `http://127.0.0.1:57430/`, API57421, DB57422 and local Mailpit57424. Preparation generates a persistent owner UUID and a unique project ID under that prefix. Different prepared folders/checkouts therefore cannot silently reuse one fixed database identity. Email confirmation is required and the standard confirmation-link templates are retained. There are no credentials, users, SMTP-provider settings or historical machine paths in this fixture source.

From the repository root, with Node22.23 or newer, Docker, Supabase CLI and installed root/portal dependencies:

```sh
node apps/portal/scripts/local-admission.mjs run --browser
```

This prepares an ignored snapshot of every current canonical SQL migration under `.local-artifacts/portal-admission-fixture/`, starts only the fixture's Supabase project, captures local credentials privately, verifies/installs the disposable marker, runs native Auth/PostgREST/SQL acceptance and the Chrome founder journey, then stops only this fixture while retaining its volumes. An installed Chrome is needed for `--browser`; omit it for the native service/SQL cases. In CI, install the pinned portal packages before running it.

`DOCKER_HOST` may select an existing local Unix socket, including a named Colima profile. If omitted, `/var/run/docker.sock` is used. The runner rejects remote Docker targets and does not switch a Docker context, start/stop a VM, read registry credentials, touch the root Expo Auth project, send real email or use hosted data. Logs that might contain generated local keys use private file permissions and their contents are not printed. `NATIVE-RESULT.json` contains only bounded synthetic results; screenshots are generated only with the browser option.

For separate lifecycle steps:

```sh
node apps/portal/scripts/local-admission.mjs prepare
node apps/portal/scripts/local-admission.mjs start
node apps/portal/scripts/local-admission.mjs test --browser
node apps/portal/scripts/local-admission.mjs stop
```

Preparation records migration/config hashes and refuses an unmarked directory or changed snapshot rather than resetting prior data. Before starting or stopping, the runner checks the owner receipt, exact volume identity/creation time and container checkout labels. A lifecycle lock prevents overlapping commands from stopping another run. An unknown retained volume or foreign checkout fails before startup or cleanup.

On a positively verified fresh volume, the runner verifies the actual migration ledger's versions/names and writes a private database-side fixture attestation containing its owner, prepared snapshot hash and applied-statement ledger hash. Reuse must match that database attestation and its local ownership receipt. Missing versions, same-version changed source content, changed applied statements and an unbound retained database are refused before admission bootstrap or acceptance writes. The success count comes from this verified runtime ledger, not the number of copied files. This is migration-lineage verification; it does not claim detection of arbitrary manual schema changes that do not alter that ledger.

`run` cleans up its positively owned attempted startup even if testing fails. `start` deliberately leaves the fixture running until `stop`. No command deletes volumes or resets another project. When canonical migrations/config change, preserve the old prepared directory and explicitly prepare a new instance. Its new owner/project creates a fresh volume while the prior database remains retained. A v1 fixture without runtime ownership/lineage attestation is deliberately not adopted. The runner does not infer deletion permission or retroactively assert which source produced an unverified database.

This fixture complements the root full-migration/pgTAP gate and the portal gateway/session suite. It proves the intended local portal Auth contract, not the email-template configuration or admission deployment of a hosted project.
