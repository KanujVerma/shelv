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

## Remaining work

A1 canonical preview-context regression/fix and A2 post-await applicability regression/fix are in progress. Native browser validation requires the parent's explicit allocation. Genuine Auth/Vault/Edge/database/hosted acceptance and a fresh independent review remain separate gates. No push/PR/merge/deploy, real client/source/email/funds/order or database/Auth fixture action is authorized or performed.
