import type { PortalRoute } from '../../src/navigation/routes.ts';
export const CLIENT_NAVIGATION: readonly {readonly label: string; readonly route: PortalRoute; readonly icon: 'plan'|'history'|'orders'|'account'}[];
export function buildRoute(route: PortalRoute): string;
export function parseRoute(path: string): PortalRoute|null;
export function safeReturnPath(path: string, audience: 'client'|'advisor'): string|null;
export function parentRoute(route: PortalRoute): PortalRoute;
