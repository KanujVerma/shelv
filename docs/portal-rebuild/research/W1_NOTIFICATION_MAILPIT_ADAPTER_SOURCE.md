# W1 local Mailpit SMTP adapter source

Owner: Kanuj. Author date: 2 November 2026. **Standalone author candidate with source and explicitly synthetic SMTP transcript evidence only. No actual socket, Mailpit, provider, Auth, SQL, mounted worker or email delivery was executed. No SOURCE_READY or independent acceptance is claimed. A NEW independent R1 is required before Parent composition.**

## Scope, identity and preserved inputs

Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-4018546f`, branch `t3/mailpit-smtp-adapter`. Clean starting head: `8af746d197b976972d4b16924155afa8c3b32d44`. Only three new tracked paths are owned: [mailpitSmtp.ts](../../../supabase/functions/concierge-notifications/mailpitSmtp.ts), [the transcript tests](../../../tests/portal-notification-mailpit-smtp.test.ts), and this report. No existing tracked file is edited, and no commit is imported. Parent owns canonical status and CONTEXT_SYNC updates.

The authoritative taskId was copied verbatim from Parent's separate accepted-tool-receipt message, not inferred from a thread or run:

`node:delegated-task:command%3Amcp%3Afab56c32-51e9-4c25-a214-3043797a2822%3Adelegate-task%3Aportal-rebuild-w1-mailpit-notification-adapter-source-20261102-r1`

The actual self record separately identifies backing thread `thread:delegated-task:command%3Amcp%3Afab56c32-51e9-4c25-a214-3043797a2822%3Adelegate-task%3Aportal-rebuild-w1-mailpit-notification-adapter-source-20261102-r1`, active run `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Afab56c32-51e9-4c25-a214-3043797a2822%253Adelegate-task%253Aportal-rebuild-w1-mailpit-notification-adapter-source-20261102-r1:ordinal:1`, and actual Parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`. Live self/Parent records and capability inheritance/catalog descriptors establish codex/gpt-6.1-sol/xhigh/default before implementation; Parent separately forwarded its live settings. Registered project defaultModelSelection is null, not a runtime pin. No identity acknowledgment or nested task was requested.

Own and Parent project config/eight distinct role files match by bytes/modes: project SHA256 `927e3dd532c0daabbb975f6879866aa99cbc12d3f20d080b0568867e37ee66ff`, each role `a1f57cf26da8626380cbaa101ca04dc39a92e4bd6aa6acb6cd9f5f24a05d9feb`. All Node invocations use `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, verified v22.23.0 before implementation/imports and at finalization. No settings or dependency manifest changed.

Read the full original95,388-byte approved input including A/B/C, the exact D01-D48/specification/manifest, applicable root/portal instructions, rebuild entry/contracts/WORKSTREAMS/current status/addenda, actual worker/neutralPayload/localSink and complete W1 kernel/N1/N2 report, independent kernel R1/R2/R3, current transport R3/NT2 and native executor R4/NE4 reports. The separately retained decisions/specification/manifest match their full original-input sections. All five originals match INPUT_PROVENANCE; approved input SHA256 remains `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. The absent tracked kernel R1 was read from exact Git commit `b22428b649ff4d68062170a2367e2420a2b8c990`; it was not imported. Historical FAILs and bounded R3 PASS remain their original evidence levels. NT2 and NE4 are not corrected, bypassed or accepted here.

## Standalone API and authority boundary

Parent's proposed API fits the actual `NeutralNotificationEmail` and `AdapterResult`; the exact claim was sent to Parent before exports. The new module exports `createMailpitNotificationAdapter(config)` and its new `MailpitNotificationAdapter` type only:

```ts
config: {
  host: '127.0.0.1' | '::1';
  port: number;
  from: 'shelv@synthetic.invalid';
  timeoutMs?: number;
}
adapter.kind: 'local_mailpit_smtp'
adapter.send(message: NeutralNotificationEmail, operation: {
  notAfter: string;
  signal: AbortSignal;
  revalidate: () => Promise<void>;
}): Promise<AdapterResult>
```

