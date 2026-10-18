import assert from 'node:assert/strict';
import test from 'node:test';
import fc from 'fast-check';
import {resolveAppReplaySurface, APP_REPLAY_MASK_PROPS} from '../src/presentation/session-replay/policy.ts';
import {createAppReplayController} from '../src/presentation/session-replay/controller.ts';
import {appReplayController} from '../src/services/appReplay.ts';

const verified={activationApproved:true,nativeBuildVerified:true,maskingVerified:true};
function fixture(overrides:Partial<typeof verified>={}){
 const calls:string[]=[],pending:Array<(value:boolean)=>void>=[],permits:Array<()=>boolean>=[];
 const controller=createAppReplayController({...verified,...overrides,driver:{
  start:(_lease,isCurrent)=>{calls.push('start');permits.push(isCurrent);return new Promise<boolean>(resolve=>pending.push(resolve));},
  revoke:()=>{calls.push('revoke');},
 }});
 controller.setContext({surface:'synthetic_fixture',foreground:true});
 return {controller,calls,pending,permits};
}

test('all current customer routes and unknown routes are excluded; only exact generated test route qualifies',()=>{
 for(const path of [[],['(auth)','login'],['(auth)','signup'],['(onboarding)','goals'],['(tabs)','index'],['(tabs)','ask'],['profile','index'],['personalize'],['shop','scan'],['check-in'],['orders'],['insights','SYNTHETIC_ID'],['founder'],['dev','apple-package-extraction'],['dev','replay-test','extra'],['unknown'],['dev/replay-test']])
  assert.equal(resolveAppReplaySurface(path),'excluded');
 assert.equal(resolveAppReplaySurface(['dev','replay-test']),'synthetic_fixture');
 for(const value of [null,undefined,'/dev/replay-test',{},true])assert.equal(resolveAppReplaySurface(value),'excluded');
});

test('the root mask uses a native identifier without grouping or hiding accessible children',()=>{
 assert.equal(APP_REPLAY_MASK_PROPS.testID,'ph-no-capture');
 assert.equal(APP_REPLAY_MASK_PROPS.collapsable,false);
 assert.equal(APP_REPLAY_MASK_PROPS.accessible,false);
 assert.equal('accessibilityLabel' in APP_REPLAY_MASK_PROPS,false);
 assert.equal('accessibilityElementsHidden' in APP_REPLAY_MASK_PROPS,false);
});

test('actual app singleton stays unconditionally off without a native adapter or activation approval',async()=>{
 const initial=appReplayController.getSnapshot();assert.equal(initial.consent,false);assert.equal(initial.recording,false);
 appReplayController.setContext({surface:'synthetic_fixture',foreground:true});
 appReplayController.setConsent(true);assert.equal(await appReplayController.start(),false);
 assert.equal(appReplayController.getSnapshot().recording,false);assert.equal(appReplayController.getSnapshot().canStart,false);
 appReplayController.setConsent(false);appReplayController.setContext({surface:'excluded',foreground:false});
});

test('opt-in is separate from Start, launch-only, and never starts or queues by itself',()=>{
 const {controller,calls}=fixture();calls.length=0;
 assert.equal(controller.getSnapshot().consent,false);
 controller.setConsent(true);assert.deepEqual(calls,[]);assert.equal(controller.getSnapshot().recording,false);
 assert.equal(controller.getSnapshot().canStart,true);
 const other=fixture();assert.equal(other.controller.getSnapshot().consent,false);
});

for(const gate of ['activationApproved','nativeBuildVerified','maskingVerified'] as const){
 test('Start fails closed without '+gate,async()=>{
  const {controller,calls}=fixture({[gate]:false});calls.length=0;controller.setConsent(true);
  assert.equal(await controller.start(),false);assert.equal(calls.includes('start'),false);
 });
}

