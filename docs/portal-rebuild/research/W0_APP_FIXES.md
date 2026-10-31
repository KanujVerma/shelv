# W0 bounded application corrections

30 October 2026. Implementation sub-agent; no nested agents. Parent owns integration, canonical status/context and fresh independent review. This report responds to [W7 application source findings A1-A3](W7_APP_SOURCE_REVIEW.md), retaining [the original W0 scope and evidence](W0_APP_COMPOSITION.md).

## Identity and scope

- Workspace `/Users/kanuj/.t3/worktrees/shelv/t3-28c49432`, branch `t3/fix-portal-callback-history-ports`, clean source base `284c04e94060543106e3a686d4aa7cd61c7bebfb`.
- First live capabilities and thread configuration both returned `codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default`, full-access/default. Thread suffix `portal-rebuild-w0-app-fixes-20261030-r1`.
- Full W7 source review and original W0 report read. Inspected applicable AGENTS, approved decisions/specification including D10/D16/D38, contracts and current workstream/status records. `git diff --quiet bd2abe2 HEAD` for the original app source, builder and tests exited 0. Fresh `git fetch origin` succeeded; original local work was clean and preserved.
- Applied Resume, receiving review, systematic debugging, TDD, verification, repository UX/design and React/Supabase auth guidance. Existing approved design stays fixed. [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow) and [implicit](https://supabase.com/docs/guides/auth/sessions/implicit-flow) documentation checked; changelog inspected. No global Auth/gateway/key/session setting changed.
- Exclusive writes are app source/tests, this report and the explicit transferred exception `site/advisor/api.js::consumeCallback`. No shared UI/routes/history/transport/root contracts/SQL/package/status/context edits. D39 no-service manual deletion clarification is documentation only here.
- Every Node/npm command uses `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` first in PATH. Portal lockfile install: 130 packages, no scripts/audit/fund or dependency changes. Browser/DOM remains reserved to W7 R4 then W2 until an explicit parent grant.

## A3: shared callback consumer

Root cause verified: fragment-only provider/code/token-hash and empty/error metadata did not consistently trigger synchronous scrubbing or explicit rejection; duplicate codes used the first value. The one retained consumer now detects all 13 existing keys on both URL sides, scrubs synchronously including duplicates/empty values, and returns a credential-free error object for unsupported/ambiguous/partial/mixed/error/oversized forms. Only validated existing semantic/legacy/preview navigation survives. Unknown leftover query data is removed and rejected. No callback contents are logged or persisted.

The export names and callback field names/kind values are unchanged. Valid query PKCE, retained query token-hash with supported email type values, and fragment implicit/access-only compatibility are preserved. Provider metadata is discarded, never persisted. New app startup still supports PKCE only and rejects retained token/implicit callbacks without transport. There is no second parser in startup.

Direct actual-function tests were written and run before production edits: **0/4 passed, 4 expected assertion failures**, including `error:false`/empty token, first duplicate code accepted, unknown leftover navigation accepted, fragment token-hash unreported. After the fix, actual shared-consumer/prepare/session/startup group is **12/12 pass**, no skips. Startup is bundled from the real module and SSR-rendered with a plain-object window and finite deny-all fetch/lock boundary, no DOM runtime. Its 104 invalid cases cover all 13 keys, empty/nonempty, four route classes; scrub precedes mount, zero auth coordination/fetches/unhandled rejections. Real retained client/advisor cookie bridges also reject before complete/restore. This is source/SSR and synthetic protocol evidence, not genuine Auth exchange.

Ignored evidence: `.local-artifacts/portal-rebuild/w0-app-fixes/callback-red.log` and `callback-green.log`. Strict frontend typecheck passes with original flags. Browser callbacks, retained session suite and final combined verification remain pending.

Early shared-consumer seam: **`db1829ab1f35de23b0102fd02bb096d9881aa3f1`**, reported immediately to the parent with unchanged exports and red/green evidence. A further actual retained `PortalSession` negative test confirms rejection before SDK initialization/exchange, with zero fetches/current credentials. Its pre-existing SDK lock-deprecation notice remains unchanged. No synthetic JWT was made or accepted as genuine Auth evidence.

## A1: one owner for preview history restoration

The actual canonical navigator plus actual cursor regression failed with native Forward `scrollY=0`, expected `600`. The cursor's duplicate `Entry.context` and traversal restoration are removed; the canonical navigator remains the single owner of history capture/restore. Only the cursor's no-history parent fallback restores fresh zero context. Product/evidence routes still live only in session memory indexed by the original opaque markers. No shared history/UI change or seam request is needed by current pure evidence.

The new pure model asserts product `250`/focus `product-focus`, evidence `600`/focus `evidence-focus`, three repeated native Back/Forward cycles, two-entry traversal, evening routine, predictive BackDestination, exact routine editor exit/opener, re-entry morning reset, refresh/session replacement and cancellation of old frames. RED **1/2 pass**, the expected Forward assertion fails. GREEN focused cursor/state group **5/5 pass**. This is plain-object history/event/viewport execution of the actual source, not DOM/browser acceptance. Browser geometry/timing/focus remains pending allocation.

## A2: post-transport application continuations

Verified the report's four internal `_accept` variants using actual session/cookie/factory/transport/root mapping and finite fetch responses, at microtask offset12. Unassigned old results fulfilled and restored capabilities; assigned old results rejected401 after restoring view/publish. The fix retires `selectionSequence`, clears selected target on invalidation, and checks creation-boundary applicability and abort after awaits before selection/reset, capability mutation and private return. Gate/context, client read/decision, directory/payment and publication continuations receive the same post-await check. Existing transport fences remain intact.

All four now reject401, keep all seven permissions false, clear old private intent in both boundary/transport memory and refuse subsequent old-port requests without network. A lawful new adapter works under the new owner/login. Post-transport draft/gate aborts reject503 without changing the permission snapshot. A reversion check against the original base records **6 failures /1 pass** for the expanded seven cases; restored source passes **7/7**, and the original ports plus new continuation group passes **21/21**. Original reverse draft/gate ordering and uncertain manual work still pass.

Ordinary `runtime.restore()` offsets1-24 do not reproduce post-invalidation permission restoration. The direct `_accept` control is an explicitly labeled internal diagnosis. One initial test wrongly required a caller's later `.then` handler to run before any subsequent invalidation; an already fulfilled promise cannot promise that. The corrected ordinary sweep asserts cleared permissions after all real restore/operation continuations settle. No ordinary browser reachability, server authorization bypass or private-data disclosure is claimed.

## Scoped verification and remaining work

- Original nine-file source/SSR/build group plus four new app test files: **95/95 pass**, zero failures/skips. This overlaps the original79 and must not be added to it.
- Affected retained session group: actual `auth-flow`, `adapter`, `client-adapter`, `client-transport`, `navigation-return`, `advisor-logout`: **44/44 pass**, zero failures/skips. Bundles use normal runtime tsconfig and its ignored `.test-build/w0-app-fixes`, with candidate/site copied from this checkout's retained source. An initial output-location mistake caused two package-resolution harness errors; rerunning in the normal runtime location resolves them without source or dependency changes.
- Strict frontend and retained-session typechecks, UI guard and isolated application build pass with original flags. No CSS change; UI guard checks11 retained stylesheets.
- Browser tests are authored but not executed before the explicit parent grant. Original app9 plus added nonzero native-context/callback cases are the pending target. No Chrome/DOM resource has been opened.

Ignored evidence under `.local-artifacts/portal-rebuild/w0-app-fixes/`: `preview-red.log`, `preview-green.log`, `continuation-red.log`, `continuation-red-expanded.log`, `continuation-green-expanded.log`, `focused-source.log`, `retained-session.log`, callback logs. Exact browser/source heads and final evidence will be recorded after the pending allocation.

Genuine Auth/Vault/Edge/database/hosted acceptance and a fresh independent review remain separate gates. No push/PR/merge/deploy, real client/source/email/funds/order or database/Auth fixture action is authorized or performed. Unrelated feature/foundation findings and author responses remain preserved under their existing owners.
