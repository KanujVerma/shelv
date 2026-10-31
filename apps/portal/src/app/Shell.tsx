import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { PortalShell } from "../shell/PortalShell.tsx";
import { RouteLink, usePortalNavigation } from "../navigation/react.tsx";
import { Badge, Button, Dialog, Icon } from "../ui/index.ts";
export function ApplicationShell({
  audience,
  children,
  onSignOut,
  readOnly = false,
  preview = false,
}: {
  audience: "client" | "advisor";
  children: ReactNode;
  onSignOut(): void;
  readOnly?: boolean;
  preview?: boolean;
}) {
  const [contact, setContact] = useState(false),
    [menu, setMenu] = useState(false);
  const { route } = usePortalNavigation();
  const menuToggle = useRef<HTMLButtonElement>(null),
    menuNavigation = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!menu) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        menuToggle.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !menuNavigation.current?.contains(event.target) &&
        !menuToggle.current?.contains(event.target)
      )
        setMenu(false);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
    };
  }, [menu]);
  const status = (
    <div className="app-session-actions">
      {preview ? <Badge>advisor preview</Badge> : null}
      <Button variant="ghost" onClick={onSignOut}>
        sign out
      </Button>
    </div>
  );
  const contactDialog = (
    <Dialog open={contact} onOpenChange={setContact} title="contact shelv">
      <p>
        contact details are not connected in this candidate. use your existing
        service contact.
      </p>
    </Dialog>
  );
  if (audience === "client")
    return (
      <>
        <PortalShell
          identity="your account"
          mode="client"
          contact={{
            onContact: () => setContact(true),
            availability: readOnly ? "administration" : "service",
          }}
          status={status}
        >
          {children}
        </PortalShell>
        {contactDialog}
      </>
    );
  const active =
    route?.name === "advisor-clients" || route?.name === "advisor-client"
      ? "advisor-clients"
      : route?.name === "advisor-permissions"
        ? "advisor-permissions"
        : "advisor-plans";
  return (
    <div
      className="shelv-shell"
      data-mode={preview ? "advisor-preview" : "advisor"}
    >
      <a className="shelv-skip-link" href="#portal-content">
        skip to content
      </a>
      <aside className="shelv-sidebar">
        <div className="shelv-sidebar-top">
          <span className="shelv-wordmark">shelv</span>
          <div className="shelv-mobile-controls">
            <Button
              variant="ghost"
              ref={menuToggle}
              aria-expanded={menu}
              aria-controls="advisor-navigation"
              onClick={() => setMenu(!menu)}
            >
              <Icon name="menu" />
              menu
            </Button>
          </div>
        </div>
        <nav
          ref={menuNavigation}
          id="advisor-navigation"
          className="shelv-client-nav"
          data-open={menu}
          aria-label="advisor navigation"
        >
          {(
            [
              { name: "advisor-clients", label: "clients", icon: "account" },
              { name: "advisor-plans", label: "plans", icon: "plan" },
              {
                name: "advisor-permissions",
                label: "permissions",
                icon: "account",
              },
            ] as const
          ).map((item) => (
            <RouteLink
              key={item.name}
              route={{ name: item.name }}
              className="shelv-nav-link"
              aria-current={active === item.name ? "page" : undefined}
              onClick={() => setMenu(false)}
            >
              <Icon name={item.icon} />
              {item.label}
            </RouteLink>
          ))}
        </nav>
        <div className="shelv-identity">
          <Icon name="account" />
          advisor workspace
        </div>
      </aside>
      <div className="shelv-main">
        <header className="shelv-topbar">
          <div className="shelv-topbar-context">
            {preview ? "unpublished plan" : "advisor workspace"}
          </div>
          {status}
        </header>
        <main id="portal-content" className="shelv-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