test('Start requires foreground, approved surface and explicit opt-in independently',async()=>{
 const {controller,calls}=fixture();calls.length=0;
 assert.equal(await controller.start(),false);assert.equal(calls.length,0);
 controller.setConsent(true);controller.setContext({surface:'excluded',foreground:true});
 assert.equal(await controller.start(),false);assert.equal(calls.includes('start'),false);
 controller.setContext({surface:'synthetic_fixture',foreground:false});
 assert.equal(await controller.start(),false);assert.equal(calls.includes('start'),false);
});

test('one explicit Start has one current grant and a repeated Start cannot overlap it',async()=>{
 const {controller,calls,pending,permits}=fixture();calls.length=0;controller.setConsent(true);
 const start=controller.start();assert.equal(permits[0](),true);assert.equal(controller.getSnapshot().status,'starting');
 assert.equal(await controller.start(),false);assert.equal(calls.filter(x=>x==='start').length,1);
 pending[0](true);assert.equal(await start,true);assert.equal(controller.getSnapshot().recording,true);
 controller.stop();assert.equal(permits[0](),false);assert.equal(controller.getSnapshot().recording,false);
});

for(const trigger of ['consent','background','route','owner','dispose'] as const){
 test(trigger+' synchronously revokes a pending grant; late completion cannot restart',async()=>{
  const {controller,calls,pending,permits}=fixture();controller.setOwner('SYNTHETIC_OWNER');controller.setConsent(true);calls.length=0;
  const start=controller.start();assert.equal(permits[0](),true);
  if(trigger==='consent')controller.setConsent(false);
  if(trigger==='background')controller.setContext({surface:'synthetic_fixture',foreground:false});
  if(trigger==='route')controller.setContext({surface:'excluded',foreground:true});
  if(trigger==='owner')controller.setOwner('SYNTHETIC_OTHER_OWNER');
  if(trigger==='dispose')controller.dispose();
  assert.equal(permits[0](),false);assert.equal(calls.at(-1),'revoke');
  assert.equal(await controller.start(),false);
  pending[0](true);assert.equal(await start,false);assert.equal(controller.getSnapshot().recording,false);
  controller.setContext({surface:'synthetic_fixture',foreground:true});assert.equal(controller.getSnapshot().recording,false);
  assert.equal(calls.filter(x=>x==='start').length,1);
 });
}

test('return from exclusion and foreground never restore recording, while unchanged context does not interrupt',async()=>{
 const {controller,calls,pending,permits}=fixture();controller.setConsent(true);const first=controller.start();pending[0](true);await first;
 controller.setContext({surface:'synthetic_fixture',foreground:true});assert.equal(permits[0](),true);
 controller.setContext({surface:'excluded',foreground:true});assert.equal(permits[0](),false);
 controller.setContext({surface:'synthetic_fixture',foreground:true});assert.equal(controller.getSnapshot().recording,false);
 assert.equal(calls.filter(x=>x==='start').length,1);
 const second=controller.start();pending[1](true);await second;assert.equal(controller.getSnapshot().recording,true);
 controller.setContext({surface:'synthetic_fixture',foreground:false});controller.setContext({surface:'synthetic_fixture',foreground:true});
 assert.equal(controller.getSnapshot().recording,false);assert.equal(calls.filter(x=>x==='start').length,2);
});

test('owner change clears opt-in and never exposes owner or route values in public state',()=>{
 const {controller}=fixture();controller.setOwner('SYNTHETIC_PRIVATE_OWNER');controller.setConsent(true);
 controller.setOwner('SYNTHETIC_DIFFERENT_OWNER');assert.equal(controller.getSnapshot().consent,false);
 assert.equal(JSON.stringify(controller.getSnapshot()).includes('SYNTHETIC_'),false);
});

test('driver failures are bounded and do not expose private exception text',async()=>{
 const controller=createAppReplayController({...verified,driver:{start:async()=>{throw Error('SYNTHETIC_PRIVATE_EXCEPTION');},revoke(){}}});
 controller.setContext({surface:'synthetic_fixture',foreground:true});controller.setConsent(true);
 assert.equal(await controller.start(),false);assert.equal(controller.getSnapshot().recording,false);
 assert.equal(JSON.stringify(controller.getSnapshot()).includes('SYNTHETIC_PRIVATE_EXCEPTION'),false);
});

