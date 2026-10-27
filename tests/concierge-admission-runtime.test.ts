import assert from 'node:assert/strict';
import test from 'node:test';
const implementation=await import('../supabase/functions/concierge-admission/runtime.ts').catch(()=>null);
const id='10000000-0000-4000-8000-000000000001',requestId='10000000-0000-4000-8000-000000000002';
test('admission transport keeps administrative authority server-only and uses no invitation API',async()=>{
 assert.ok(implementation,'Native admission transport exists');const calls:{url:string;headers:Headers;body:unknown}[]=[];
 const ports=implementation.createAdmissionPorts({supabaseUrl:'https://project.invalid',publicKey:'public-key',serviceKey:'server-only-key',allowedOrigins:['https://portal.goshelv.com'],fetch:async(input,init)=>{
  const url=new URL(String(input));assert.equal(url.origin,'https://project.invalid');assert.equal(init?.redirect,'error');assert.equal(init?.credentials,'omit');
  const headers=new Headers(init?.headers),body=init?.body?JSON.parse(String(init.body)):null;calls.push({url:url.pathname,headers,body});
  if(url.pathname==='/auth/v1/admin/users')return Response.json({id,email:'client@example.com',is_anonymous:false});
  if(url.pathname.endsWith('/'+id))return Response.json({id,email:'client@example.com',is_anonymous:false});
  if(url.pathname==='/auth/v1/user')return Response.json({id,is_anonymous:false});
  return Response.json({canAddClient:true});
 }});
 await ports.authenticate('caller-jwt');await ports.rpc('caller-jwt','concierge_admission_capabilities',{});await ports.getIdentity(id);await ports.createIdentity(id,'client@example.com');await ports.finish(id,requestId);
 assert.ok(calls.slice(0,2).every(c=>c.headers.get('authorization')==='Bearer caller-jwt'&&c.headers.get('apikey')==='public-key'));
 assert.ok(calls.slice(2).every(c=>c.headers.get('authorization')==='Bearer server-only-key'&&c.headers.get('apikey')==='server-only-key'));
 assert.deepEqual(calls[3].body,{id,email:'client@example.com',email_confirm:false});
 assert.ok(!calls.some(c=>/invite|otp|generate_link/.test(c.url)));assert.equal(calls[4].url,'/rest/v1/rpc/concierge_admission_finish');
});
test('administrative failure bodies cannot escape through errors',async()=>{
 assert.ok(implementation);const ports=implementation.createAdmissionPorts({supabaseUrl:'https://project.invalid',publicKey:'public',serviceKey:'server',allowedOrigins:[],fetch:async()=>Response.json({message:'PRIVATE_CANARY'}, {status:500})});
 await assert.rejects(()=>ports.createIdentity(id,'client@example.com'),/^Error: unavailable$/);
});
