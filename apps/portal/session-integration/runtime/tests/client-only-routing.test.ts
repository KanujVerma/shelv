import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import gateway from '../server/gateway';
import {buildCandidate} from '../scripts/build.mjs';
const origin='https://portal.goshelv.com';
const routes=['/api/advisor','/api/advisor/','/api/advisor/session','/api/advisor/auth/request','/api/advisor/auth/complete','/api/advisor/session/upgrade','/api/advisor/logout','/api/advisor/operations','/api/advisor/payments','/api/advisor/checkins','/api/advisor/preview/published?clientId=11111111-1111-4111-8111-111111111111'];
function request(path:string,method='GET') {return new Request(origin+path,{method,headers:{Origin:origin,'Sec-Fetch-Site':'same-origin','CF-Connecting-IP':'192.0.2.1',Cookie:'__Host-shelv_advisor='+ 'a'.repeat(43),'Content-Type':'application/json','X-Shelv-CSRF':'synthetic'},...(['POST','PUT','PATCH'].includes(method)?{body:JSON.stringify({email:'synthetic@example.test',code:'synthetic'})}:{})});}
test('production default denies held advisor APIs before binding, cookie, origin, body or asset dispatch',async()=>{
 let assets=0,bindings=0;const env:any={CLIENT_SHARED_SESSIONS:'true',ADVISOR_SHARED_SESSIONS:'true',ASSETS:{fetch:async()=>{assets++;return new Response('legacy-asset');}}};
 Object.defineProperty(env,'ADVISOR_SESSIONS',{get(){bindings++;throw Error('must not access held binding');}});
 for(const path of routes)for(const method of ['GET','POST','OPTIONS','HEAD']){
  const response=await gateway.fetch(request(path,method),env);assert.equal(response.status,404,path+' '+method);assert.equal(response.headers.get('set-cookie'),null);assert.match(response.headers.get('cache-control')??'',/private, no-store/);
 }
 assert.equal(assets,0);assert.equal(bindings,0);
 for(const path of ['/?workspace=advisor#/advisor','/auth/session.js','/advisor/workspace.js'])assert.equal(await (await gateway.fetch(request(path),env)).text(),'legacy-asset');
 assert.equal(assets,3);assert.equal(bindings,0);
});
test('production package routes only clients and compiled worker independently denies direct advisor calls',async()=>{
 await buildCandidate();assert.deepEqual(JSON.parse(await readFile('dist/pages/_routes.json','utf8')),{version:1,include:['/api/client/*'],exclude:[]});
 let assets=0,outbound=0;
 const mf=new Miniflare({...convertV4MiniflareOptions({cf:false,logRequests:false,workers:[{name:'gateway',modules:true,scriptPath:'dist/pages/_worker.js',compatibilityDate:'2026-10-20',compatibilityFlags:['nodejs_compat'],bindings:{PORTAL_ORIGIN:origin,CLIENT_SHARED_SESSIONS:'true',ADVISOR_SHARED_SESSIONS:'true'},serviceBindings:{ASSETS:async()=>{assets++;return new Response('legacy-asset');}},outboundService:async()=>{outbound++;return new Response('forbidden',{status:500});}}]}),telemetry:{enabled:false}});
 try{
  for(const path of routes){const response=await mf.dispatchFetch(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});assert.equal(response.status,404,path);assert.equal(response.headers.get('set-cookie'),null);}
  assert.equal(assets,0);assert.equal(outbound,0);
  assert.equal(await (await mf.dispatchFetch(origin+'/?workspace=advisor')).text(),'legacy-asset');
 }finally{await mf.dispose();}
});
