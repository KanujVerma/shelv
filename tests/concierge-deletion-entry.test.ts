import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

test('actual account-deletion handler cleans private concierge bytes before Auth and preserves identity on failure',()=>{
  for(const failure of [false,true]){
    const directory=mkdtempSync(join(tmpdir(),'concierge-delete-'));
    try{
      const cleanup=new URL('../supabase/functions/concierge-operations/private-storage-cleanup.ts',import.meta.url).href;
      const source=readFileSync(new URL('../supabase/functions/delete-customer-account/index.ts',import.meta.url),'utf8')
        .replace('import "jsr:@supabase/functions-js/edge-runtime.d.ts";','')
        .replace(/import \{ createClient(?:, type SupabaseClient)? \} from "npm:@supabase\/supabase-js@2\.39\.8";/,'const createClient = globalThis.__createClient;')
        .replace('"../concierge-operations/private-storage-cleanup.ts"',JSON.stringify(cleanup));
      writeFileSync(join(directory,'entry.ts'),source);
      writeFileSync(join(directory,'runner.mjs'),`
const owner='00000000-0000-4000-8000-000000000001',events=[];let handler,created=0;
const files=new Map(['concierge-payment-evidence','concierge-checkin-photos'].map(b=>[b,new Set([owner+'/opaque.png'])]));
const admin={rpc:async()=>{events.push('fence');return{data:true,error:null}},from:()=>({select:()=>({eq:async()=>({data:[],error:null})})}),storage:{from:bucket=>({
 list:async prefix=>{events.push('list:'+bucket);return{error:${failure}&&bucket==='concierge-checkin-photos'?{}:null,data:[...(files.get(bucket)||[])].filter(p=>p.startsWith(prefix+'/')).map(p=>({name:p.slice(prefix.length+1),id:'synthetic'}))}},
 remove:async paths=>{events.push('remove:'+bucket);for(const p of paths)files.get(bucket)?.delete(p);return{error:null}}
})},auth:{admin:{deleteUser:async()=>{events.push('deleteAuth');return{error:null}}}}};
globalThis.__createClient=()=>++created===1?{auth:{getUser:async()=>({data:{user:{id:owner}},error:null})}}:admin;
globalThis.Deno={env:{get:()=> 'synthetic-config'},serve:f=>{handler=f}};
console.error=()=>{};
await import(${JSON.stringify(pathToFileURL(join(directory,'entry.ts')).href)});
const response=await handler(new Request('https://fixture.invalid',{method:'POST',headers:{Authorization:'Bearer synthetic','content-type':'application/json'},body:JSON.stringify({confirmation:'DELETE_MY_DERIVE_ACCOUNT'})}));
process.stdout.write(JSON.stringify({status:response.status,body:await response.json(),events,remaining:[...files.values()].reduce((n,s)=>n+s.size,0)}));
`);
      const child=spawnSync(process.execPath,['--experimental-strip-types',join(directory,'runner.mjs')],{encoding:'utf8',env:{NODE_ENV:'test',NODE_NO_WARNINGS:'1'},timeout:10000});
      assert.equal(child.status,0,child.stderr);
      const result=JSON.parse(child.stdout);
      assert.equal(result.events[0],'fence');
      if(failure){assert.equal(result.status,500);assert.equal(result.events.includes('deleteAuth'),false);}
      else{
        assert.equal(result.status,200);assert.deepEqual(result.body,{deleted:true});assert.equal(result.remaining,0);
        assert.equal(result.events.at(-1),'deleteAuth');
        for(const bucket of ['concierge-payment-evidence','concierge-checkin-photos']) assert.equal(result.events.filter((e:string)=>e==='list:'+bucket).length,2);
      }
    }finally{rmSync(directory,{recursive:true,force:true});}
  }
});
