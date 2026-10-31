import assert from 'node:assert/strict';
import {readFile, mkdir, readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {build} from 'esbuild';
import {Miniflare, convertV4MiniflareOptions} from 'miniflare';
import {localPolicy, providerTarget, portalOrigin, providerOrigin, sha} from '../scripts/rebuild-native-boundary.mjs';

const portal = path.resolve(import.meta.dirname, '..');
export const sourceRoot = path.resolve(portal, '../..');
export const artifacts = path.join(sourceRoot, '.local-artifacts/portal-rebuild/w6-native');
const runtime = path.join(portal, 'session-integration/runtime');
const app = path.join(sourceRoot, '.local-artifacts/portal-rebuild/application');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};

export async function connectedStack(fixture) {
  const dir = path.join(artifacts, 'stack-' + randomBytes(8).toString('hex'));
  await mkdir(dir, {recursive: true, mode: 0o700});
  const seams = [];
  const plugin = {name: 'reviewed-loopback-origins-only', setup(builder) {
    builder.onLoad({filter: /[/\\]server[/\\]policy\.ts$/}, async args => {
      assert.equal(args.path, path.join(runtime, 'server/policy.ts'));
      const original = await readFile(args.path, 'utf8'), contents = localPolicy(original);
      seams.push({file: 'server/policy.ts', originalSha256: sha(original), testBundleSha256: sha(contents), substitutions: 2});
      return {contents, loader: 'ts'};
    });
  }};
  for (const [entry, output] of [['server/advisor-candidate-gateway.ts','gateway.mjs'],['workers/session-vault/index.ts','vault.mjs']]) {
    await build({absWorkingDir: runtime, tsconfig:'tsconfig.json', entryPoints:[entry], bundle:true, format:'esm', platform:'browser', target:'es2022', outfile:path.join(dir,output), external:['cloudflare:workers'], legalComments:'none', plugins:[plugin]});
  }
  assert.equal(seams.length, 2);
  const issued = new Map(), calls = [], errors = [], held = new Map();
  function remember(data) {
    if (!data?.access_token) return;
    const claims = JSON.parse(Buffer.from(data.access_token.split('.')[1], 'base64url').toString());
    assert.match(claims.session_id, /^[0-9a-f-]{36}$/); assert.equal(claims.iss, providerOrigin + '/auth/v1');
    issued.set(claims.session_id, {id:claims.session_id, ownerId:claims.sub, token:data.access_token, closed:false});
  }
  const outbound = async request => {
    // Destination validation happens before body parsing or network access.
    const url = new URL(request.url);
    let target;
    try { target=providerTarget(request.url); }
    catch {errors.push({kind:'refused-provider-route',origin:url.origin,path:url.pathname,queryKeys:[...url.searchParams.keys()]});throw Error('Refused provider route');}
    const body = ['GET','HEAD'].includes(request.method) ? undefined : Buffer.from(await request.arrayBuffer());
    const command = url.pathname.startsWith('/functions/') ? JSON.parse(body) : null;
    if (url.pathname.startsWith('/functions/')) {
      const allowed = {'concierge-operations':['advisor_list'], 'concierge-payments':['advisor_read','confirm_payment']};
      const family = url.pathname.split('/').at(-1);
      if (family !== 'concierge-plans') assert.ok(allowed[family]?.includes(command.action), 'Finite native feature boundary');
    }
    let response;
    const forwardHeaders=Object.fromEntries([...request.headers].filter(([name])=>['apikey','authorization','content-type','origin','x-supabase-api-version','cache-control','pragma'].includes(name)));
    try {response = await fetch(target, {method:request.method, headers:forwardHeaders, body, redirect:'manual', signal:AbortSignal.timeout(15000)});}
    catch(error) {errors.push({kind:'local-fetch',path:url.pathname,error:error.message,cause:error.cause?.code??null,detail:error.cause?.message??null,headerNames:[...request.headers.keys()]});throw error;}
    assert.ok(response.status < 300 || response.status >= 400, 'Provider redirects are refused');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (url.pathname === '/auth/v1/token' && response.ok) remember(JSON.parse(bytes));
    calls.push({method:request.method, path:url.pathname, action:command?.action ?? null, status:response.status});
    const wait = held.get(command?.action);
    if (wait) { held.delete(command.action); wait.enter(); await wait.gate; }
    return new Response([204,205].includes(response.status) ? null : bytes, {status:response.status, headers:Object.fromEntries(response.headers)});
  };
  const assets = async request => {
    const url = new URL(request.url);
    assert.equal(url.origin, portalOrigin);
    assert.equal(request.method, 'GET');
    let file = path.resolve(app, '.' + decodeURIComponent(url.pathname));
    assert.ok(file.startsWith(app + path.sep));
    let bytes;
    try { if (!(await stat(file)).isFile()) throw Error(); bytes = await readFile(file); }
    catch {
      // Only actual semantic app routes receive the actual application document.
      if (!/^\/(?:plan(?:\/.*)?|advisor\/(?:plans|clients)(?:\/.*)?|history|orders|account|notifications|maya)?$/.test(url.pathname)) return new Response('not found', {status:404});
      file = path.join(app, 'index.html'); bytes = await readFile(file);
    }
    return new Response(bytes, {headers:{'content-type':mime[path.extname(file)] ?? 'application/octet-stream', 'cache-control':'private, no-store', 'referrer-policy':'no-referrer', 'x-content-type-options':'nosniff', 'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"}});
  };
  const common = {PORTAL_ORIGIN:portalOrigin, CLIENT_SHARED_SESSIONS:'true', ADVISOR_SHARED_SESSIONS:'true'};
  const config = {cf:false, logRequests:false, upstream:portalOrigin, durableObjectsPersist:path.join(dir, 'sqlite-vault'), workers:[
    {name:'gateway', routes:['127.0.0.1/*'], modules:true, modulesRoot:dir, scriptPath:path.join(dir,'gateway.mjs'), compatibilityDate:'2026-10-20', compatibilityFlags:['nodejs_compat'], bindings:common, durableObjects:{ADVISOR_SESSIONS:{className:'AdvisorSessionObject',scriptName:'vault',useSQLite:true}}, serviceBindings:{ASSETS:assets}, outboundService:async()=>{throw Error('Unexpected gateway outbound');}},
    {name:'vault', modules:true, modulesRoot:dir, scriptPath:path.join(dir,'vault.mjs'), compatibilityDate:'2026-10-20', compatibilityFlags:['nodejs_compat'], bindings:{...common,SUPABASE_PUBLIC_KEY:fixture.config.PUBLISHABLE_KEY,ADVISOR_SESSION_KEYS:JSON.stringify({active:'local',keys:{local:randomBytes(32).toString('base64url')}}),SESSION_IDLE_SECONDS:'3600',SESSION_ABSOLUTE_SECONDS:'28800',SESSION_FLOW_SECONDS:'600',CLIENT_REMEMBER_IDLE_SECONDS:'604800',CLIENT_REMEMBER_ABSOLUTE_SECONDS:'2592000'}, durableObjects:{ADVISOR_SESSIONS:{className:'AdvisorSessionObject',useSQLite:true}}, outboundService:outbound},
  ]};
  const mf = new Miniflare({...convertV4MiniflareOptions(config),telemetry:{enabled:false}});
  await mf.ready;
  async function cleanup() {
    const failures = [];
    for (const item of issued.values()) {
      try {
        if (fixture.sql(`select count(*) from auth.sessions where id='${item.id}'`) !== '0') {
          const response = await fetch(providerOrigin + '/auth/v1/logout?scope=local', {method:'POST',headers:{apikey:fixture.config.PUBLISHABLE_KEY,authorization:'Bearer '+item.token},redirect:'manual'});
          assert.ok([200,204].includes(response.status));
        }
        item.closed = true;
      } catch { failures.push(item.id); }
    }
    const ids = [...issued.keys()];
    const count = table => ids.length ? Number(fixture.sql(`select count(*) from auth.${table} where ${table==='sessions'?'id':'session_id'} in (${ids.map(id=>`'${id}'`).join(',')})`)) : 0;
    const result = {issued:ids.length,closed:[...issued.values()].filter(x=>x.closed).length,remainingSessions:count('sessions'),remainingRefreshTokens:count('refresh_tokens'),failures:failures.length};
    assert.deepEqual([result.remainingSessions,result.remainingRefreshTokens,result.failures],[0,0,0], 'All owned sessions must close even after earlier failure');
    return result;
  }
  function hold(action) {
    assert.ok(!held.has(action)); let enter,release;
    const entered=new Promise(r=>enter=r),gate=new Promise(r=>release=r);
    held.set(action,{enter,gate}); return {entered,release};
  }
  async function bind(context, index=1) {
    context.on('page', page => page.on('pageerror', () => errors.push('pageerror')));
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin !== portalOrigin) {errors.push('blocked external '+url.origin); return route.abort();}
      try {
        const headers=await request.allHeaders();
        assert.equal(headers.authorization, undefined, 'Browser provider bearer forbidden');
        headers['cf-connecting-ip']='192.0.2.'+(100+index);
        const response=await mf.dispatchFetch(request.url(),{method:request.method(),headers,body:request.postDataBuffer()??undefined});
        const resultHeaders=Object.fromEntries(response.headers);
        const cookies=response.headers.getSetCookie();
        if(cookies.length) resultHeaders['set-cookie']=cookies.join('\n');
        await route.fulfill({status:response.status,headers:resultHeaders,body:Buffer.from(await response.arrayBuffer())});
      } catch {errors.push('local dispatch failed '+url.pathname); await route.abort().catch(()=>{});}
    });
  }
  return {mf,dir,seams,calls,errors,issued,remember,cleanup,hold,bind,async dispose(){await mf.dispose();}};
}

