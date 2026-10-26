export function portalReturnPath(value: unknown, audience: 'client'|'advisor'): string;
export function navigationReturnTo(redirect: string|undefined, audience: 'client'|'advisor', origin?: string): string|undefined;
export function portalLoginRedirect(location: {href:string}, audience: 'client'|'advisor'): string;
