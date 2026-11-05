# Coordinator: Review/Guidance RPC test loading in CI

CI head c328fd8b7cf2b27de669e64848c0bc105d504b83 failed job124694088486 in run41254301210. Portal package tests reported1578 pass/1 fail/0 skips. The sole failing file was [the RPC chain test](../../../apps/portal/tests/rebuild-review-guidance-request-rpc.test.mjs); Node22.23.0 rejected the retained SupabaseProvider constructor parameter properties before any RPC assertion ran. Extensionless runtime imports also require compilation rather than Node strip-only loading.

The exact CI command, `node --test tests/rebuild-review-guidance-request-rpc.test.mjs` from apps/portal, independently reproduced exit1. An initial local log redirect used one excess parent segment and failed before the command; it is a setup fault, not this reproduction.

The test now compiles its actual provider, policy, handlers and authenticated runtimes in memory using the installed locked esbuild and unchanged runtime tsconfig. It executes that real CommonJS output with Node's module resolver. No provider, handler, mapper, authentication rule, runtime budget, compiler setting, dependency or workflow is changed. No business success port is substituted. The complete original case, both-family loop and every assertion from `const owner` onward remain byte-exact.

Verification with explicit Node22.23.0:

- Exact failing command:0/1 RED before the change,1/1 GREEN afterward.
- RPC chain plus unchanged client/advisor request suites:46/46,0 fail/skip.
- `npm --prefix apps/portal run typecheck:rebuild`: exit0.
- `npm --prefix apps/portal run typecheck:session`: exit0.
- Original assertion-body equality and `git diff --check`: pass.

Raw CI and local logs are retained in the coordinator's ignored `.local-artifacts/portal-rebuild/ci-c328/`. This proves the focused loading correction, not the full CI job. The full package/browser/native steps will be rerun by exact-head CI. No browser, shared fixture, Auth, database or native resource was acquired for this investigation; the independent reviewer retained sole Chrome ownership until its separately reported return.
