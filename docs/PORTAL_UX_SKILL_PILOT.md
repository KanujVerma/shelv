# Shelv concierge portal: Claude UX skill pilot

**Scope:** `apps/portal/` web concierge, on top of the Oct 25 concierge-decision branch. The scanner-first Expo mobile app is a separate surface. This is a source-grounded UX hypothesis and test plan, **not** a completed browser/usability study, code refactor, local Claude installation, PR merge or hosted release.

## Decision: task-first audit before visual polish

The problem to solve is **whether an unfamiliar client or advisor can predict where to go and what each action means**, with minimal redundant reading. Keep the current cream/forest-green editorial visual system unless direct evidence shows a specific deficiency. Prioritize information architecture, a novice cognitive walkthrough, UX copy and observable browser journeys. An attractive redesign without lower friction is not success.

### The seven tools from the TikTok, verified against their original projects

The video labels are shorthand. These are distinct categories: agent design judgment, design-system extraction, React component source, animation APIs/skills, browser interaction testing and motion recipes. **Do not install everything at once**: the portal is currently plain JavaScript, HTML and CSS; its current problem is wayfinding, next actions and copy. The [original project-native UX skill](../.claude/skills/shelv-ux-review/SKILL.md) stays first, and the [new, original design-polish skill](../.claude/skills/shelv-design-polish/SKILL.md) works after it. Neither is a vendored third-party skill.

