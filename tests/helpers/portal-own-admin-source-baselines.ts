/** Eight full source identities from the complete independently reviewed admin37.
 * These are current composition pins, not old clinical-equivalence evidence. */
import {createHash} from 'node:crypto';
import {loadPortalCiBaselines} from './portal-ci-baselines.ts';
export const ownAdminSourceCommit='7bf7f34b5042ab4323a7d0b07f51684122152bed';
export const ownAdminSourceFixtureSha256='4e330bfa09c668c34af9353b9e363feccfd063f8d190a8e0434a4b2bed176798';
export const ownAdminSourcePaths=Object.freeze([
 'apps/portal/site/auth/client-cookie-session.js',
 'apps/portal/site/auth/advisor-cookie-session.js',
 'apps/portal/src/transport/session.ts',
 'apps/portal/session-integration/runtime/server/client-policy.ts',
 'apps/portal/session-integration/runtime/server/client-upstream.ts',
 'apps/portal/session-integration/runtime/server/policy.ts',
 'apps/portal/session-integration/runtime/server/gateway.ts',
 'supabase/functions/concierge-operations/runtime.ts',
]);
const fixture=loadPortalCiBaselines(new URL('../fixtures/portal-own-admin-source-baselines.json',import.meta.url),ownAdminSourceFixtureSha256);
export function ownAdminSourceBytes(path:string):Buffer|null {
 return ownAdminSourcePaths.includes(path)?fixture.readBytes(ownAdminSourceCommit,path):null;
}
export function ownAdminSourceSha256(path:string):string|null {
 const bytes=ownAdminSourceBytes(path);return bytes===null?null:createHash('sha256').update(bytes).digest('hex');
}
