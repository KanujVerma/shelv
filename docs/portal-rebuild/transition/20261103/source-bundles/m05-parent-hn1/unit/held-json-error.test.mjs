import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import test from 'node:test';
const file=process.env.M05_OBSERVER_SOURCE??new URL('../source/page-observer.mjs',import.meta.url),source=fs.readFileSync(file,'utf8');
function slot({retired=false,ownReceiver=true,mode='consumer',target=true,badMetadata=false}={}){
 let release;const gate=new Promise(resolve=>release=resolve),records=[],errors=[];
 const c=vm.createContext({retired,ownReceiver,target,arg:{mode},gate,hold:false,records,errors,localFlightLabel:'native-slot-flight',localJsonLabel:'native-slot-json',requestSha256:'a'.repeat(64),report:record=>{if(badMetadata)throw Error('METADATA_DENIAL');records.push(record);},response:Object.defineProperty({},'status',{get(){throw Error('NO_HTTP_OR_RESPONSE_FACADE');}})});
 let callback;
 if(source.includes('async function settleJson(rejected,result)')){const start=source.indexOf('async function settleJson(rejected,result)'),end=source.indexOf('\n        let read;',start);assert.ok(end>start);vm.runInContext(source.slice(start,end),c);callback=e=>c.settleJson(true,e);}
 else{const match=source.match(/\},(error=>\{report\(\{type:'native-json-rejected'[\s\S]*?throw error;\})\)\);/);assert.ok(match,'exact OLD native rejection callback');callback=vm.runInContext('('+match[1]+')',c);}
 return {c,records,errors,release,callback};
}
test('selected native JSON rejection stays pending until the actual release gate',async()=>{
 const s=slot(),error=Error('native rejection data only');let outcome='pending',observed;const p=Promise.reject(error).catch(s.callback).then(()=>outcome='fulfilled',e=>{outcome='rejected';observed=e;});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(outcome,'pending');assert.equal(s.c.hold,true);s.release();await p;assert.equal(outcome,'rejected');assert.equal(observed,error);
});
test('observer failure does not replace the selected error or skip its gate',async()=>{
 const s=slot({badMetadata:true}),error=Error('original native rejection');let outcome='pending',observed;const p=Promise.reject(error).catch(s.callback).then(()=>outcome='fulfilled',e=>{outcome='rejected';observed=e;});
 try{await new Promise(resolve=>setImmediate(resolve));assert.equal(outcome,'pending');assert.equal(s.c.hold,true);}finally{s.release();}await p;assert.equal(observed,error);assert.ok(s.errors.length);
});
for(const [label,options]of [['already retired',{retired:true}],['foreign receiver',{ownReceiver:false}],['unselected request',{target:false}],['byte delay mode',{mode:'bytes'}]])test(label+' preserves immediate identical native rejection without holding',async()=>{
 const s=slot(options),error=Error('native refusal');await assert.rejects(Promise.reject(error).catch(s.callback),e=>e===error);assert.equal(s.c.hold,false);s.release();
});
test('selected native data identity is retained across gate even when status metadata fails',async()=>{
 const s=slot(),value={nativePromiseSlotData:true};assert.equal(typeof s.c.settleJson,'function');let settled=false;const p=s.c.settleJson(false,value).then(v=>{settled=true;return v;});try{await new Promise(resolve=>setImmediate(resolve));assert.equal(settled,false);assert.equal(s.c.hold,true);}finally{s.release();}assert.equal(await p,value);assert.ok(s.errors.length);
});
