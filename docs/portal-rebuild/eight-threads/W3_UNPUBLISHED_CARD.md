# Shared unpublished decision card

Owner: Kanuj. Source feature slice for W2 A02, 3 November 2026. Base `8a2be1cab5980f5aa92698268568ed5345bd84e8`; the feature SHA is the commit containing this report. This is separate from the frozen860/PR233 typography/assertion slice.

## Pinned input and ownership

W2 requested the compact native A02 decision/product/reason preview instead of a placeholder or full-page renderer. The exact four-prop API was sent before implementation:

```ts
interface UnpublishedDecisionCardProps {
  preview: PlanPreview;
  source: PlanPreviewSource;
  decisionId: ContentId | null;
  session: PlanSessionBoundary;
}
```

W3 owns `plan/UnpublishedDecisionCard.tsx`, its shared pure identity/choice presentation, public `plan/index.ts` export, domain styles and new W3 tests. W0 explicitly allocated this report. W2 owns advisor-local read state/composition; W0 owns the actual fixed draft preview port. No advisor, shared UI/router/gateway, backend, contract, migration or existing test is edited.

## Behavior

The card uses the existing strict `readUnpublishedPreview(preview,source)` and actual session invalidation boundary. It never creates a published view, entitlement, use state, clocks or empty fake record. It requires no navigation/overlay provider. Runtime extra operation/navigation/business callbacks are not forwarded.

A null ID with decisions asks to select a decision; a null ID in an empty draft says no decision in this draft. An unknown ID stays unavailable rather than selecting the first. Product-free decisions stay product-free. Incomplete names/imagery preserve the actual client identity fallback. Assigned targets retain exact draft/content/assignment binding. Invalid/private-extra/unsupported input returns a safe unavailable state. Session invalidation, including during validation, removes the content.

The native A02 `500:383`/aside `500:485` context and screenshot were acquired through the existing Figma session. The card composes actual shared product identity, `DecisionReasons`, shared Badge/Panel/Button, and one disabled approval choice with no handler. It shows `client preview · unpublished` and `preview only. no client actions run here.` Data is canonical preview content, not per-client markup or a demo design system. No static Figma asset is introduced.

`ProductIdentity`'s existing function body moves unchanged from ClientPlan to a pure shared module, aside from export visibility. Its now-unused type import is removed. `DecisionChoiceButton` centralizes the existing labels and variants. Legacy and V3 controls retain all three choices, exact handler expressions, busy/disabled bindings, and every gate/hook/scope/controller line. The complete bytes outside the three presentation elements and added import match their original files. The new card uses only the disabled approval button; no handler is supplied. Full unpublished-page preview behavior remains unchanged.

## Observed source proof

All commands use `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`; no browser, server, Auth, SQL, Storage or external operation was started. Own raw records are under `.local-artifacts/w3/unpublished-card/`.

- `new-api-absent.log`: initial14 hook failures because the new module did not exist. This is new-API setup evidence, not a historical product defect or behavior reproduction.
- `current-card.log`:15/15 source/SSR cases, zero fail/cancel/skip. Actual original React elements/native callbacks are observed and returned unchanged. Cases cover canonical selected identity/reason, runtime-extra callback isolation, null/empty/missing/nonproduct states, incomplete identity/unknown image, strict source/target rejection, invalidation, and exact choice handler/state forwarding.
- `presentation-correspondence.json`: exact old identity body correspondence and byte-preserved control files outside presentation; all three handler expressions and disabled bindings remain unchanged.
- `types.log`: initial TS2688 physical type-resolution failure from a config under the ignored artifact directory, retained as setup failure. No declarations, shims or relaxed flags were used.
- `types-current.log`:0 diagnostics using new `tests/w3/tsconfig.unpublished.json`, which extends the actual frontend project unchanged and adds only the ABI probe file. Negative probes reject ports, callbacks, navigation, published view/mode and private DraftView input.
- `compatibility-base8a.log`:239/239 card/Maya/current-V3-SSR/preview-navigation/use/model tests, zero fail/cancel/skip. No browser test file is included.
- `ui-guard.log`:passes11 stylesheets. `git diff --check`:pass.

The card relies on real shared controls and reader behavior; no live-operation port or application hook is supplied to make a preview succeed. No Guidance controller/private-return or principal audit is performed. No held Source or provider scope is cleared.

## Open gates

A complete fresh independent source review is required before W2 adopts the export. Actual W0 preview read, advisor composition, fresh browser/asset/focus/390/320/desktop comparison and genuine permission/persistence acceptance remain open. The Root PUBLIC Maya packet, existing860 scope, principal44 no-alternate boundary and all other held gates remain independent. This compact card does not complete A02 or the full W3 goal.

## Published-spine reconciliation

The feature commit `89f61a22702d96f3612b1ae089b4dcaba9fb0b25` normally merges published integration `df230eca6017f8dd330cceb83eb11b18193937e5` as `c5337a3e3f9f6d43854d4254db2415756d97517d`. All thirteen feature postimages stayed exact; the relative binary delta remained `f2f9fcdccc443b24c3e5b14a9eec431f27943bd21210051589a32c56642a7795`. No force, rebase or prepared foreign ancestry import occurred.

On that reconciled production graph, selected card/Maya/V3-SSR/navigation/use/Root public-chrome/Self compatibility passes284/284 with zero fail/cancel/skip (`compatibility-rootdf.log`); the unchanged-flag ABI/frontend graph exits0 (`types-rootdf.log`) and UI guard passes11 (`ui-guard-rootdf.log`). These are source/model/SSR/closed-HTTP/build cases, not a browser or genuine acceptance run. The final fixture additionally supplies a runtime `onClick` extra and a negative type probe for it; that strengthening changes no production behavior. Original API-absent and type-location failures remain retained.

PR233's completed watch was retired after actual merge confirmation. Root's reviewed/published PUBLIC chrome and guide assertions keep their separate fresh-packet requirement; no card test calls those browser exports, obtains a Page or supplies an auth fixture. The new card still requires its own frozen review/admission before W2 imports it.
