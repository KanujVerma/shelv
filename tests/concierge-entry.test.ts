import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { clientFixture, ownerId } from './fixtures/concierge.ts';

test('actual entrypoint registers, fails closed without configuration and uses only public-key bearer transport', () => {
  const entry = new URL('../supabase/functions/concierge-operations/index.ts', import.meta.url).href;
  const script = `
    const config = {}, requestedEnv = [], paths = [];
    let serve;
    globalThis.Deno = {env:{get(name){requestedEnv.push(name);return config[name];}},serve(handler){serve=handler;}};
    globalThis.fetch = async (url, init) => {
      const parsed = new URL(url); paths.push(parsed.pathname);
      if (new Headers(init.headers).get('authorization') !== 'Bearer synthetic-token') throw Error('wrong bearer');
      if (new Headers(init.headers).get('apikey') !== 'synthetic-public-key') throw Error('wrong key');
      if (parsed.pathname === '/auth/v1/user') return Response.json({id:${JSON.stringify(ownerId)},is_anonymous:false});
      if (parsed.pathname === '/rest/v1/rpc/concierge_client_view') return Response.json({...${JSON.stringify(clientFixture())},draft:{advisorNote:'PRIVATE_CANARY'}});
      throw Error('Unexpected network path');
    };
    await import(${JSON.stringify(entry)});
    const request = () => new Request('https://edge.invalid',{method:'POST',headers:{authorization:'Bearer synthetic-token','content-type':'application/json',origin:'https://portal.invalid'},body:'{"action":"client_read"}'});
    const closed = await serve(request());
    config.SUPABASE_URL = 'https://synthetic.invalid'; config.SUPABASE_ANON_KEY = 'synthetic-public-key'; config.CONCIERGE_ALLOWED_ORIGINS = 'https://portal.invalid';
    const opened = await serve(request());
    process.stdout.write(JSON.stringify({closedStatus:closed.status,closed:await closed.json(),openedStatus:opened.status,opened:await opened.json(),requestedEnv,paths}));
  `;
  const result = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '--eval', script], { encoding: 'utf8', env: { NODE_ENV: 'test', NODE_NO_WARNINGS: '1' } });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.closedStatus, 503); assert.deepEqual(output.closed, { code: 'unavailable' });
  assert.equal(output.openedStatus, 200); assert.deepEqual(output.opened, clientFixture());
  assert.deepEqual(output.paths, ['/auth/v1/user', '/rest/v1/rpc/concierge_client_view']);
  assert.ok(!output.requestedEnv.includes('SUPABASE_SERVICE_ROLE_KEY'));
  assert.doesNotMatch(result.stdout, /PRIVATE_CANARY/);
});
