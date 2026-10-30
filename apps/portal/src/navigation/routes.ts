/** Navigation identifies a view, never an authenticated owner or a permission. */
export type RoutinePeriod = 'morning' | 'evening';
export type EditorSection = 'sources' | 'client-context' | 'decisions' | 'routine' | 'follow-up' | 'review-publish';
export type PresentationMode = 'client' | 'advisor-preview' | 'public-demo' | 'private-walkthrough' | 'historical';
export type PortalRoute =
  | {name: 'plan'; routine: RoutinePeriod}
  | {name: 'recommendation'; decisionId: string; routine: RoutinePeriod}
  | {name: 'product' | 'product-evidence' | 'product-use'; productId: string; routine: RoutinePeriod}
  | {name: 'history' | 'history-new' | 'orders' | 'account' | 'account-service' | 'account-cancel' | 'notifications' | 'advisor-clients' | 'advisor-plans' | 'advisor-permissions'}
  | {name: 'history-event'; eventId: string}
  | {name: 'history-version'; version: string}
  | {name: 'order'; orderId: string}
  | {name: 'advisor-client'; clientId: string}
  | {name: 'advisor-editor'; draftId: string; section: EditorSection}
  | {name: 'advisor-preview'; draftId: string}
  | {name: 'advisor-review'; reportId: string}
  | {name: 'maya'; stage: 1 | 2 | 3 | 4 | 5};

