import assert from 'node:assert/strict';
import test from 'node:test';
import {spawnSync} from 'node:child_process';
test('payment entrypoint fails closed without configuration then uses shared permanent bearer verification',()=>{
 const entry=new URL('../supabase/functions/concierge-payments/index.ts',import.meta.url).href;
 const script=`const config={},paths=[];let serve;globalThis.Deno={env:{get(name){return config[name]}},serve(fn){serve=fn}};
 globalThis.fetch=async(url,options)=>{paths.push(new URL(url).pathname);if(new Headers(options.headers).get('authorization')!=='Bearer synthetic-user')throw Error('wrong bearer');if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'00000000-0000-4000-8000-000000000001',is_anonymous:false});return Response.json({revision:0,quotes:[],claims:[],service:{status:'unpaid',period:null},nextServicePeriod:null,shippingAddress:null,shippingAddresses:[]});};
 await import(${JSON.stringify(entry)});const req=()=>new Request('https://edge.invalid',{method:'POST',headers:{authorization:'Bearer synthetic-user','content-type':'application/json'},body:'{"action":"client_read"}'});
 const closed=await serve(req());config.SUPABASE_URL='https://synthetic.invalid';config.SUPABASE_ANON_KEY='synthetic-public';const opened=await serve(req());process.stdout.write(JSON.stringify({closed:closed.status,opened:opened.status,body:await opened.json(),paths}));`;
 const result=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','--eval',script],{encoding:'utf8',env:{NODE_ENV:'test',NODE_NO_WARNINGS:'1'}});
 assert.equal(result.status,0,result.stderr);const output=JSON.parse(result.stdout);assert.equal(output.closed,503);assert.equal(output.opened,200);assert.equal(output.body.recipient.method,'zelle');assert.deepEqual(output.paths,['/auth/v1/user','/rest/v1/rpc/concierge_payment_view']);
});