The existing `NotificationAdapter.kind: 'local_synthetic_filesystem'` is intentional and unchanged. This module cannot be passed to the current worker without a separately pinned integration. It adds no index, job runner, provider configuration, SQL writer/allocation, Root DTO, shared Auth, route or local-sink modification.

Config, message and operation use closed own data-property copies before awaiting. Extra actor/authority/routing/credential/header fields, accessors and symbols deny. The actual neutral codec validates the five original fields, exact generic subject/text and fixed destination paths. The adapter additionally restricts recipients to `@synthetic.invalid` and HTTPS links to synthetic.invalid or its subdomains, without ports, credentials, controls or URL normalization. No skin, product, evidence, consultation or private clinical body is added. Config accepts literal loopback only, a bounded integer port, fixed sender and integer timeout1..10000ms, default10000ms. DNS names, external IPs, URLs, credentials, AUTH and arbitrary headers/routing are rejected before connect. No environment/config/credential discovery or module-load I/O exists.

`revalidate` is mandatory and must return a Promise resolving void. Missing, thrown/rejected, synchronous or boolean results deny; no default true or caller authority flag exists. It runs before socket construction, immediately before recipient-envelope exposure, before DATA, and after354 immediately before the body. Every awaited continuation also checks the captured private operation identity, actual AbortSignal, wall/monotonic clocks and fixed deadline. Reentrant sends on that adapter fail busy without opening another socket. An old socket/callback cannot retire or write into the next send.

These callback tests are synthetic contract assertions, **not current SQL/owner/session authority proof**. The adapter does not know or grant owner/session/lease/body authority. The future trusted worker must capture immutable actual delivery/recipient/event/lease/owner/session context, perform fixed SQL current-context revalidation and compare the current exact neutral message/body binding before resolving void. A supplied no-op callback in a transcript does not establish any of that genuine authority.

## SMTP behavior and outcome truth

The default source uses actual Node22 `net.Socket`. Construction occurs only inside send after initial validation/revalidation; connect receives only literal host, port and family4/6. Each send owns one socket. The closed exchange is220 greeting, EHLO, MAIL, RCPT, DATA/354, one body write/final250, then QUIT/221 and captured socket close. Advertised AUTH is ignored; no AUTH, STARTTLS, arbitrary command, retry, resend or socket reuse is implemented.

One absolute budget is the minimum of trusted notAfter and timeoutMs, checked with both wall and monotonic clocks from the initial operation. It is never renewed per await. Valid ISO instants with explicit offsets are supported; invalid calendar components, nonfinite/regressing clocks, expired context, timeout and abort deny. Microsecond instants conservatively truncate to local millisecond precision. Connection, revalidation, command/write callback/drain, reply and successful cleanup share that same cutoff. A late promise can settle but cannot resume SMTP writes. Cancellation cannot recall already exposed bytes or an already queued message.

Replies require CRLF, valid UTF8, exact three-digit code/separator and matching multiline codes. Bounds are512 bytes per reply line,32 lines per reply,8192 buffered bytes and32768 total reply bytes. Unsolicited/pipelined replies, invalid controls, oversized/inconsistent/interrupted replies and wrong state codes close the captured socket. Writes wait for both callback and drain when backpressured. Errors and synchronous throws never expose upstream text in AdapterResult.

MIME uses fixed From/Subject, validated To, UTF8 text, CRLF and dot stuffing, with8192 total bytes and998 bytes per wire line. Message-ID is `<actual-deliveryId@synthetic.invalid>`, lowercasing the actual UUID; no UUID, delivery receipt or provider ID is invented. Repeating a message sends again with the same Message-ID on a new socket. **Identical Message-ID is not SMTP deduplication.**

