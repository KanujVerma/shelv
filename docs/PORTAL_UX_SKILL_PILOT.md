# Shelv concierge portal: Claude UX skill pilot

**Scope:** `apps/portal/` web concierge, on top of the Oct 25 concierge-decision branch. The scanner-first Expo mobile app is a separate surface. This is a source-grounded UX hypothesis and test plan, **not** a completed browser/usability study, code refactor, local Claude installation, PR merge or hosted release.

## Decision: task-first audit before visual polish

The problem to solve is **whether an unfamiliar client or advisor can predict where to go and what each action means**, with minimal redundant reading. Keep the current cream/forest-green editorial visual system unless direct evidence shows a specific deficiency. Prioritize information architecture, a novice cognitive walkthrough, UX copy and observable browser journeys. An attractive redesign without lower friction is not success.

### Shortlisted open-source methods and tools

| Candidate | What it uniquely helps | Trial decision |
| --- | --- | --- |
| [mastepanoski information-architecture-audit](https://github.com/mastepanoski/claude-skills/tree/main/skills/information-architecture-audit) | Organization, labels, navigation and findability; redundancy inventory and potential routes | **Use method in the local ShelV skill** |
| [mastepanoski cognitive-walkthrough](https://github.com/mastepanoski/claude-skills/tree/main/skills/cognitive-walkthrough) | Novice task-by-task: can users identify action, infer effect and see progress? | **Use method in the local ShelV skill** |
| [Impeccable](https://github.com/pbakaus/impeccable) | `critique`, `clarify`, `distill`, `onboard` and browser refinement; useful when layout and language are visibly noisy | **Optional second-stage pilot** after task audit; review installer/hooks first |
| [Anthropic frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | Distinctive visual treatment and design coherence | **Defer** unless the audit finds a real visual-hierarchy or design-system problem |

Rather than bulk-install overlapping prompts, the project now has one original, reviewable, provider-native `.claude/skills/shelv-ux-review/SKILL.md` whose tasks, business invariants and evidence standard are specific to this portal. This is a real Claude Code project skill, with no executable hook or dependency. The third-party packages above were **researched**, not installed or executed.

If an advisor later decides to trial Impeccable in a local, reviewed working tree, start with `npx impeccable install --providers=claude --scope=project --no-hooks`. Its default hook path can independently launch or download a binary, so avoid accepting those hooks as part of an unattended setup. Review the actual resulting diff, run `/impeccable init` with current concierge context (not historical scanner direction), then try `/impeccable clarify` and `/impeccable distill` on one selected screen. Do not overwrite existing business/truth docs with generated descriptions.

The original source skills may instead be trialed separately with `npx skills add mastepanoski/claude-skills --skill information-architecture-audit` and `npx skills add mastepanoski/claude-skills --skill cognitive-walkthrough`, after reviewing upstream files. Prefer a task-scoped comparison to importing their full library.

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