| Video term → verified source | Actual capabilities | Fit for concierge portal | Pilot decision |
| --- | --- | --- | --- |
| **Taste Skill**: [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | Anti-generic design judgment, layout/type/art direction and browser review. **Current v2.1 supports dashboards/app screens** (older descriptions saying “landing pages only” are outdated). | Useful for restrained hierarchy, but full art-direction run can overwrite established brand choices if unconstrained. | **Optional A/B visual trial** on one synthetic screen, with no automatic brand replacement. |
| **designlang**: [Manavarya09/design-extract](https://github.com/Manavarya09/design-extract) | Extracts computed visual design system from a live public URL, outputting tokens/CSS/anatomy/motion, MCP and optional agent instructions. It does **not** simply copy an entire functioning website template. | Good for studying one reference's spacing, hierarchy and interaction patterns; weak for whether Shelv users can finish tasks. | **Reference-only, optional**. Never crawl private client data or permit generated instructions to overwrite repo rules. |
| **React Bits**: [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits) | Library of editable animated/interactive **React** components and backgrounds, with several source formats; current license is **MIT + Commons Clause**, not unqualified MIT. | Current concierge portal is vanilla JS/HTML/CSS. Adopting it directly adds React/runtime/porting cost and potential noise. | **Skip for current portal**. Consider later for an already-React surface where a concrete component is needed. |
| **GSAP Skills**: [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | Official agent instructions for GSAP core, timeline, ScrollTrigger, performance and frameworks, including vanilla JS. Skills do not install an animation into the app by themselves. | Technically compatible but overkill for plain portal navigation, simple dialog/CTA interactions and static plans. | **Defer** until a genuine complex timeline or state-sequenced interaction exists. |
| **Playwright CLI**: [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli) | Agent-readable browser commands to visit, click, type, inspect, screenshot, navigate Back/Forward and observe page state. | **Directly addresses the failure mode**: a code-only review can miss misleading entry screens and dead ends. The portal already has synthetic Playwright tests; CLI is an exploratory complement, not a replacement. | **First external tool trial**, isolated local synthetic browser session only. |
| **Impeccable**: [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | `critique`, `clarify`, `distill`, `onboard`, `harden`, `audit` and deterministic anti-slop design checks. Supports plain HTML/CSS; optional automatic edit hooks launch/download its binary. | **Best direct visual/copy supplement** to the task-first walkthrough. Some generalized anti-patterns (e.g., fonts) may conflict with intentional Shelv tokens. | **First external design trial**, project-scoped, **hooks off**; evaluate and apply findings selectively. |
| **Transition Skill**: [Jakubantalik/transitions.dev](https://github.com/Jakubantalik/transitions.dev) | Free, namespaced CSS recipes for modal, tab, dropdown, status and state transitions; reduced-motion fallbacks. Source has special reuse terms, see its license before copying whole library. | Good for a later **specific** state change; unnecessary as a blanket page-animation system. | **Optional small CSS trial** after navigation is correct, e.g. one modal or status transition. |

These are the identifiable source repos, **not evidence that the creator used their current versions**. "Transition skill" maps to the public Transitions.dev project, the closest matching maintained, named skill and motion/component library. The video did not include an author URL, so this particular mapping is a plausible identification rather than confirmed attribution.

#### Complementary UX-method skills, already synthesized here

- [Information Architecture Audit](https://github.com/mastepanoski/claude-skills/tree/main/skills/information-architecture-audit): label consistency, organization, navigation and findability.
- [Cognitive Walkthrough](https://github.com/mastepanoski/claude-skills/tree/main/skills/cognitive-walkthrough): step-by-step test of what a new user expects and discovers.
- [Anthropic frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design): an additional visual design alternative, not a video-mentioned tool and **not currently necessary**.

### Safe experiment order and commands

**Phase 0: baseline (existing repo tooling).** Use one of the active portal branches, not the historical mobile-only `main` tree. Run the existing `apps/portal` test suite and synthetic browser harness to capture *current* user journeys at 320, 390 and 1440px. Record before screenshots and click paths. This documentation PR itself does not execute those commands.

**Phase 1: task comprehension (project skills).** Use `shelv-ux-review` to map routes and identify the first misleading action; use `shelv-design-polish` to improve clarity, hierarchy and copy with no new framework or dependency. The skills are checked-in Claude Code project skills; no external install is required to read them.

**Phase 2: use the real browser.** If the connected local coding agent lacks the standalone CLI, Microsoft documents:

```sh
npm install -g @playwright/cli@latest
playwright-cli --help
playwright-cli install --skills
```

This installs locally on the executing computer; the browser must remain in **synthetic, offline/intercepted fixture mode**. `playwright-cli` CLI exploration can validate that a user recognizes the correct affordance, but add reproducible existing-repo Playwright tests for each accepted change. Do not open personal or actual client sessions to demonstrate the tool.

**Phase 3: trial Impeccable on one screen.** In a disposable copy/worktree, after reviewing the installer, invoke:

```sh
npx impeccable install --providers=claude --scope=project --no-hooks
```

Reload Claude Code, check installed files and any rule collisions, and initialize only after inspecting the diffs. Pilot `/impeccable critique`, `/impeccable clarify`, `/impeccable distill` and `/impeccable harden` on the same synthetic client plan view. Do **not** enable `/impeccable hooks on` until the team explicitly reviews the executable hook, its downloads, trust and optional telemetry. Never blindly accept broad changes to current type, color or business language.

**Phase 4: optional controlled comparison.** Only after Phases 1–3, trial Taste Skill **separately**, on a synthetic copy of one already-implemented view:

```sh
npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend
```

Taste's current version requires Node 22+ and a browser for its own visual checks. Preserve forest-green/cream/editorial identity and client/advisor task structure. Compare before/after findability, visual hierarchy, text density and whether users can predict action outcomes. Treat source licenses, dependencies, external image retrieval, generated rules and unexpected file writes as things to review before committing.

**Phase 5: references and motion only if needed.** For *public* design analysis, `npx designlang https://linear.app` is a representative command, not an instruction to copy Linear or overwrite Shelv's `AGENTS.md`. If a confirmed motion problem remains, use `npx skills add Jakubantalik/transitions.dev` only in the local trial, inspect the generated changes and apply one restrained CSS recipe with reduced-motion behavior. React Bits and GSAP do not enter the portal's dependency tree in this trial.

**Guardrail:** A skill recommendation is not an executable dependency. Only `shelv-ux-review` and `shelv-design-polish` are committed here. External third-party plugin, executable, hook, npm install, CLI browser run or design extractor has **not** been installed or used. No actual user-completion percentages or hosted acceptance can be inferred from a source-based critique.

## Source-based findings to test, not reported bugs

| Priority hypothesis | Current evidence | Why an inexperienced user might struggle | Smallest candidate experiment |
| --- | --- | --- | --- |
| P1: A navigation item opens a dialog rather than a location | `site/client/view.js`: sidebar `Your plan`, `Check-ins`, `Payments`, `Plan overview`; `#client-profile` opens `presentationConsultationMarkup` dialog | A peer of three page destinations suggests it is a fourth page. Users may expect normal Back and stable location. | Test moving it to contextual plan actions, or a distinct modal-signaling label, with an obvious Close; keep the consultation/profile content and permission controls |
| P1: Product action terminology may obscure the sequence | `site/client/view.js`: `Approve product` for regular recommendations, `Add to cart` for optional alternatives, then explicit Received and Start actions | Approval may be mistaken for purchase or an active-routine edit, while “cart” may imply immediate checkout | Run a first-click/comprehension test on proposed vs optional products. Reword only if clarity improves without erasing the meaningful distinction |
| P2: Fictional samples and active work compete for attention | `site/advisor/workspace.js`: Clients directory, filters/metrics and two visible Alex/Maya sample links | An advisor performing real client work might assume a sample is another client or the next action | Test clearer grouping/caption or a secondary “Examples” destination, without publishing private walkthroughs |
| P2: Directory copy and state information might duplicate itself | `site/advisor/workspace.js`: subtitle “A clear view of each plan and the next conversation”; card text “Draft ready to review” alongside “Draft” status | Generic introductory text adds reading without helping the next decision; duplicate labels consume focus | Try removing just the generic subtitle or consolidating duplicate status wording; verify no loss of actionable detail |
| P1: Initial advisor screen may be the wrong destination for some tasks | `site/advisor/workspace.js`: `openClient` sets `activeTab='overview'` and loads consultation | A returning advisor working on a saved draft may have to detour from consultation every time | Test with a draft-returning advisor. Do not auto-select the draft until unsaved-state, deep-link and permissions implications are checked |

The first four examples have been identified by reading source. No claim is made that the UI is broken or that actual users were confused. The guided Maya scenario and four private advisor-controlled examples are described in `docs/CONCIERGE_FOUNDER_OPERATIONS.md` as requested work, not verified shipped behavior. Preserve the public fictional Alex/Maya scenarios without leaking actual friends' data.

## Pilot acceptance matrix

### Client, first visit

- On opening **Your plan**, can the client distinguish proposed recommendations from the currently active routine without prior explanation?
- Can they find comparisons and ingredient context if interested, without being forced into detail reading?
- Can they choose a product for a quote and correctly predict whether money moves or the routine changes? Both must remain false until their distinct subsequent actions.
- After manually verifying purchase and marking received, is **Record start** discoverable and clearly different from receipt?
- Can they return from the plan-details dialog to the same location and preserved selections?

### Client, returning

- Find current morning and evening steps and see whether recommendations are pending, accepted, historical or active.
- Find **Check-ins**, complete a synthetic check-in, navigate away and back, and locate advisor reply. No private advisor note should appear in the client view.
- Test empty/no-plan, failed loading, payment pending, and retry behavior separately. Do not substitute fixture output for proof of hosted payments.

### Advisor and demo

- From Clients find a real synthetic account versus an Alex/Maya **fictional** sample; navigate to consultation, draft, preview and back.
- Verify saved vs unpublished vs published states, unsaved changes warning and the first plan versus a later revision.
- When guided Maya and four private walkthrough flows are truly built, test default guided navigation, easy exit/free exploration and explicit non-public sharing. Do not assume deployment from a documentation-only PR.

## Testing and evidence policy

Use a checked-out branch of `apps/portal` with Node >=22.23.0. Build or run the **local synthetic**, network-intercepted browser harness only; never sign into live customer accounts as part of this pilot. Baseline and changed screens should be clicked through at 320px, 390px and 1440px widths. Check keyboard/focus, Escape/Close, browser Back/Forward, tab retention, obvious state feedback, meaningful link labels, no dead ends, no horizontal overflow and no unexpected external requests. Read `apps/portal/README.md` and `apps/portal/AGENTS.md` before the local run. From the portal folder, the existing relevant commands are `npm ci`, `npm test`, `npm run test:session`, `npm run typecheck:session`, `npm run verify:session-package` and `npm run build`. Add task-specific Playwright interactions when a new flow lacks coverage.

**Target for a successful pilot:** For each priority task, record an observable path from entry to completion, clear labels, truthful feedback and recovery; for proposed fixes, capture before/after interaction evidence with no regressions in payment, privacy or published-plan semantics. Human task-completion tests are a separate future validation step; no completion percentages are claimed here.

## Invocation example for Claude

> Use the project skill **shelv-ux-review** to inspect the current `apps/portal` branch. First perform a source-grounded information-architecture audit and novice cognitive walkthrough of Clients → Consultation → Plan draft → Preview and client Your plan → Recommendations → quote choice → Daily routine. Also review Check-ins and the sample-plan entry points. Rank confusing routes and redundant copy, with exact file evidence. Implement only the highest-value reversible navigation/copy fix after showing why it reduces confusion. Run synthetic browser clickthrough at 320, 390 and 1440px and relevant portal test/build commands, then report exactly what passed and what was not run. Keep the existing cream/forest-green editorial design and all commercial, clinical, payment, privacy and publication boundaries. Do not deploy, merge or touch real clients.

## Current evidence boundary (Oct 26, 2026)

A project skill file and instructions are prepared in GitHub on a **separate draft branch stacked on PR #207**. No local checkout, actual Claude run, browser observation, new user study, root/portal CI run, hosted change, release or merge was performed as part of preparing this documentation. Validate these steps before treating the skill as proven.
