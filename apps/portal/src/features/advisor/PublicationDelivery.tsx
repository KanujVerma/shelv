import { useEffect, useState, useSyncExternalStore } from "react";
import { Button, StatusNotice } from "../../ui/index.ts";
import { NotificationsView } from "../notifications/index.ts";
import type { NotificationController } from "../notifications/index.ts";
import { publicationReference } from "../notifications/recovery.ts";
import type { AdvisorPublicationNotification } from "./types.ts";

/** W0 owns the actual runtime/controller and its single memory-owner lifecycle. */
export function PublicationDelivery({ controller, publication }: {
  controller?: NotificationController;
  publication: AdvisorPublicationNotification | null;
}) {
  if (!controller || !publication) return (
    <StatusNotice title="notification event recorded">
      current delivery status is unavailable. this does not change the publication.
    </StatusNotice>
  );
  return <BoundPublicationDelivery key={publication.command.requestId}
    controller={controller} publication={publication} />;
}
function BoundPublicationDelivery({ controller, publication }: {
  controller: NotificationController;
  publication: AdvisorPublicationNotification;
}) {
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [failed, setFailed] = useState(false);
  let reference;
  try { reference = publicationReference(publication.command, publication.receipt); }
  catch { reference = null; }
  useEffect(() => {
    let active = true;
    setFailed(false);
    const before = controller.getSnapshot();
    const previous = before.deliveries?.event ?? before.selectedEvent;
    if (!reference || (before.pending && previous?.eventId !== reference.eventId)) return;
    void controller.openPublication(publication.command, publication.receipt)
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [controller, publication]);
  const currentEvent = state.deliveries?.event ?? state.selectedEvent;
  const matched = !!reference && currentEvent?.eventId === reference.eventId &&
    currentEvent.source.kind === "publication" &&
    currentEvent.source.publicationVersion === publication.receipt.publicationVersion;
  // A shared controller can still hold its previous event before the effect.
  // Never display that event under this publication, including on the first render.
  if (!matched && state.phase === "ready" && state.pending) return (
    <StatusNotice tone="uncertain" title="an earlier notification action still needs confirmation"
      action={<div className="advisor-actions">
        <Button variant="secondary" disabled={!state.pendingRecovery.available || state.checkingStatus}
          onClick={() => void controller.checkStatus()}>check original status</Button>
        <Button variant="secondary" disabled={!state.pendingRecovery.available || state.checkingStatus}
          onClick={() => void controller.retryExact()}>retry exact action</Button>
      </div>}>
      the original action is preserved. load this publication's delivery status after resolving it.
    </StatusNotice>
  );
  if (!reference || failed || (!matched && ["idle", "ready", "loading"].includes(state.phase))) return (
    <StatusNotice tone={state.loadingDeliveries ? "loading" : "neutral"}
      title={state.loadingDeliveries ? "loading current delivery status" : "current delivery status is unavailable"}
      action={reference ? <Button variant="secondary" busy={state.loadingDeliveries}
        onClick={() => void controller.openPublication(publication.command, publication.receipt)}>load delivery status</Button> : undefined}>
      the publication and service dates are unchanged.
    </StatusNotice>
  );
  return <NotificationsView state={state} actions={controller} screen="delivery-status" />;
}