Accepted requires an actual parsed final250 reply matching `250 2.0.0 Ok: queued as ID` case-insensitively, with a single1..128-character ASCII alphanumeric/dot/underscore/hyphen ID beginning alphanumeric. It returns that parsed ID unchanged, only after graceful QUIT, socket close and final cleanup/abort/deadline checks. The supported acknowledgment grammar is exercised synthetically, not verified against a running Mailpit version. Another final250 format returns uncertainty rather than a made-up ID.

Failures before a body write attempt return failed. The body attempt is marked before calling write because even a throwing write may have exposed bytes. Every later error, rejection, malformed/lost/delayed acknowledgment, abort, timeout or cleanup failure conservatively returns uncertain, including an explicit negative reply after body dispatch. There is no resend or reconciliation. A valid queue acknowledgment followed by QUIT/cleanup failure is also conservatively uncertain. Failed cleanup cannot fabricate acceptance; no OS-close guarantee is claimed for a deliberately throwing Socket double. Successful transcripts require the close event. Error observers remain on the captured destroyed socket to absorb late events without further I/O.

## Executed checks and preserved failures

Evidence home: `.local-artifacts/mailpit-smtp-source/`. Unique immutable JSON logs retain full argv/cwd/stdout/stderr/true exit, timing and output SHA256. The runner prints TRUE_EXIT before exclusive result creation. Tool display truncation does not truncate those logs.

| Current check | Result and level |
| --- | --- |
| New SMTP matrix plus unchanged six notification files | **68/68,0 failed/skipped/cancelled**, exit0:29 new plus39 retained. `final-29-and-retained-39.json`. |
| Strong transitive notification graph | **TypeScript6.0.3,226 files/57 own source-test files,0 errors**, exit0. strict/noUncheckedIndexedAccess/verbatimModuleSyntax/skipLibCheck:false/noEmit. `strict-final.json`. |
| Configured Root application types | `node node_modules/typescript/lib/tsc.js --noEmit`, exit0. `root-app-types.json`. |
| Configured Root test types | `node node_modules/typescript/lib/tsc.js -p tsconfig.tests.json --noEmit`, exit0. Initial `root-test-types.json` and exact final `root-test-types-final.json`. |
| Final whitespace/link/write-scope and full protected readbacks | See final-protection/terminal receipts. Only the three new claimed paths; ordinary owned commit, no hook bypass. |

All test commands above use the explicit Node22.23.0 binary. The new test executes the actual source and actual neutral-codec transitive graph in a Node VM after standard TypeScript CommonJS transpilation. Only node:net is injected with an explicitly synthetic finite transcript Socket. No adapter accepted result, parser, write ordering, capability/currentness implementation or Vault is stubbed into genuine proof. The VM denies global external fetch, storage, crypto UUID/random generation and every unexpected resource import. Socket construction is trapped until after module evaluation. The private serializer is read through a VM-only appended return for one pure dot-stuffing assertion; the same non-neutral input is rejected by actual send before any connect. No production test-only export or codec relaxation exists.

The29 new tests cover exact MIME/final ID, same-message/new-socket behavior, configuration and actor/header/control rejection, stale/invalid context and clocks, accessor/symbol denial, address/config/operation mutation, callback reentry and malformed results, revocation at all four checks, pending/late callbacks, cumulative deadline/notAfter, abort before/during connection/reply, line/multiline/UTF8 bounds, interrupted replies, rejection/error/write-throw before versus after DATA, backpressure, delayed ACK, cleanup throw/pending close/reentrant abort, retired-socket isolation, IPv6, wire line bounds, real calendar validation and explicit-offset compatibility. Deliberate cleanup method instrumentation is a source fault vector, not a naturally observed mounted callback or native event schedule.

The retained39 remain source/finite HTTP and existing local-filesystem regression evidence. Their actual synthetic filesystem receipts are not SMTP acceptance or email delivery evidence. They were executed unchanged; no existing worker test, neutral codec or filesystem adapter was adapted.

