import test from 'node:test';
import assert from 'node:assert/strict';
import {consumeCallback} from '../site/advisor/api.js';
import {prepareApplication} from '../src/app/bootstrap.ts';
import {CookieAdvisorSession} from '../site/auth/advisor-cookie-session.js';
import {CookieClientSession} from '../site/auth/client-cookie-session.js';
import {createAdvisorSessionBridge} from '../site/auth/advisor-session-bridge.js';

const keys=['token_hash','type','error','error_code','error_description','code','access_token','refresh_token','expires_at','expires_in','token_type','provider_token','provider_refresh_token'];
function consume(path) {
  const location={href:'https://portal.invalid'+path},events=[];
  const history={replaceState(state,_,path){events.push({state,path});location.href='https://portal.invalid'+path;}};
  return {location,events,callback:consumeCallback(location,history)};
}
function rejected(path) {
  const value=consume(path);
  assert.equal(value.events.length,1,'scrub synchronously');
  assert.equal(value.events[0].state,null);
  assert.deepEqual(value.callback,{kind:null,tokenHash:null,accessToken:null,refreshToken:null,code:null,type:'email',error:true});
  assert.equal(new URL(value.location.href).hash,'');
  for(const key of keys) assert.equal(new URL(value.location.href).searchParams.has(key),false);
  return value;
}

test('shared callback scrubs and rejects every partial/empty key on either URL side',()=>{
  for(const side of ['?','#']) for(const key of keys) for(const text of ['','SYNTHETIC-private']) {
    // Query code/token_hash and fragment access_token are complete supported forms.
    if(text&&((side==='?'&&['code','token_hash'].includes(key))||(side==='#'&&key==='access_token'))) continue;
    rejected('/plan'+side+key+'='+text);
  }
});
test('shared callback rejects duplicate, mixed, partial, error and oversized forms without returning credentials',()=>{
  for(const key of keys) {
    rejected('/plan?code=SYNTHETIC&'+key+'=one&'+key+'=two');
    rejected('/plan?code=SYNTHETIC&'+key+'=one#'+key+'=two');
    rejected('/plan#access_token=SYNTHETIC&'+key+'=one&'+key+'=two');
  }
  for(const path of [
    '?code=a&code=b','?code=a#access_token=b','?code=a&token_hash=b',
    '?token_hash=a#refresh_token=b','#code=a&access_token=b',
    '?access_token=a&refresh_token=b','#refresh_token=a',
    '#access_token=a&refresh_token=','#access_token=a&expires_in=no',
    '#access_token=a&token_type=unknown','?code=a&type=unsupported',
    '?code=a&error=denied','#access_token=a&error_description=SYNTHETIC-private',
    '?error=','#error_code=','#error_description=SYNTHETIC-private',
    '?code='+ 'a'.repeat(2049),'?token_hash='+'a'.repeat(2049),
    '#access_token='+'a'.repeat(16385),'#access_token=a&refresh_token='+'a'.repeat(8193),
    '#access_token=a&provider_token='+'a'.repeat(16385),
  ]) rejected('/plan'+path);
});
test('retained cookie consumers reject bad shared callbacks before complete or restore',async()=>{
  for(const Cookie of [CookieAdvisorSession,CookieClientSession]) {
    let requests=0,coordinates=0;
    const bridge=createAdvisorSessionBridge({Cookie,fetcher:async()=>{requests++;throw Error('unexpected network');}});
    bridge.cookie.locks={request:async(_,o,run)=>{coordinates++;return run(o.signal);}};
    try {
      for(const key of keys) await assert.rejects(bridge.accept(consume('/plan#'+key+'=').callback),e=>e.status===401);
      assert.equal(requests,0);assert.equal(coordinates,0);assert.equal(bridge.status,'initial');
    } finally {bridge.dispose();}
  }
});
test('shared callback preserves supported kind/type values and validates retained navigation',()=>{
  for(const type of ['email','signup','invite','magiclink','recovery','email_change']) {
    const value=consume('/?workspace=client&clientView=routine&token_hash=SYNTHETIC&type='+type);
    assert.equal(value.callback.kind,'token_hash');
    assert.equal(value.callback.tokenHash,'SYNTHETIC');
    assert.equal(value.callback.type,type);
    assert.equal(value.callback.error,false);
    assert.equal(value.events[0].path,'/?workspace=client&clientView=routine');
  }
  const pkce=consume('/advisor/plans/draft/routine?code=SYNTHETIC');
  assert.equal(pkce.callback.kind,'pkce'); assert.equal(pkce.callback.code,'SYNTHETIC');
  assert.equal(pkce.callback.error,false);
  for(const fragment of ['access_token=SYNTHETIC','access_token=SYNTHETIC&refresh_token=REFRESH&expires_in=3600&expires_at=1893456000&token_type=bearer&type=recovery&provider_token=PROVIDER&provider_refresh_token=PROVIDER-REFRESH']) {
    const value=consume('/plan?routine=evening#'+fragment);
    assert.equal(value.callback.kind,'implicit'); assert.equal(value.callback.accessToken,'SYNTHETIC');
    assert.equal(value.callback.error,false); assert.equal(value.events[0].path,'/plan?routine=evening');
  }
  const preview=consume('/?advisorPreview=draft&clientId=10000000-0000-4000-8000-000000000002&revision=2&code=SYNTHETIC');
  assert.equal(preview.callback.error,false); assert.match(preview.events[0].path,/advisorPreview=draft/);
  for(const query of ['&notice=SYNTHETIC-private','&routine=morning&routine=evening','&next=https://outside.invalid','&workspace=owner']) {
    const value=rejected('/plan?code=SYNTHETIC'+query);
    assert.equal(value.events[0].path,'/plan');
  }
  assert.deepEqual(consume('/plan?routine=evening').events,[]);
});
test('application receives an explicit bad callback after synchronous scrub on private/public/unknown routes',()=>{
  for(const path of ['/plan','/advisor/clients','/maya','/unknown']) for(const key of keys) {
    const location={href:'https://portal.invalid'+path+'#'+key+'=SYNTHETIC-private'};
    const result=prepareApplication(location,{replaceState(_,__,value){location.href='https://portal.invalid'+value;}});
    assert.equal(result.callback.error,true,path+' '+key);
    assert.equal(result.callback.code,null);
    assert.equal(location.href,'https://portal.invalid'+path);
    assert.equal(JSON.stringify(result).includes('SYNTHETIC-private'),false);
  }
});
