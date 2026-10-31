/** Navigation identifies a view, never an authenticated owner or a permission. */
export type RoutinePeriod = 'morning' | 'evening';
export type EditorSection = 'sources' | 'client-context' | 'decisions' | 'routine' | 'follow-up' | 'review-publish';
export type AdvisorClientTask = 'overview'|'draft'|'payments'|'checkins'|'history'|'service';
export type PresentationMode = 'client' | 'advisor-preview' | 'public-demo' | 'private-walkthrough' | 'historical';
export type PortalRoute =
  | {name: 'plan'; routine: RoutinePeriod}
  | {name: 'report-use'; routine: RoutinePeriod}
  | {name: 'recommendation'; decisionId: string; routine: RoutinePeriod}
  | {name: 'product' | 'product-evidence' | 'product-use'; productId: string; routine: RoutinePeriod}
  | {name: 'history' | 'history-new' | 'orders' | 'account' | 'account-service' | 'account-cancel' | 'notifications' | 'advisor-clients' | 'advisor-plans' | 'advisor-permissions'}
  | {name: 'history-event'; eventId: string}
  | {name: 'history-version'; version: string}
  | {name: 'order'; orderId: string}
  | {name: 'advisor-client'; clientId: string; task?: AdvisorClientTask}
  | {name: 'advisor-editor'; draftId: string; section: EditorSection}
  | {name: 'advisor-preview'; draftId: string}
  | {name: 'advisor-review'; reportId: string}
  | {name: 'maya'; stage: 1 | 2 | 3 | 4 | 5};

export { CLIENT_NAVIGATION, buildRoute, parseRoute, safeReturnPath, parentRoute } from '../../site/auth/portal-routes.js';
