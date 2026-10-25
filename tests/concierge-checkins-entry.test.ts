import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
test('actual Edge entry registers and uses shared public bearer RPC transport without exposing Storage credential', () => {
  const entry = new URL('../supabase/functions/concierge-checkins/index.ts', import.meta.url).href;
  const script = `
    let handler; const config={}, paths=[];
    globalThis.Deno={env:{get:key=>config[key]},serve:callback=>{handler=callback;}};
    globalThis.fetch=async(url,init)=>{
      const path=new URL(url).pathname;paths.push(path);
      if(new Headers(init.headers).get('authorization')!=='Bearer synthetic-token')throw Error('Wrong bearer');
      if(new Headers(init.headers).get('apikey')!=='synthetic-public')throw Error('Wrong key');
      if(path==='/auth/v1/user')return Response.json({id:'ae000000-0000-4000-8000-000000000001',is_anonymous:false});
      if(path==='/rest/v1/rpc/concierge_checkin_read')return Response.json({revision:0,nextCheckinOn:null,reports:[],meetingNotes:['PRIVATE_CANARY']});
      throw Error('Unexpected network path');
    };
    await import(${JSON.stringify(entry)});
    const request=()=>new Request('https://edge.test/concierge-checkins',{method:'POST',headers:{authorization:'Bearer synthetic-token','content-type':'application/json'},body:'{"action":"client_read"}'});
    const missing=await handler(request());
    Object.assign(config,{SUPABASE_URL:'https://synthetic.supabase.test',SUPABASE_ANON_KEY:'synthetic-public',SUPABASE_SERVICE_ROLE_KEY:'STORAGE_ONLY_CANARY'});
    const response=await handler(request());process.stdout.write(JSON.stringify({missing:missing.status,status:response.status,body:await response.json(),paths}));
  `;
  const child=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','--eval',script],{encoding:'utf8',env:{NODE_ENV:'test',NODE_NO_WARNINGS:'1'}});
  assert.equal(child.status,0,child.stderr);
  const result=JSON.parse(child.stdout);
  assert.deepEqual(result,{missing:503,status:200,body:{revision:0,nextCheckinOn:null,reports:[]},paths:['/auth/v1/user','/rest/v1/rpc/concierge_checkin_read']});
  assert.doesNotMatch(child.stdout,/PRIVATE_CANARY|STORAGE_ONLY_CANARY/);
});
