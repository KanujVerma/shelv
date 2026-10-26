---
name: shelv-design-polish
description: Refine visual hierarchy, density, copy clarity, component consistency and restrained motion in the ShelV concierge web portal after task-first UX review. Selectively apply Taste Skill, Impeccable, designlang and Transitions.dev approaches without redesigning the brand or importing React animation packages.
---

# ShelV design judgment and polish

This is an original, project-native **trial** skill, not a vendored or installed copy of Taste Skill, Impeccable or another third-party plugin. It works without a plugin installation. For exact external tools, use `docs/PORTAL_UX_SKILL_PILOT.md` and verify local availability before invoking their commands.

## Mission and precedence

An interface should feel composed, restrained and immediately understandable. **Never trade away clarity for distinctiveness, movement or fewer words.** Start with `shelv-ux-review` for the entry screen, real task, page structure and action semantics. Then apply this skill to the smallest high-impact visual/copy issue. A beautiful but confusing page fails.

Read `apps/portal/AGENTS.md`, `docs/CONCIERGE_FOUNDER_OPERATIONS.md`, `docs/PORTAL_ACCEPTANCE.md`, and the affected source in `apps/portal/site/` before editing. Use the existing concierge cream, forest-green and editorial system. The mobile scanner design in `docs/DESIGN.md` is context, not permission to impose its navigation or typography on the web portal. Do not replace an existing working design direction with a randomly generated style.

This portal currently uses **plain JavaScript, HTML and CSS**, not React. Prefer CSS and existing primitives to React Bits, Motion or GSAP dependencies. No broad dependency migration is justified by a single animation.

## Choose the right intervention

1. **Unclear route or action, duplicated controls, missing feedback:** run `shelv-ux-review`; inspect actual click handlers, labels, browser history, role and state. Fix interaction and words, not styling.
2. **Overlong or repeated support copy:** use an Impeccable-style **clarify/distill** pass. Identify which decision or risk each sentence supports. Remove unsupported slogans and duplicate text; keep price, privacy, consent, uncertainty, payment and medical boundaries.
3. **Weak hierarchy or generic visual repetition:** apply the *taste* discipline: state the page's main job, strongest visual focal point, typographic rhythm, role of color, density and why each panel exists. Do not substitute a new visual theme for real product evidence. Compare existing primary/secondary actions and semantic states before introducing another card, accent or badge.
4. **Need an external reference:** use **designlang** only on public, appropriate benchmark pages to understand a design system. Extract principles (type scale, spacing, grouping, interaction states), not proprietary markup or brand identity. Do not crawl protected client/advisor portals or let generated `CLAUDE.md`/`AGENTS.md` overwrite ShelV's rules.
5. **Motion genuinely improves state comprehension:** prefer a brief CSS transition from **Transitions.dev** recipes, adjusted to ShelV tokens. E.g., a dialog appearing, a status changing, or a sidebar opening; never animate merely because a library has an effect. Respect `prefers-reduced-motion`, keyboard navigation, focus order, and interactive controls that are used frequently.
6. **GSAP Skills / React Bits:** defer by default. Only evaluate if an approved new feature has an actual complex timeline or is built in React. Do not silently add a framework or animation runtime.

## Six anti-slop checks tailored to this product

- **Information hierarchy:** In two seconds, a client can tell whether a plan is current, proposed, awaiting payment, published or historical, and what they can do next.
- **Visual restraint:** One meaningful primary action per task state. Distinctive design is not created by random gradients, nested cards, excessive badges, floating widgets or animated backgrounds.
- **Consistent affordances:** Page navigation looks like navigation; a dialog trigger looks like a dialog or contextual action. Links and buttons behave as named.
- **Useful copy:** Titles say what is here. Body text either answers an immediate question or prevents a meaningful mistake. Remove repetition, not essential meaning.
- **Realistic content:** Use synthetic realistic states (no skincare products, pending routine, active routine, unverified payment, check-in reply, error); no invented clinical claims, customer evidence, purchases or fake progress.
- **Device and accessibility:** Preserve legibility at 320, 390 and 1440px and with zoom/keyboard/reduced motion. Animation cannot be required to understand progress or dismiss a dialog.

## Trial recipe (one feature at a time)

Before: document the user goal, route, screenshot/viewport, actual initial state, CTA and source files. Record the baseline in a local synthetic environment.

Pass A: run `shelv-ux-review` and fix one high-value navigational/copy issue. Pass B: run this skill for a narrow hierarchy/density polish. If reviewed Impeccable is installed, compare `/impeccable critique`, `/impeccable clarify`, `/impeccable distill`, `/impeccable harden` and `/impeccable onboard` one by one, not concurrently; its generalized aesthetic rules are subordinate to ShelV's approved design. Taste Skill may be tried separately on a copied synthetic page, with no automatic design-system replacement.

After: **click through** the change with Playwright CLI when available or the repository's existing Playwright test harness. Test first visit, return visit, realistic empty/loading/error/pending states, 320/390/1440 widths, keyboard, focus, Back/Close, reduced motion, no network outside fixtures, and unchanged payment/approval/receipt/Start semantics. Snapshot-only tests are insufficient.

## Reporting format

`Screen / persona / task | Before | After | Why the change reduces confusion or cognitive load | What still needs explaining | Synthetic browser result | Regression risks`.

When a third-party tool is not installed or a browser test did not run, say so explicitly. Do not assert measured user success, deployed behavior or evidence from real clients. Do not merge or deploy as part of a style critique.

## Sources to inspect before optional installation

- Taste Skill (current app-screen support): https://github.com/Leonxlnx/taste-skill
- designlang design extractor: https://github.com/Manavarya09/design-extract
- Impeccable: https://github.com/pbakaus/impeccable
- Microsoft Playwright CLI: https://github.com/microsoft/playwright-cli
- Transitions.dev skill: https://github.com/Jakubantalik/transitions.dev
- GSAP official skills: https://github.com/greensock/gsap-skills
- React Bits: https://github.com/DavidHDev/react-bits