Raw failures remain separate: missing-adapter RED0/20; first implementation8/20 with a VM Uint8Array realm-binding error and two RegExp test typos; corrected boundary19/20 with the remaining test typo; actual-source RED23/25 showing accepted malformed revalidation and an unhandled late write rejection; GREEN25/25 after both production fixes;65/65 with the26th test and retained39;27/27 with retired-socket isolation; separate notAfter RED0/2 showing rejected +00:00 and accepted February30 rollover; current68/68 after private parser correction. Initial strict graph exit2 has three new-test typing diagnostics; corrected strict graphs exit0 retain all original flags/declarations. Existing Node typeless-package warnings remain unsuppressed. No failing result is relabeled as independent or genuine success.

## Dependency and source custody

Both own dependency roots were absent and ignored. Before acquisition, checked actual package bytes, all four own/Parent root+portal locks, all91 tracked runtime inputs, nonsymlink ancestors/roots, same device and full source byte/mode/kind/literal-link inventories in place. Only then `/bin/cp -cR` cloned Parent root and portal node_modules into own paths. Full before-probe and final source/destination parity covers43,213 root and9,071 portal entries including roots. Relative .bin links stay within their own dependency tree; the sole workspace link `../session-integration/runtime` resolves to the existing own tracked runtime. No foreign executable, generated runtime, Auth state, install, shim, weak flag or declaration substitute was used. Root lock remains `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2`; portal lock `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`, in both checkouts.

The initial2,128 tracked paths, including66 migrations/all121 SQL, existing notification worker/neutralPayload/localSink/tests, Root DTOs, shared Auth/routes/runtime91, all package/lock/model pins and original approval bytes/modes/literal links are protected. Prior reports/source are hashed in place; no recursive historical archive was copied. Only executed inputs were copied when needed for evidence. Ordinary hooks were inspected: no hooksPath override or active hook. No remote fetch/write, push, PR, merge or deployment occurred.

## Required future integration and unrun gates

1. NEW independent R1 must review the exact committed source, reproduce relevant RED/current behavior and complete its own finite matrix. This author report is not self-acceptance. Parent must obtain a precise separate pin before widening the intentionally frozen worker adapter union or integrating this source.
2. Future worker composition must bind the actual delivery/lease/recipient/source and immutable neutral body, supply fixed-SQL current-context checks and actual owner/session authority where applicable, and derive notAfter from the trusted lease/operation. Root RPC ports and revalidation cleanup need the same absolute deadline/cancellation; pending callback work cannot inherit renewed time or late write rights. No caller flags or wire fields can supply authority. No new SQL writer/allocation is proposed here.
3. A future explicit local fixture may require a narrowly selected Root worker URL for the exact loopback fixture. The current HTTPS-only Root worker constructor is unchanged. Any separate fixture URL pin must retain fixed RPCs, exact origin/port/path, credentials and abort/deadline boundaries; **no blanket HTTPS relaxation** or caller-selected URL/RPC is justified.
4. Native executor R4/NE4 remains unaccepted. No NodeSchemaRoot/native executor, status command, cached image, listener, socket, Mailpit, Docker, Auth/DB/SQL, process inventory or provider operation ran. No execution grant is inherited or bypassed. Genuine SQL/current rights/catalog/concurrency and actual worker-to-Mailpit queue acknowledgment remain unrun.
5. Actual Mailpit/version/SMTP port/queue-ID format, no-relay/no-auto-forward configuration, provider credentials/domain/relay policy, external recipient provider and authenticated delivery/bounce/reconciliation evidence remain open. Even genuine local Mailpit acceptance would not establish real-recipient delivery. Nothing here proves delivered/read or authorizes real clients/messages/money/permission changes.
6. Mounted Root/notification App composition, the NT2 dependency, inbox/A06/retry and destination recovery, complete application/npm/portal/Expo suites, native/browser/visual/accessibility/genuine/CI/human/business/release gates remain open. Full npm test and Expo export were not run in this bounded source phase; no full implementation or release completion is claimed.

Parent receives only the ordinary three-file author commit and exact evidence paths. Canonical status/CONTEXT_SYNC, independent review dispatch and later composition remain Parent-owned.
