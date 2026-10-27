import test from 'node:test';import assert from 'node:assert/strict';
import clientGateway,{advisorGateway as gateway} from '../server/gateway';import {parseCommand,readBounded,validateRequest} from '../server/policy';
const origin='https://portal.goshelv.com',id='11111111-1111-4111-8111-111111111111';
const cookie='a'.repeat(43),flow='b'.repeat(43);
function setup(){const calls:any[]=[];let limited=false;const env:any={ASSETS:{fetch:async(r:Request)=>new Response(`asset:${new URL(r.url).pathname}`)},PORTAL_ORIGIN:origin,ADVISOR_SESSIONS:{getByName:(name:string)=>({invoke:async(command:any)=>{const run=async()=>{calls.push({name,command});if(command.type==='limit')return {allowed:!limited};if(command.type==='flow.bootstrap'||command.type==='flow.restart')return {signedIn:false,csrf:'flow-csrf',flowExpiresAt:'2027-01-01T00:00:00Z'};if(command.type==='session.view')return {ownerId:id,generation:1,csrf:'session-csrf',capabilities:{view:true,edit:true,publish:false,confirmPayments:false},idleExpiresAt:'2027-01-01T00:00:00Z',absoluteExpiresAt:'2027-01-01T08:00:00Z'};if(command.type==='flow.complete'||command.type==='flow.upgrade')return {sessionId:cookie,session:{ownerId:id,generation:1,csrf:'session-csrf'}};if(command.type==='session.logout')return {providerRevoked:true};return {status:200,body:{ok:true}};};return {ok:true,value:await run()};}})}};
 return {env,calls,limit:()=>{limited=true;}};
}
function request(path:string,body?:unknown,headers:Record<string,string>={}){return new Request(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Sec-Fetch-Site':'same-origin','CF-Connecting-IP':'192.0.2.1',...(body===undefined?{}:{'Content-Type':'application/json','X-Shelv-CSRF':'session-csrf'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});}
test('admission route preserves cookie/CSRF authority and client audience cannot dispatch it',async()=>{
 const f=setup();const response=await gateway.fetch(request('/api/advisor/admission',{action:'capabilities'},{Cookie:`__Host-shelv_advisor=${cookie}`}),f.env);
 assert.equal(response.status,200);assert.equal(f.calls.at(-1).command.operation.channel,'admission');assert.equal(f.calls.at(-1).command.csrf,'session-csrf');
 for(const [path,body,headers] of [['/api/advisor/admission',{action:'invite_user'},{Cookie:`__Host-shelv_advisor=${cookie}`}],['/api/advisor/admission',{action:'capabilities'},{Cookie:`__Host-shelv_advisor=${cookie}`,'X-Shelv-CSRF':''}]] as const){const denied=setup();assert.equal((await gateway.fetch(request(path,body,headers),denied.env)).status,403);assert.equal(denied.calls.length,0);}
 const c=setup();c.env.CLIENT_SHARED_SESSIONS='true';assert.equal((await clientGateway.fetch(request('/api/client/admission',{action:'capabilities'},{Cookie:`__Host-shelv_client=${cookie}`}),c.env)).status,403);assert.equal(c.calls.length,0);
});
test('static assets bypass missing session configuration; reserved client API fails closed',async()=>{
 const f=setup();delete f.env.ADVISOR_SESSIONS;for(const p of ['/','/auth/session.js']){const res=await gateway.fetch(request(p),f.env);assert.equal(await res.text(),`asset:${p}`);}assert.equal(f.calls.length,0);
});
test('gateway fails closed for missing binding/config but unknown routes never reach upstream',async()=>{
 const f=setup();delete f.env.ADVISOR_SESSIONS;assert.equal((await gateway.fetch(request('/api/advisor/session'),f.env)).status,503);
 for(const p of ['/api/advisor/upload','/api/advisor/preview/draft/upload','/api/advisor/unknown']){const g=setup();const r=await gateway.fetch(request(p,{}),g.env);assert.equal(r.status,404);assert.equal(g.calls.length,0);}
});
test('strict host, origin, metadata, JSON type and CSRF checks deny before dispatch',async()=>{
 for(const headers of [{Origin:'https://evil.example'},{'Sec-Fetch-Site':'cross-site'},{'Content-Type':'text/plain'},{'X-Shelv-CSRF':''}]){const f=setup(),r=await gateway.fetch(request('/api/advisor/operations',{action:'advisor_list'},{Cookie:`__Host-shelv_advisor=${cookie}`,...headers}),f.env);assert.ok([403,415].includes(r.status));assert.equal(f.calls.length,0);}
 const f=setup();const wrong=new Request('https://evil.example/api/advisor/session',{headers:{Origin:origin,'Sec-Fetch-Site':'same-origin'}});assert.equal((await gateway.fetch(wrong,f.env)).status,403);
});
test('forged, duplicate and expired cookies cannot initialize active records',async()=>{
 for(const value of ['forged',`${cookie}; __Host-shelv_advisor=${cookie}`]){const f=setup(),res=await gateway.fetch(request('/api/advisor/session',undefined,{Cookie:`__Host-shelv_advisor=${value}`}),f.env);assert.equal(res.status,401);assert.equal(f.calls.length,0);}
 const f=setup();f.env.ADVISOR_SESSIONS.getByName=()=>({invoke:async()=>{throw Object.assign(Error('session_ended'),{status:401,code:'session_ended'});}});const r=await gateway.fetch(request('/api/advisor/session',undefined,{Cookie:`__Host-shelv_advisor=${cookie}`}),f.env);assert.equal(r.status,401);assert.equal(r.headers.get('set-cookie'),null);
});
test('bootstrap is bounded and rate limited and cookies are opaque host-only HttpOnly session cookies',async()=>{
 const f=setup(),r=await gateway.fetch(request('/api/advisor/session'),f.env);assert.equal(r.status,200);assert.match(r.headers.get('set-cookie')!,/__Host-shelv_advisor_flow=[A-Za-z0-9_-]{43}; Path=\/; Secure; HttpOnly; SameSite=Lax/);assert.doesNotMatch(r.headers.get('set-cookie')!,/Domain=/);
 const g=setup();g.limit();assert.equal((await gateway.fetch(request('/api/advisor/session'),g.env)).status,429);
 const h=setup(),complete=await gateway.fetch(request('/api/advisor/auth/complete',{code:'synthetic-code'},{Cookie:`__Host-shelv_advisor_flow=${flow}`,'X-Shelv-CSRF':'flow-csrf'}),h.env);assert.equal(complete.status,200);assert.doesNotMatch(complete.headers.get('set-cookie')!,/Max-Age=|Domain=/);assert.ok(!JSON.stringify(await complete.json()).includes(cookie));
});
test('only fixed advisor actions reach their scoped service and no response is cacheable',async()=>{
 const f=setup(),r=await gateway.fetch(request('/api/advisor/operations',{action:'advisor_list'},{Cookie:`__Host-shelv_advisor=${cookie}`}),f.env);assert.equal(r.status,200);assert.match(r.headers.get('cache-control')!,/private, no-store/);assert.equal(f.calls.at(-1).command.operation.channel,'operations');
 for(const action of ['decide','client_read_v2','receive','publish','upload_evidence','anything']){const g=setup();const denied=await gateway.fetch(request('/api/advisor/operations',{action},{Cookie:`__Host-shelv_advisor=${cookie}`}),g.env);assert.equal(denied.status,403);assert.equal(g.calls.length,0);}
});
test('preview accepts selected-client GET contracts and rejects actions, extra query keys, mutations and credential URLs',async()=>{
 const f=setup(),r=await gateway.fetch(request(`/api/advisor/preview/draft?clientId=${id}&expectedRevision=2`,undefined,{Cookie:`__Host-shelv_advisor=${cookie}`}),f.env);assert.equal(r.status,200);assert.equal(f.calls.at(-1).command.operation.mode,'draft');
 for(const p of [`/api/advisor/preview/published?clientId=${id}&action=decide`,`/api/advisor/session?access_token=synthetic`,`/api/advisor/preview/draft?clientId=${id}&expectedRevision=-1`]){const g=setup();assert.equal((await gateway.fetch(request(p,undefined,{Cookie:`__Host-shelv_advisor=${cookie}`}),g.env)).status,400);assert.equal(g.calls.length,0);}
 assert.equal((await gateway.fetch(request(`/api/advisor/preview/published?clientId=${id}`,{action:'decide'}),f.env)).status,405);
});
test('bounded input cancels oversized chunked bodies and validates route policy independently',async()=>{
 const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(100001));c.close();}});await assert.rejects(readBounded(stream,100000),/too_large/);
 assert.throws(()=>parseCommand('payments',{action:'submit_claim'}),/action_forbidden/);
 assert.throws(()=>validateRequest(new Request(origin+'/api/advisor/logout',{method:'POST'}),origin),/origin_rejected/);
});
test('unexpected internal exceptions never echo their message or credentials',async()=>{
 const f=setup();f.env.ADVISOR_SESSIONS.getByName=()=>({invoke:async()=>{throw Error('synthetic-sensitive-canary');}});const r=await gateway.fetch(request('/api/advisor/session',undefined,{Cookie:`__Host-shelv_advisor=${cookie}`}),f.env);assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/synthetic-sensitive-canary/);
});
test('explicit login/upgrade preparation creates a separate flow even with an existing advisor cookie',async()=>{
 const f=setup();const response=await gateway.fetch(request('/api/advisor/session',undefined,{Cookie:`__Host-shelv_advisor=${cookie}`,'X-Shelv-New-Flow':'1'}),f.env);assert.equal(response.status,200);const body=await response.json() as any;assert.equal(body.signedIn,true);assert.equal(body.flow.csrf,'flow-csrf');assert.match(response.headers.get('set-cookie')!,/__Host-shelv_advisor_flow=/);
});
test('callback flow restoration retains an existing pending cookie while returning its CSRF',async()=>{
 const f=setup(),res=await gateway.fetch(request('/api/advisor/session',undefined,{Cookie:`__Host-shelv_advisor=${cookie}; __Host-shelv_advisor_flow=${flow}`,'X-Shelv-Flow':'1'}),f.env);const body=await res.json() as any;assert.equal(body.flow.csrf,'flow-csrf');assert.equal(res.headers.get('set-cookie'),null);
});
test('logout revokes both the active session and pending login flow after CSRF validation',async()=>{
 const f=setup(),res=await gateway.fetch(request('/api/advisor/logout',{}, {Cookie:`__Host-shelv_advisor=${cookie}; __Host-shelv_advisor_flow=${flow}`}),f.env);assert.equal(res.status,200);assert.deepEqual(f.calls.map(x=>x.command.type),['session.logout','flow.retire']);assert.doesNotMatch(res.headers.get('set-cookie')!,/__Host-shelv_advisor_flow/);
});
test('logout metadata resolves only current-cookie CSRF without a queued authorization read or bootstrap',async()=>{
 for(const sid of [false,true]){const f=setup(),res=await gateway.fetch(request('/api/advisor/session',undefined,{Cookie:sid?`__Host-shelv_advisor=${cookie}`:`__Host-shelv_advisor_flow=${flow}`,'X-Shelv-Logout':'1'}),f.env);assert.equal(res.status,200);assert.deepEqual(f.calls.map(x=>x.command.type),[sid?'session.logout-context':'flow.logout-context']);}
});
test('a mismatched Host and user-selected RPC or upstream fields are rejected before binding dispatch',async()=>{
 const f=setup();assert.equal((await gateway.fetch(request('/api/advisor/session',undefined,{Host:'evil.example'}),f.env)).status,403);assert.equal(f.calls.length,0);
 for(const field of ['rpc','rpcName','endpoint','url']){const g=setup(),res=await gateway.fetch(request('/api/advisor/operations',{action:'advisor_list',[field]:'untrusted-target'},{Cookie:`__Host-shelv_advisor=${cookie}`}),g.env);assert.equal(res.status,400);assert.equal(g.calls.length,0);}
});
test('fresh flow restarts the same durable authority, preserving only a validated current cookie',async()=>{
 for(const sid of [undefined,cookie]){const f=setup();const res=await gateway.fetch(request('/api/advisor/session',undefined,{Cookie:`__Host-shelv_advisor_flow=${flow}${sid?`; __Host-shelv_advisor=${sid}`:''}`,'X-Shelv-New-Flow':'1'}),f.env);assert.equal(res.status,200);const restart=f.calls.find(x=>x.command.type==='flow.restart');assert.ok(restart);assert.equal(restart.command.preserveSessionId,sid);assert.match(res.headers.get('set-cookie')!,new RegExp(`__Host-shelv_advisor_flow=${flow};`));assert.equal(f.calls.some(x=>x.command.type==='flow.bootstrap'),false);}
});
test('locked fresh preparation recovers an unusable active cookie without preserving it or changing flow identity',async()=>{
 for(const status of [401,403]){const f=setup(),original=f.env.ADVISOR_SESSIONS.getByName;f.env.ADVISOR_SESSIONS.getByName=(name:string)=>({invoke:async(command:any)=>command.type==='session.view'?{ok:false,error:{status,code:status===401?'session_ended':'forbidden'}}:original(name).invoke(command)});
 const res=await gateway.fetch(request('/api/advisor/session',undefined,{Cookie:`__Host-shelv_advisor=${cookie}; __Host-shelv_advisor_flow=${flow}`,'X-Shelv-New-Flow':'1'}),f.env);assert.equal(res.status,200);assert.equal((await res.json() as any).signedIn,false);assert.match(res.headers.get('set-cookie')!,/Max-Age=0/);assert.equal(f.calls.find(x=>x.command.type==='flow.restart').command.preserveSessionId,undefined);}
});
test('missing active record permits flow-bound logout recovery but wrong active CSRF never falls back',async()=>{
 for(const status of [401,403]){const f=setup();f.env.ADVISOR_SESSIONS.getByName=()=>({invoke:async(command:any)=>{f.calls.push({command});return command.type.startsWith('session.')?{ok:false,error:{status,code:status===401?'session_ended':'csrf_rejected'}}:{ok:true,value:{csrf:'flow-csrf',ended:true}};}});
 const headers={Cookie:`__Host-shelv_advisor=${cookie}; __Host-shelv_advisor_flow=${flow}`,'X-Shelv-CSRF':'flow-csrf'};
 const out=await gateway.fetch(request('/api/advisor/logout',{},headers),f.env);assert.equal(out.status,status===401?200:403);assert.equal(f.calls.some(x=>x.command.type==='flow.cancel'),status===401);}
});
test('saved-preview command is admitted only through operations and invalid selectors never dispatch',async()=>{
 const command={action:'advisor_preview_read_v2',clientId:id,mode:'published',expectedRevision:null};
 const f=setup();assert.equal((await gateway.fetch(request('/api/advisor/operations',command,{Cookie:`__Host-shelv_advisor=${cookie}`}),f.env)).status,200);assert.deepEqual(f.calls.at(-1).command.operation.command,command);
 for(const bad of [{action:command.action,clientId:id,mode:'published'},{...command,expectedRevision:1},{...command,mode:'draft'},{...command,mode:'draft',expectedRevision:-1},{...command,mode:'checkins'},{...command,rpc:'unsafe'}]){const g=setup();assert.equal((await gateway.fetch(request('/api/advisor/operations',bad,{Cookie:`__Host-shelv_advisor=${cookie}`}),g.env)).status,400);assert.equal(g.calls.length,0);}
 const g=setup();assert.equal((await gateway.fetch(request('/api/advisor/payments',command,{Cookie:`__Host-shelv_advisor=${cookie}`}),g.env)).status,403);assert.equal(g.calls.length,0);
});
