import { useSyncExternalStore } from 'react';
import { Badge, Button, Icon, StatusNotice } from '../../ui/index.ts';
import { presentEmail, presentEvent, presentInbox } from './model.ts';
import type { NotificationController, NotificationViewProps } from './types.ts';
import './notifications.css';
const date = (value: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
/** Parent owns mounting, route selection, shared overlays and initial loading. */
export function Notifications({ controller, screen }: { controller: NotificationController; screen?: NotificationViewProps['screen'] }) {
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  return <NotificationsView state={state} actions={controller} screen={screen ?? (state.selectedEvent || state.loadingDeliveries ? 'delivery-status' : 'inbox')} />;
}
export function NotificationsView({ state, actions, screen = 'inbox' }: NotificationViewProps) {
  const operational = state.phase === 'ready';
  const missingEvent = screen === 'delivery-status' && state.missingInput !== null && !state.selectedEvent && !state.deliveries && !state.loadingDeliveries;
  const busy = state.mutation === 'saving' || state.checkingStatus;
  const recovery = state.pending !== null && ['uncertain', 'unknown', 'conflict'].includes(state.mutation);
  const message = (operational || state.phase === 'idle') && !(operational && recovery && state.message === state.pendingRecovery?.reason) ? state.message : null;
  const refresh = screen === 'inbox' ? actions.loadInbox : actions.loadDeliveries;
  const inbox = operational && state.inbox ? presentInbox(state.inbox) : null;
  const deliveries = operational ? state.deliveries : null;
  return <section className="notification-page" aria-label={screen === 'inbox' ? 'notifications' : 'notification delivery status'}>
    <header className="notification-heading"><div><h1 data-page-heading tabIndex={-1}>{screen === 'inbox' ? 'notifications' : 'delivery status'}</h1>
      {screen === 'delivery-status' ? <p>email delivery and portal seen status are separate.</p> : null}</div>
      {!missingEvent ? <Button variant="secondary" busy={state.phase === 'loading' || state.loadingDeliveries} onClick={() => void refresh()} disabled={['ended', 'denied'].includes(state.phase)}><Icon name="history" size="small" />refresh</Button> : null}
    </header>
    {state.phase === 'idle' && screen === 'inbox' ? <StatusNotice title="load your notifications" action={<Button onClick={() => void refresh()}>load notifications</Button>} /> : null}
    {state.phase === 'loading' ? <StatusNotice tone="loading" title="loading notifications" /> : null}
    {state.phase === 'offline' ? <StatusNotice tone="warning" title="notifications are unavailable while offline" action={<Button variant="secondary" onClick={() => void refresh()}>try again</Button>}>any unresolved action is kept for this session.</StatusNotice> : null}
    {state.phase === 'ended' ? <StatusNotice tone="denied" title="your session has ended. sign in again." /> : null}
    {state.phase === 'denied' ? <StatusNotice tone="denied" title="you do not have access to these notifications" /> : null}
    {state.phase === 'error' ? <StatusNotice tone="error" title="could not load notifications" action={<Button variant="secondary" onClick={() => void refresh()}>try again</Button>} /> : null}
    {message ? <StatusNotice tone={state.mutation === 'conflict' ? 'warning' : state.mutation === 'error' ? 'error' : 'neutral'} title={message} /> : null}
    {operational && recovery ? <StatusNotice tone="uncertain" title={state.mutation === 'unknown' ? 'the original result is still unknown' : 'the action result is uncertain'}
      action={<div className="notification-actions"><Button variant="secondary" busy={state.checkingStatus} disabled={busy || state.pendingRecovery?.available !== true} onClick={() => void actions.checkStatus()}>check original status</Button><Button variant="secondary" disabled={busy || state.pendingRecovery?.available !== true} onClick={() => void actions.retryExact()}>retry exact action</Button></div>}>
      <p>checking status does not send another email. an exact retry keeps the original action.</p>
      {state.pendingRecovery?.reason ? <p>{state.pendingRecovery.reason}</p> : null}</StatusNotice> : null}
    {screen === 'inbox' && inbox ? <>
      <p className="notification-observation">observed <time dateTime={inbox.observedAt}>{date(inbox.observedAt)}</time>. refresh to check for changes.</p>
      {inbox.items.length === 0 ? <StatusNotice tone="empty" title="no notifications on this page" /> : <ul className="notification-list">{state.inbox!.items.map((item, index) => {
        const view = inbox.items[index]!;
        return <li key={item.deliveryId} className="notification-row"><div className="notification-row-content"><div className="notification-meta"><Badge tone={item.seenAt === null ? 'pending' : 'neutral'}>{view.portalLabel}</Badge><time dateTime={view.createdAt}>{date(view.createdAt)}</time></div><h2>{view.title}</h2>
          {view.email ? <p>email: {view.email.label}. {view.email.detail}</p> : null}
          {view.missingInput ? <p>the related review cannot be opened here yet.</p> : null}</div>
          <div className="notification-actions">{view.href ? <Button asChild variant="secondary"><a href={view.href}>open update</a></Button> : null}
            {item.seenAt === null ? <Button variant="ghost" disabled={busy || state.pending !== null} onClick={() => void actions.markSeen(item.deliveryId)}>mark seen</Button> : null}
            {state.audience === 'advisor' ? <Button variant="ghost" disabled={busy} onClick={() => void actions.openEvent(item.deliveryId)}>delivery status</Button> : null}</div>
        </li>;
      })}</ul>}
      <nav className="notification-pager" aria-label="notification pages"><Button variant="secondary" disabled={!state.canPreviousInbox || busy} onClick={() => void actions.previousInbox()}>previous page</Button><Button variant="secondary" disabled={inbox.nextCursor === null || busy} onClick={() => void actions.nextInbox()}>next page</Button></nav>
    </> : null}
    {missingEvent && (operational || state.phase === 'idle') ? <StatusNotice title="delivery status is unavailable">select a notification or return from a published plan to check its delivery.</StatusNotice> : null}
    {screen === 'delivery-status' && operational ? <>
      {state.inbox ? <Button variant="ghost" onClick={actions.closeEvent}><Icon name="arrow-left" size="small" />back to notifications</Button> : null}
      {state.loadingDeliveries ? <StatusNotice tone="loading" title="loading delivery status" /> : null}
      {deliveries ? <>
        <h2>{presentEvent(deliveries.event).title}</h2><p className="notification-observation">observed <time dateTime={deliveries.observedAt}>{date(deliveries.observedAt)}</time>. this page can change.</p>
        {!state.canRetryEmail ? <p>view only. email retry requires current editing access.</p> : null}
        {deliveries.items.length === 0 ? <StatusNotice tone="empty" title="no deliveries on this page" /> : <ul className="notification-list">{deliveries.items.map((item, index) => <li key={item.deliveryId} className="notification-row">
          <div><h3>{item.channel === 'email' ? `email ${index + 1}` : `portal notification ${index + 1}`}</h3>
            {item.channel === 'portal' ? <><Badge>{item.seenAt === null ? 'unread' : 'seen'}</Badge>{item.seenAt ? <p>seen <time dateTime={item.seenAt}>{date(item.seenAt)}</time></p> : null}</>
              : <><Badge tone={item.status === 'failed' || item.status === 'uncertain' ? 'pending' : 'neutral'}>{item.status}</Badge><p>{presentEmail(item.status).detail}</p></>}</div>
          {item.channel === 'email' && item.status === 'failed' && state.canRetryEmail ? <Button variant="secondary" disabled={busy || state.pending !== null} onClick={() => actions.prepareRetry(item.deliveryId)}>retry email</Button> : null}
        </li>)}</ul>}
        <nav className="notification-pager" aria-label="delivery pages"><Button variant="secondary" disabled={!state.canPreviousDeliveries || busy} onClick={() => void actions.previousDeliveries()}>previous page</Button><Button variant="secondary" disabled={deliveries.nextCursor === null || busy} onClick={() => void actions.nextDeliveries()}>next page</Button></nav>
      </> : null}
    </> : null}
    {operational && state.confirmation ? <section className="notification-confirmation" aria-label="confirm email retry"><h2>retry this failed email?</h2><p>this queues the notification again. the published plan and service dates stay the same.</p><div className="notification-actions"><Button disabled={busy} onClick={() => void actions.confirmRetry()}>confirm email retry</Button><Button variant="secondary" disabled={busy} onClick={actions.cancelRetry}>cancel</Button></div></section> : null}
  </section>;
}