test('failed Stop closes grants and latches the controller unavailable',async()=>{
 let current:()=>boolean=()=>false;
 const controller=createAppReplayController({...verified,driver:{start:async(_lease,permit)=>{current=permit;return true;},revoke(){throw Error('SYNTHETIC_PRIVATE_STOP');}}});
 controller.setContext({surface:'synthetic_fixture',foreground:true});controller.setConsent(true);
 // Even the initial context reconciliation must fail closed if revocation cannot be assured.
 assert.equal(await controller.start(),false);assert.equal(current(),false);assert.equal(controller.getSnapshot().canStart,false);
 assert.equal(controller.getSnapshot().reason,'recorder_stop_failed');
});

test('subscriber failures cannot prevent revocation or other updates',async()=>{
 const {controller,pending,permits}=fixture();controller.subscribe(()=>{throw Error('listener');});
 controller.setConsent(true);const start=controller.start();pending[0](true);await start;
 controller.stop();assert.equal(permits[0](),false);assert.equal(controller.getSnapshot().recording,false);
});


test('Stop reports no current Start even while a revoked native promise is still pending',async()=>{
 const {controller,pending}=fixture();controller.setConsent(true);const start=controller.start();
 controller.stop();assert.equal(controller.getSnapshot().status,'off');assert.equal(controller.getSnapshot().canStart,false);
 pending[0](true);assert.equal(await start,false);assert.equal(controller.getSnapshot().status,'off');
});

test('generated lifecycle sequences never resurrect a revoked lease or implicitly call Start',async()=>{
 const command=fc.constantFrom('consent_on','consent_off','start','stop','exclude','fixture','background','foreground','owner','resolve','reject');
 await fc.assert(fc.asyncProperty(fc.array(command,{minLength:1,maxLength:80}),async(commands)=>{
  const {controller,calls,pending,permits}=fixture();
  const starts:Promise<boolean>[]=[],retired:Array<()=>boolean>=[];
  let resolved=0,owner=0,surface:'synthetic_fixture'|'excluded'='synthetic_fixture',foreground=true;
  for(const command of commands){
   const startCount=calls.filter(x=>x==='start').length;
   if(command==='consent_on')controller.setConsent(true);
   if(command==='consent_off')controller.setConsent(false);
   if(command==='start')starts.push(controller.start());
   if(command==='stop')controller.stop();
   if(command==='owner')controller.setOwner('SYNTHETIC_'+(++owner));
   if(command==='exclude'){surface='excluded';controller.setContext({surface,foreground});}
   if(command==='fixture'){surface='synthetic_fixture';controller.setContext({surface,foreground});}
   if(command==='background'){foreground=false;controller.setContext({surface,foreground});}
   if(command==='foreground'){foreground=true;controller.setContext({surface,foreground});}
   if(['consent_off','stop','owner'].includes(command)||(command==='exclude')||(command==='background'))retired.push(...permits);
   if((command==='resolve'||command==='reject')&&resolved<pending.length)pending[resolved++](command==='resolve');
   await Promise.resolve();await Promise.resolve();
   assert.ok(retired.every(permit=>!permit()),'a revoked lease became valid again');
   assert.ok(permits.filter(permit=>permit()).length<=1,'overlapping grants');
   if(command!=='start')assert.equal(calls.filter(x=>x==='start').length,startCount,'implicit Start');
   const snapshot=controller.getSnapshot();
   if(!snapshot.consent||surface==='excluded'||!foreground)assert.equal(snapshot.recording,false);
  }
  controller.dispose();for(let i=resolved;i<pending.length;i++)pending[i](false);await Promise.all(starts);
  assert.ok(permits.every(permit=>!permit()));assert.equal(controller.getSnapshot().recording,false);
 }),{numRuns:250,seed:20261018});
});
