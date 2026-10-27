# Portal UI system

Owner: Kanuj. Applies to `apps/portal/site/`, including client, advisor, and walkthrough surfaces.

The portal helps clients follow a reviewed skincare plan and helps advisors manage that work. Use the existing cream and forest-green identity. Familiar controls, accurate states, and practical information take priority over decoration.

## Reuse before adding

Search the affected markup and CSS for a suitable component first. Extend an existing component with a meaningful variant when its task or behavior differs. Do not add another button, card, field, status, or spacing system for visual variety. Keep business decisions and authoritative state in their existing models.

| Need | Default |
| --- | --- |
| Primary action | `.solid`, one per immediate task |
| Secondary action | `.quiet` |
| Contextual text action | `.text-button` |
| Consequential removal | `.destructive` with `.solid` or `.quiet`; name the object and consequence |
| Page navigation | Native link and `.nav-item`; identify the current location |
| Local view switch | Existing `.view-tabs`; use real tab semantics only with its full keyboard contract |
| Grouped content | `.advisor-panel` or the existing product/feature section; avoid nested cards |
| Form | Visible label, native input, nearby validation; use existing feature field wrapper |
| Feedback | `.ui-notice`, `.advisor-notice`, or the feature alias; `.error` for failed actions |
| Empty state | `.ui-empty` or existing feature empty state, with an available next action when useful |
| Dialog | `createPortalDialog` from `site/ui/dialog.js` |
| Account disclosure | `.account-trigger`, `.account-menu`, `.account-menu-item`; native links/buttons |
| Plan and product pages | `.client-page-title`, `.plan-actions`, `.client-product-page`, `.product-practical`, `.product-secondary` |

Payment and check-in action classes are compatibility aliases for the shared action styles. Their dedicated layout and workflow behavior stay in their feature modules. Advisor authoring can remain denser than client guidance, while actions, focus, labels, and validation remain consistent. Keep principal touch controls at least 44px high and input text at 16px; preserve reflow at 320 CSS px.

## Tokens and enforcement

`site/ui/system.css`, imported by `style.css`, owns semantic colors, text and control sizes, spacing, radii, borders, overlay elevation, focus, motion, and layout widths. Existing `--bg`, `--paper`, `--brand`, `--ink`, `--muted`, and `--line` names alias these roles. Use a role such as `--color-danger`, not a new screen-specific shade. Use spacing tokens for recurring relationships; a measured illustration dimension or a unique layout calculation does not need another token. CSS media-query thresholds remain explicit because custom properties cannot supply media conditions.

Run `npm run check:ui` from `apps/portal`. It scans every portal stylesheet and rejects new literal colors outside the canonical token root, or increases in a legacy file's recorded literal allowance. `scripts/ui-system-legacy.json` records remaining exceptions, including legacy product artwork and untouched surfaces; it is a reduction budget, not permission to introduce more styling. Do not raise a budget to silence the check. When an intentional new semantic color is required, add and review the role in `system.css`. Reducing an old allowance is encouraged after replacing its uses. This check does not prove contrast, component reuse, or copy quality; inspect the rendered result and use the checklist below.

## Dialog and disclosure behavior

```js
const modal = createPortalDialog({
  className: 'advisor-dialog',
  canClose: () => !hasUnsavedChanges() || confirm('Discard these unsaved notes?'),
  onClose: () => clearTransientDialogState(),
});
modal.open({title: 'Record start', content: escapedMarkup, trigger: openingButton, initialFocus: '#start-date'});
// modal.element is the native dialog. Unmount through modal.dispose().
```

`content` must be trusted, already-escaped application markup or an owned DOM Node. Put untrusted text through the existing escaping helpers; never pass it as HTML. The title is text, not markup. The utility reuses an existing heading, supplies one if absent, sets an accessible name, moves focus, traps keyboard boundaries, handles native Escape, locks background scrolling, and restores the opener. If rendering removed that opener, it tries its replacement ID and a surviving page heading. Existing `[data-close]`, `[data-dismiss]`, and `[data-dialog-close]` controls dismiss consistently. Replacing content in an open dialog preserves the original opener.

Use `canClose` only for actual unsaved work or unresolved operations. It receives `close`, `dismiss`, or `escape`; returning false prevents dismissal. Native `cancel` remains preventable. Owners must guard a route change or unmount before calling `dispose`, which tears down the dialog. Read-only details need no confirmation. Never bypass the utility with `element.close()` when a dismissal guard applies.

Account and navigation disclosures use a button with `aria-expanded`/`aria-controls`, normal links/buttons, Escape to close, outside dismissal, and predictable focus restoration. Do not assign `role="menu"` unless implementing its full menu keyboard behavior. Substantial product instructions belong on a navigable page; supporting ingredient explanations can use focused disclosure without losing product context. Essential cautions remain visible. Browser Back/Forward, direct entry, and return scroll/focus need interaction tests.

## Necessary copy

Use `site/ui/copy.js` for repeated navigation/action names. This is a small vocabulary, not a repository of every sentence. Keep approval, payment claimed, payment confirmed, receipt, Start, draft, publication, and active routine distinct. Never merge states because their visual treatments match.

For every changed explanatory sentence, record its purpose in the change review: task instruction, real status/feedback, decision support, safety/financial/privacy/uncertainty information, or recovery. Remove decorative or repeated copy. If a heading already conveys a fact, supporting text must add something the user needs. Improve an unclear control before adding a tooltip or paragraph about it.

Use concrete action labels. Retain visible field labels, validation, uncertain acknowledgement and retry guidance, private/client-visible distinctions, and financial qualifications at the relevant decision. Minimal necessary communication has no arbitrary character limit. Do not strip cautions, consent, consequences, or provenance simply to shorten a page.

Before accepting a changed screen:

- Identify the user's task, current state, and one next action. Does the first screen answer them?
- Check each retained sentence's purpose; remove repetitions, generic intros, and internal language.
- Reuse the default component and semantic tokens; explain any new variant.
- Verify loading, empty, denied, error/retry, and saved/published states without invented progress.
- Click through at 320, 390, and 1440px; test keyboard, focus, Escape, Back/Forward, direct entry, long text, zoom, and reduced motion where relevant.
- Keep synthetic fixtures deny-by-default for network traffic. Preserve approval/payment/receipt/Start and private/client-visible boundaries.

Primary design references and tool decisions are recorded in the UX implementation evidence. These rules preserve Shelv's identity and business semantics; third-party aesthetic preferences do not override them.
