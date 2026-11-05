import type { ReactNode } from "react";
import { prepareApplication } from "./bootstrap.ts";
import { createApplicationSession } from "./session.ts";
import { PortalApplication, PublicEntry } from "./Application.tsx";
/** This is the only browser application startup. Public recovery never creates
 * a cookie session. The retained gallery has its separate sentinel and export. */
export function startPortalApplication(
  element: HTMLElement,
  win: Window,
  mount: (element: HTMLElement, content: ReactNode) => () => void,
) {
  const prepared = prepareApplication(win.location, win.history);
  if (!prepared.audience)
    return mount(element, <PublicEntry route={prepared.route} />);
  const runtime = createApplicationSession({ audience: prepared.audience });
  const startup = (async () => {
    if (prepared.callback.error) throw { status: 401 };
    if (prepared.callback.kind === "pkce" && prepared.callback.code) {
      const code = prepared.callback.code;
      prepared.callback.code = null;
      return runtime.complete(code);
    }
    return runtime.restore();
  })();
  // Attach immediately: React passive effects may run after this rejection.
  // The original promise still supplies the safe sign-in recovery state.
  void startup.catch(() => {});
  const unmount = mount(
    element,
    <PortalApplication runtime={runtime} startup={startup} win={win} />,
  );
  const restore = () => {
    if (win.document.visibilityState === "visible")
      void runtime.restore().catch(() => {});
  };
  win.addEventListener("focus", restore);
  win.document.addEventListener("visibilitychange", restore);
  return () => {
    win.removeEventListener("focus", restore);
    win.document.removeEventListener("visibilitychange", restore);
    unmount();
    runtime.dispose();
  };
}
