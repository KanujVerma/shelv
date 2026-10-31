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
import "../../src/ui/foundation.css";
import "../../src/shell/shell.css";
const f = fixture({ ready: true });
if (location.search === "?no-payment-port") delete f.options.ports.payments;
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