export function nodeCookieClient(stack, audience, ip=1) {
  const cookies=new Map();
  return {cookies,async request(endpoint, body, csrf) {
    const response=await stack.mf.dispatchFetch(portalOrigin+'/api/'+audience+'/'+endpoint,{method:body===undefined?'GET':'POST',headers:{origin:portalOrigin,'cf-connecting-ip':'192.0.2.'+ip,cookie:[...cookies].map(([k,v])=>k+'='+v).join('; '),...(body===undefined?{}:{'content-type':'application/json'}),...(csrf?{'x-shelv-csrf':csrf}:{})},body:body===undefined?undefined:JSON.stringify(body)});
    for(const raw of response.headers.getSetCookie()) {const [key,value]=raw.split(';')[0].split('=');if(value)cookies.set(key,value);else cookies.delete(key);}
    const value=await response.json(); return {status:response.status,value,headers:response.headers};
  }};
}

export async function mailSnapshot() {
  const response=await fetch('http://127.0.0.1:57424/api/v1/messages',{redirect:'manual'}); assert.equal(response.status,200);return response.json();
}

export async function captureCallback(email, before, returnPath) {
  assert.ok(email.endsWith('.invalid'));
  let list;
  for(let n=0;n<40;n++) {list=await mailSnapshot();if(list.total>before.total)break;await new Promise(r=>setTimeout(r,100));}
  const fresh=list.messages.filter(m=>!before.messages.some(old=>old.ID===m.ID));
  const messages=[];
  for(const item of fresh) {
    const response=await fetch('http://127.0.0.1:57424/api/v1/message/'+encodeURIComponent(item.ID),{redirect:'manual'});
    assert.equal(response.status,200);const message=await response.json();
    if(message.To?.some(recipient=>recipient.Address===email)) messages.push(message);
  }
  assert.equal(messages.length,1,'Exactly one local email for the selected synthetic recipient');
  const links=[...(messages[0].HTML??messages[0].Text).matchAll(/https?:[^\s"<>]+/g)].map(m=>m[0].replaceAll('&amp;','&')).filter(raw=>{const u=new URL(raw);return u.origin===providerOrigin&&u.pathname==='/auth/v1/verify';});
  assert.ok(links.length);
  const verify=await fetch(links[0],{redirect:'manual'}); assert.ok([302,303].includes(verify.status));
  const returned=new URL(verify.headers.get('location'));
  assert.equal(returned.origin,portalOrigin);assert.equal(returned.pathname,returnPath);assert.equal(returned.searchParams.size,1);assert.ok(returned.searchParams.get('code'));
  return {url:returned.href,code:returned.searchParams.get('code'),localEmails:fresh.length};
}
