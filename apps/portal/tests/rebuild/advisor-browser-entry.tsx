// SYNTHETIC / DO NOT FULFILL. No production transport, credentials or external operations.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AdvisorWorkspace,
  createAdvisorController,
} from "../../src/features/advisor/index.ts";
import { OverlayProvider } from "../../src/ui/index.ts";
import { parseRoute, buildRoute } from "../../src/navigation/routes.ts";
import { fixture } from "./advisor-fixture.mjs";
import { adaptLegacyPlan } from "../../../../src/contracts/PortalRebuild.ts";
import { createMayaSample } from "../../site/advisor/maya-sample.js";
import "../../src/ui/foundation.css";
import "../../src/shell/shell.css";
const f = fixture({ ready: true });
if (location.search === "?no-payment-port") delete f.options.ports.payments;
if (["?view-only", "?published"].includes(location.search)) {
  const view = f.getView(),
    source = createMayaSample().clientView.plan;
  view.draft.content = adaptLegacyPlan(
    {
      version: source.version,
      presentation: source.presentation,
      recommendations: source.recommendations,
    },
    2,
  ).content;
  const guide = {
    id: "synthetic-guide",
    productId: "cerave-pm",
    title: "SYNTHETIC retained product guide",
    intro: "authorized fixture guidance",
    steps: [{ title: null, body: "retained directions must remain readable" }],
    careNote: "retained caution",
    sources: [],
  };
  view.draft.content.products[0].guides = [guide];
  view.draft.content.products[0].evidence = [
    {
      title: "SYNTHETIC evidence",
      body: "retained uncertainty",
      ingredientGuideKey: null,
      sources: [],
    },
  ];
  view.draft.content.routineGuides = [
    {
      ...guide,
      id: "routine-guide",
      productId: null,
      title: "SYNTHETIC complete routine guide",
    },
  ];
  view.draft.content.context.facts.push({
    id: "synthetic-authorized-fact",
    kind: "client_report",
    visibility: "advisor_only",
    text: "SYNTHETIC authorized source excerpt",
    contradicts: [],
    sources: [
      {
        sourceId: "10000000-0000-4000-8000-000000000010",
        sourceVersion: 1,
        locator: { kind: "page", page: 7 },
      },
    ],
  });
  if (location.search === "?published") view.draft.state = "published";
  else
    for (const key of [
      "edit",
      "assign",
      "review",
      "approve",
      "publish",
      "confirmPayments",
    ])
      f.options.permissions[key] = false;
  f.setView(view);
}
const c = createAdvisorController(f.options);
window.__advisor = { f, c };
function App() {
  const [route, setRoute] = useState(parseRoute(location.pathname)),
    navigate = (next) => {
      history.pushState(null, "", buildRoute(next));
      setRoute(next);
    };
  return (
    <React.StrictMode>
      <OverlayProvider>
        <div className="shelv-shell">
          <aside className="shelv-sidebar">
            <span className="shelv-wordmark">shelv</span>
            <p className="advisor-muted">advisor workspace</p>
            <nav className="shelv-client-nav" data-open="true">
              <a className="shelv-nav-link" href="/advisor/clients">
                clients
              </a>
              <a className="shelv-nav-link" href="/advisor/plans">
                plans
              </a>
            </nav>
            <p className="advisor-muted">SYNTHETIC / DO NOT FULFILL</p>
          </aside>
          <div className="shelv-main">
            <header className="shelv-topbar">
              <p className="shelv-topbar-context">private advisor workspace</p>
            </header>
            <main className="shelv-content">
              <AdvisorWorkspace
                controller={c}
                navigation={{ route, navigate }}
              />
            </main>
          </div>
        </div>
      </OverlayProvider>
    </React.StrictMode>
  );
}
createRoot(document.getElementById("root")).render(<App />);