export const CLIENT_NAVIGATION = [
  {label: 'your plan', route: {name: 'plan', routine: 'morning'}, icon: 'plan'},
  {label: 'check-ins & history', route: {name: 'history'}, icon: 'history'},
  {label: 'orders', route: {name: 'orders'}, icon: 'orders'},
  {label: 'account', route: {name: 'account'}, icon: 'account'},
] as const;
const sections = new Set<EditorSection>(['sources','client-context','decisions','routine','follow-up','review-publish']);
const simpleRoutes = {
  history: '/history', 'history-new': '/history/new', orders: '/orders', account: '/account',
  'account-service': '/account/service', 'account-cancel': '/account/cancel', notifications: '/notifications',
  'advisor-clients': '/advisor/clients', 'advisor-plans': '/advisor/plans', 'advisor-permissions': '/advisor/permissions',
} as const;
function validId(value: string): boolean {return /^[a-zA-Z0-9][a-zA-Z0-9_:.-]{0,159}$/.test(value) && value !== '..';}
function id(value: string): string {if (!validId(value)) throw new TypeError('invalid route identity'); return encodeURIComponent(value);}
function routineQuery(routine: RoutinePeriod): string {
  if (routine !== 'morning' && routine !== 'evening') throw new TypeError('invalid routine');
  return routine === 'evening' ? '?routine=evening' : '';
}
export function buildRoute(route: PortalRoute): string {
  if (route.name in simpleRoutes) return simpleRoutes[route.name as keyof typeof simpleRoutes];
  switch (route.name) {
    case 'plan': return '/plan' + routineQuery(route.routine);
    case 'recommendation': return '/plan/recommendations/' + id(route.decisionId) + routineQuery(route.routine);
    case 'product': case 'product-evidence': case 'product-use':
      return '/plan/products/' + id(route.productId) + (route.name === 'product' ? '' : route.name === 'product-evidence' ? '/evidence' : '/use') + routineQuery(route.routine);
    case 'history-event':
      if (route.eventId === 'new') throw new TypeError('reserved history route');
      return '/history/' + id(route.eventId);
    case 'history-version': return '/history/versions/' + id(route.version);
    case 'order': return '/orders/' + id(route.orderId);
    case 'advisor-client': return '/advisor/clients/' + id(route.clientId);
    case 'advisor-editor':
      if (!sections.has(route.section)) throw new TypeError('invalid editor section');
      return '/advisor/plans/' + id(route.draftId) + '/' + route.section;
    case 'advisor-preview': return '/advisor/plans/' + id(route.draftId) + '/preview';
    case 'advisor-review': return '/advisor/reviews/' + id(route.reportId);
    case 'maya':
      if (![1,2,3,4,5].includes(route.stage)) throw new TypeError('invalid guide stage');
      return '/maya' + (route.stage === 1 ? '' : '?stage=' + route.stage);
    default: throw new TypeError('unknown route');
  }
}
function allowedQuery(url: URL, keys: string[]): boolean {
  return [...url.searchParams.keys()].every(key => keys.includes(key) && url.searchParams.getAll(key).length === 1);
}
function legacyRoute(url: URL): PortalRoute | null {
  const q = url.searchParams, audience = q.get('workspace');
  if (!q.size) return {name:'plan',routine:'morning'};
  if (audience === 'client' && allowedQuery(url,['workspace','clientView','product'])) {
    const view=q.get('clientView') ?? 'routine', product=q.get('product');
    if (product && ['routine','recommendations'].includes(view) && validId(product)) return {name:'product',productId:product,routine:'morning'};
    if (product) return null;
    if (['routine','recommendations'].includes(view)) return {name:'plan',routine:'morning'};
    if (['history','checkins'].includes(view)) return {name:'history'};
    if (view === 'payments') return {name:'orders'};
    if (view === 'service') return {name:'account-service'};
    if (view === 'about') return {name:'account'};
  }
  if (audience === 'advisor' && allowedQuery(url,['workspace','advisorClient','advisorTask'])) {
    const client=q.get('advisorClient'), task=q.get('advisorTask');
    if (task && (!client || !['overview','draft','payments','checkins','history','service'].includes(task))) return null;
    if (client && validId(client)) return {name:'advisor-client',clientId:client};
    if (!client && !task) return {name:'advisor-clients'};
  }
  return null;
}
export function parseRoute(path: string): PortalRoute | null {
  if (typeof path !== 'string' || path.length > 600 || !path.startsWith('/') || path.startsWith('//') || /[\\#\u0000-\u0020\u007f]/.test(path)) return null;
  if (/(?:^|\/)(?:\.|%2e){1,2}(?:\/|\?|$)/i.test(path)) return null;
  let url: URL;
  try {url = new URL(path,'https://portal.invalid');} catch {return null;}
  if (url.origin !== 'https://portal.invalid') return null;
  if (url.pathname === '/') return legacyRoute(url);
  const isPlan=url.pathname === '/plan' || url.pathname.startsWith('/plan/');
  if (!allowedQuery(url,isPlan ? ['routine'] : url.pathname === '/maya' ? ['stage'] : [])) return null;
  const routine=url.searchParams.get('routine') ?? 'morning';
  if (isPlan && !['morning','evening'].includes(routine)) return null;
  if (url.pathname === '/plan') return {name:'plan',routine:routine as RoutinePeriod};
  for (const [name,value] of Object.entries(simpleRoutes)) if (url.pathname === value) return {name} as PortalRoute;
  if (url.pathname === '/maya') {
    const stage=url.searchParams.get('stage') ?? '1';
    return /^[1-5]$/.test(stage) ? {name:'maya',stage:Number(stage) as 1|2|3|4|5} : null;
  }
  let parts: string[];
  try {parts=url.pathname.slice(1).split('/').map(decodeURIComponent);} catch {return null;}
  if (parts.some(part=>!validId(part))) return null;
  const [a,b,c,d]=parts;
  if (a==='plan' && b==='recommendations' && parts.length===3) return {name:'recommendation',decisionId:c!,routine:routine as RoutinePeriod};
  if (a==='plan' && b==='products' && (parts.length===3 || parts.length===4 && ['evidence','use'].includes(d!))) return {name:!d?'product':d==='evidence'?'product-evidence':'product-use',productId:c!,routine:routine as RoutinePeriod};
  if (a==='history' && b==='versions' && parts.length===3) return {name:'history-version',version:c!};
  if (a==='history' && parts.length===2) return {name:'history-event',eventId:b!};
  if (a==='orders' && parts.length===2) return {name:'order',orderId:b!};
  if (a==='advisor' && b==='clients' && parts.length===3) return {name:'advisor-client',clientId:c!};
  if (a==='advisor' && b==='reviews' && parts.length===3) return {name:'advisor-review',reportId:c!};
  if (a==='advisor' && b==='plans' && parts.length===4) {
    if (d==='preview') return {name:'advisor-preview',draftId:c!};
    if (sections.has(d as EditorSection)) return {name:'advisor-editor',draftId:c!,section:d as EditorSection};
  }
  return null;
}
export function safeReturnPath(path: string, audience: 'client'|'advisor'): string | null {
  const route=parseRoute(path);
  if (!route || route.name === 'maya' || route.name.startsWith('advisor-') !== (audience === 'advisor')) return null;
  return buildRoute(route);
}
export function parentRoute(route: PortalRoute): PortalRoute {
  switch (route.name) {
    case 'product-evidence': case 'product-use': return {name:'product',productId:route.productId,routine:route.routine};
    case 'product': case 'recommendation': return {name:'plan',routine:route.routine};
    case 'history-new': case 'history-event': case 'history-version': return {name:'history'};
    case 'order': return {name:'orders'};
    case 'account-service': case 'account-cancel': return {name:'account'};
    case 'advisor-client': return {name:'advisor-clients'};
    case 'advisor-editor': case 'advisor-preview': return {name:'advisor-plans'};
    case 'advisor-review': return {name:'advisor-clients'};
    default: return route.name.startsWith('advisor-') ? {name:'advisor-clients'} : {name:'plan',routine:'morning'};
  }
}
