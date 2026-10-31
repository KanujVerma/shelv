import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const portalOrigin = 'https://127.0.0.1:57430';
export const providerOrigin = 'http://127.0.0.1:57421';
export const policyHash = 'c31adceba6e4457183af460d5ebfa3ead1549a772ba7004757885c20607175fc';
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');

export function localPolicy(source) {
  assert.equal(sha(source), policyHash, 'Reviewed policy source hash must match');
  let result = source;
  for (const [name, from, to] of [
    ['PORTAL_ORIGIN', 'https://portal.goshelv.com', portalOrigin],
    ['SUPABASE_ORIGIN', 'https://snojlbqovlawewwqbviz.supabase.co', providerOrigin],
  ]) {
    const literal = `export const ${name} = '${from}';`;
    assert.equal(result.split(literal).length - 1, 1, 'Exactly one reviewed origin literal required');
    result = result.replace(literal, `export const ${name} = '${to}';`);
  }
  return result;
}

export function providerTarget(raw) {
  const url = new URL(raw);
  const deny = () => { throw Error('Refused provider boundary destination'); };
  if (url.origin !== providerOrigin || url.username || url.password || url.hash) deny();
  const query = [...url.searchParams];
  if (url.pathname === '/auth/v1/otp') {
    if (query.length !== 1 || query[0][0] !== 'redirect_to') deny();
    const redirect = new URL(query[0][1]);
    if (redirect.origin !== portalOrigin || redirect.username || redirect.password || redirect.hash || redirect.search || !['/advisor/plans', '/plan'].includes(redirect.pathname)) deny();
    return url.href;
  }
  if (url.pathname === '/auth/v1/token') {
    if (query.length !== 1 || query[0][0] !== 'grant_type' || !['pkce', 'refresh_token'].includes(query[0][1])) deny();
    return url.href;
  }
  if (url.pathname === '/auth/v1/logout') {
    if (query.length !== 1 || query[0][0] !== 'scope' || query[0][1] !== 'local') deny();
    return url.href;
  }
  if (url.search) deny();
  if (['/auth/v1/user', '/rest/v1/rpc/concierge_advisor_session_context', '/rest/v1/rpc/concierge_client_session_context'].includes(url.pathname)) return url.href;
  const ports = new Map([['concierge-plans', 57440], ['concierge-operations', 57441], ['concierge-payments', 57442]]);
  for (const [name, port] of ports) if (url.pathname === '/functions/v1/' + name) return `http://127.0.0.1:${port}/`;
  deny();
}
