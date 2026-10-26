---
name: shelv-ux-review
description: Evaluate and improve ShelV concierge portal navigation, information architecture, user journeys, interface copy, empty states, plan decisions, check-ins and previews. Use before changing client or advisor screens, even when they already look visually polished.
---

# ShelV task-first UX review

**Aim:** Minimize user uncertainty, not merely the number of words or the amount of UI. The portal should be self-explanatory without losing essential context, privacy, accurate product advice or financial meaning. Fix structure and task flow before colors, layout or animation.

## Load product truth before making suggestions

1. Read `apps/portal/AGENTS.md`, `docs/CONCIERGE_FOUNDER_OPERATIONS.md`, `docs/PORTAL_ACCEPTANCE.md` and the relevant source in `apps/portal/site/`. Consult `docs/DESIGN.md` for shared brand constraints, but its mobile scanner/legacy references do not dictate concierge-web navigation.
2. Inspect the actual route, state, content, event handler and existing tests. Distinguish deployed behavior, locally implemented but unshipped features, and merely requested features. The four private walkthroughs and guided Maya improvements described in founder operations must not be called implemented until verified.
3. Identify the user role and knowledge: first-time client, returning client, advisor, or a synthetic demo visitor. Do not mix private, live, public sample and unpublished views.

## Before a UI change, trace the real task

For each affected flow, write this compact map:

| Step | User's immediate goal | Page/dialog seen | Label/action available | Destination or state change | Feedback and recovery |
| --- | --- | --- | --- | --- | --- |

For every screen, test four questions:

- **Where am I?** Can I identify the page, account/plan and current state?
- **What does this mean?** Do the names and status words match the user's mental model, including what is optional, awaiting verification, published, active and historical?
- **What should I do next?** Is a relevant primary action discoverable without reading an explanatory essay, and are meaningful secondary choices preserved?
- **How do I get out or recover?** Do Back, Close, browser history, cancellation, validation, retries and successful confirmation behave as expected?

Apply a novice cognitive walkthrough to each action: Will a new user intend the right effect? Notice the correct control? Associate its label with the effect? Recognize progress after clicking? Mark unknowns as hypotheses, not measured user reactions.

## Audit information architecture and copy

- **Organization:** Group by actual user task, not implementation component. Audit page inventory and nav levels; challenge repeated entry points, detours and misplaced dialogs.
- **Labels:** A menu name must predict what opens. Use the same term for the same object and action across the client and advisor portals; preserve distinctions where the effects truly differ.
- **Navigation:** Inspect initial destination, deep links, back/forward, dialogs, state retention, scroll/focus after returning, switching clients and small-screen navigation. Do not silently change the initial landing tab or add new top-level pages.
- **Search and filters:** Inspect only where present, including empty/no-match states and the path back to all records.
- **Copy:** For each sentence ask, “What user decision, expectation, warning or recovery does this enable?” Remove repeated self-congratulatory, decorative or tutorial text. Prefer concrete verbs (“Review plan”, “Record start”), status-first messages and short support copy at the point of need. Replace jargon with consumer language. Do not optimize for the smallest possible character count.
- **Content hierarchy:** Show primary task, current status and next action before optional explanation, comparisons, sources and ingredient depth. Use progressive disclosure for supporting details, not for essential warnings or facts.

## Preserve these essential meanings

- ShelV concierge uses founder-led consultations and human-reviewed plans. Do not invent a self-service skin questionnaire, scanner requirement, AI diagnosis, clinical credentials or a new commercial offer.
- The ongoing service, separate product costs, refund/cancellation terms, privacy and health boundaries must not be shortened into misleading claims. Use the latest founder operations record to flag wording requiring product approval.
- Client **approval** is a product choice for a quote, not payment, fulfillment, product receipt or automatic routine activation. “I received it” is not “I started it.” The client must explicitly record Start before replacing the active routine.
- Do not combine client-visible check-in replies with private advisor notes. Keep owner/session isolation, private media, auth, permissions, irreversible actions and publication rules intact.
- Alex and Maya are fictional samples. Other advisor-managed named walkthroughs remain private by default, with scoped sharing only when actually implemented and authorized. Distinguish sample UX from actual client data.

## Review procedure

1. **Inventory evidence:** Record exact file path, UI text, source lines or browser steps. Capture screenshots only from authorized local/synthetic sessions. Never use real client material as a fixture.
2. **Rank friction:** P0 blocks a major task or violates trust/safety; P1 makes next steps or outcomes misleading; P2 adds detours/repetition; P3 is minor visual polish. Prioritize P0/P1.
3. **Propose a minimal correction:** For each issue, show the smallest before/after label, layout or interaction change, user rationale, what could break and test plan. Prefer editing an existing affordance over adding a new help paragraph, banner, card or step.
4. **Challenge the proposed simplification:** Could fewer words conceal a significant payment action, price qualification, side effect, uncertainty, permission or retention limitation? If so, keep necessary content near the action.
5. **Implement only bounded, reversible, appropriately owned changes.** Do not merge, publish, deploy, send messages, access private hosted clients, purchase products or change real permissions as part of a UX critique.
6. **Verify the real behavior:** Use the repo's synthetic, intercepted browser fixture tests to actually click through key tasks, not only inspect a screenshot or run a unit test. At minimum compare widths 320, 390 and 1440px, keyboard Tab/Enter/Escape, screen-reader names/focus, Back/Close, direct entry, status/retry/empty cases and reduced-motion behavior when relevant. Run the affected `apps/portal` test/build/typecheck commands, check the diff and record the exact results.
7. If browser execution is unavailable, **stop at an explicit source-based hypothesis and reproducible test plan**. Never report a simulated walkthrough as a usability test or invent measurements, screenshots, pass rates or user quotes.

## Priority pilot journeys

1. **New client:** Arrive at Your plan; distinguish proposed changes, current routine and optional alternatives; inspect a comparison and ingredient explanation; choose a product for a quote; identify what happens after choosing and paying. Never treat approval as payment or activation.
2. **Returning client:** Find active morning/evening routine; open and complete a check-in; locate the advisor's written reply while private notes stay private; return to the routine with predictable navigation.
3. **Advisor:** From Clients, locate the correct client; review consultation context, plan draft and preview; identify what is saved versus published; reach a confirmation step without losing a draft; return to directory.
4. **Preview visitor:** Alex and Maya use consistent controls but different fictional content. When guided Maya and private walkthrough sharing actually exist, verify a clear guided path and unforced free exploration, with samples visibly separate from live customer workflows.

## Required output

Provide a concise table: **priority | persona and user goal | exact observed issue (file or browser reproduction) | why confusing | smallest proposed fix | regression to test | evidence level**. Include a before/after copy diff only for affected copy. End with an exact list of tests executed, results and anything **not tested**. Do not estimate task-completion percentages without observed user data.

## Method references

This original, Shelv-specific skill synthesizes the task-specific cognitive-walkthrough and information-architecture methods described at:
- https://github.com/mastepanoski/claude-skills/tree/main/skills/cognitive-walkthrough
- https://github.com/mastepanoski/claude-skills/tree/main/skills/information-architecture-audit

For later visual refinement (only after task and copy issues), consider https://github.com/pbakaus/impeccable using its critique, clarify and distill tools with reviewed project-scoped installation and no automatic hooks by default. The references are not installed dependencies.
