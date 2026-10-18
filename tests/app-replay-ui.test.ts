import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import ts from 'typescript';
import {componentHarness,control,textContent} from './ux-profile-render.ts';
import {createAppReplayController} from '../src/presentation/session-replay/controller.ts';

function ready(){
 const calls:string[]=[],pending:Array<(v:boolean)=>void>=[],permits:Array<()=>boolean>=[];
 const controller=createAppReplayController({activationApproved:true,nativeBuildVerified:true,maskingVerified:true,driver:{
  start:(_lease,isCurrent)=>{calls.push('start');permits.push(isCurrent);return new Promise<boolean>(resolve=>pending.push(resolve));},revoke:()=>{calls.push('revoke');},
 }});
 controller.setContext({surface:'synthetic_fixture',foreground:true});return {controller,calls,pending,permits};
}

test('actual root wraps every loading, error, auth and content branch in the shared privacy boundary',()=>{
 const path=new URL('../app/_layout.tsx',import.meta.url),source=readFileSync(path,'utf8');
 const tree=ts.createSourceFile(String(path),source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const root=tree.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='RootLayout');
 assert.ok(root&&ts.isFunctionDeclaration(root));
 const returned=root.body!.statements.find(ts.isReturnStatement)?.expression;
 assert.ok(returned&&ts.isJsxElement(returned));assert.equal(returned.openingElement.tagName.getText(tree),'AppReplayPrivacyBoundary');
 assert.ok(returned.children.some(child=>ts.isJsxSelfClosingElement(child)&&child.tagName.getText(tree)==='RootLayoutContent'));
});

test('shared root mask preserves synthetic content without starting replay; route, blur and logout revoke',async()=>{
 const {controller,calls,pending,permits}=ready();
 let segments=['dev','replay-test'],owner:string|null='SYNTHETIC_OWNER';
 const events=new Map<string,(value:string)=>void>();
 const appState={currentState:'active',addEventListener:(event:string,listener:(value:string)=>void)=>{events.set(event,listener);return {remove:()=>events.delete(event)};}};
 const h=componentHarness('src/components/privacy/AppReplayPrivacyBoundary.tsx','AppReplayPrivacyBoundary',{
  controller,children:createElement('Text',{},'SYNTHETIC_PRIVATE_CANARY'),
 },{effects:true,modules:{
  'expo-router':{useSegments:()=>segments},
  '@/src/stores/authStore':{useAuthStore:(select:(state:unknown)=>unknown)=>select({status:owner?'SIGNED_IN':'SIGNED_OUT',sessionUserId:owner})},
  'react-native':{Platform:{OS:'android'},AppState:appState,View:'View',StyleSheet:{create:(v:unknown)=>v}},
 }});
 let nodes=h.render();const mask=nodes.find(n=>n.type==='View')!;
 assert.equal(mask.props.testID,'ph-no-capture');assert.equal(mask.props.collapsable,false);assert.equal(mask.props.accessible,false);
 assert.equal(textContent(nodes),'SYNTHETIC_PRIVATE_CANARY');assert.equal(calls.includes('start'),false);
 controller.setConsent(true);const first=controller.start();pending[0](true);await first;
 events.get('blur')!('');assert.equal(permits[0](),false);assert.equal(controller.getSnapshot().recording,false);
 events.get('change')!('active');assert.equal(controller.getSnapshot().recording,false);
 controller.setConsent(true);const next=controller.start();pending[1](true);await next;
 segments=['(auth)','login'];nodes=h.render();assert.equal(permits[1](),false);assert.equal(controller.getSnapshot().canStart,false);
 segments=['dev','replay-test'];h.render();assert.equal(controller.getSnapshot().recording,false);
 controller.setConsent(true);owner=null;h.render();assert.equal(controller.getSnapshot().consent,false);
 h.dispose();assert.equal(events.size,0);assert.equal(controller.getSnapshot().recording,false);
});

test('developer controls use real separate consent, explicit Start and Stop, without auto-start on mount',async()=>{
 const {controller,calls,pending,permits}=ready();calls.length=0;
 const h=componentHarness('src/components/privacy/AppReplayControls.tsx','AppReplayControls',{controller}, {modules:{
  'react-native':{View:'View',Text:'Text',Switch:'Switch',Pressable:'Pressable',StyleSheet:{create:(v:unknown)=>v}},
 }});
 let nodes=h.render();assert.deepEqual(calls,[]);
 const consent=control(nodes,'Allow this replay test for this launch');assert.equal(consent.props.value,false);
 assert.equal(control(nodes,'Start app replay test').props.disabled,true);
 consent.props.onValueChange(true);nodes=h.render();assert.equal(controller.getSnapshot().consent,true);assert.deepEqual(calls,[]);
 assert.equal(control(nodes,'Start app replay test').props.disabled,false);
 control(nodes,'Start app replay test').props.onPress();nodes=h.render();assert.equal(control(nodes,'Start app replay test').props.disabled,true);
 pending[0](true);await Promise.resolve();await Promise.resolve();assert.equal(controller.getSnapshot().recording,true);
 control(nodes,'Stop app replay').props.onPress();assert.equal(permits[0](),false);assert.equal(controller.getSnapshot().recording,false);
 nodes=h.render();control(nodes,'Allow this replay test for this launch').props.onValueChange(false);
 assert.equal(controller.getSnapshot().consent,false);assert.equal(controller.getSnapshot().recording,false);h.dispose();
});

test('actual developer controls disclose unavailable native acceptance and cannot enable recording',async()=>{
 const h=componentHarness('src/components/privacy/AppReplayControls.tsx','AppReplayControls',{}, {modules:{
  'react-native':{View:'View',Text:'Text',Switch:'Switch',Pressable:'Pressable',StyleSheet:{create:(v:unknown)=>v}},
 }});
 const nodes=h.render();assert.equal(control(nodes,'Start app replay test').props.disabled,true);
 assert.equal(control(nodes,'Allow this replay test for this launch').props.disabled,true);
 assert.ok(textContent(nodes).includes('Actual app recording is unavailable'));
 // Invoke even the disabled handler: service-level gates must still deny.
 control(nodes,'Start app replay test').props.onPress();await Promise.resolve();h.dispose();
});


test('developer controls never claim confirmed off after a native Stop failure',()=>{
 const controller=createAppReplayController({activationApproved:true,nativeBuildVerified:true,maskingVerified:true,driver:{
  start:async()=>true,revoke(){throw Error('SYNTHETIC_STOP_FAILURE');},
 }});
 controller.setContext({surface:'synthetic_fixture',foreground:true});
 const h=componentHarness('src/components/privacy/AppReplayControls.tsx','AppReplayControls',{controller},{modules:{
  'react-native':{View:'View',Text:'Text',Switch:'Switch',Pressable:'Pressable',StyleSheet:{create:(v:unknown)=>v}},
 }});
 const text=textContent(h.render());assert.ok(text.includes('Recorder stop could not be confirmed'));
 assert.equal(text.includes('Actual app recording is off'),false);h.dispose();
});


test('explicit local native mode retains the RN root, prepares only on Start and mirrors native revocation',async()=>{
 const previousInternal=process.env.EXPO_PUBLIC_INTERNAL_REPLAY_TEST_ENABLED,previousLocal=process.env.EXPO_PUBLIC_INTERNAL_APP_REPLAY_LOCAL_ENABLED;
 process.env.EXPO_PUBLIC_INTERNAL_REPLAY_TEST_ENABLED='true';process.env.EXPO_PUBLIC_INTERNAL_APP_REPLAY_LOCAL_ENABLED='true';
 try{
  const calls:string[]=[],events=new Map<string,(event:{nonce:string})=>void>();
  const h=componentHarness('tests/fixtures/app-replay-local-probe.tsx','LocalReplayProbe',{}, {effects:true,modules:{
   '../config/environment':{publicEnvironment:{buildFlavor:'development',useRemoteService:false}},
   'expo-router':{useSegments:()=>['dev','replay-test']},
   '@/src/stores/authStore':{useAuthStore:(select:(v:unknown)=>unknown)=>select({status:'SIGNED_OUT',sessionUserId:null})},
   '../../modules/internal-replay':{internalReplayNative:{actualAppAvailability:()=> 'local_only_v1',
    actualAppPrepare:async()=>{calls.push('prepare');return '00000000-0000-4000-8000-000000000001';},
    actualAppStart:async()=>{calls.push('start');return true;},actualAppRevoke:()=>{calls.push('revoke');},actualAppFlush:()=>{calls.push('flush');},
    addListener:(event:string,listener:(event:{nonce:string})=>void)=>{events.set(event,listener);return{remove:()=>events.delete(event)};},
   }},
   'expo-modules-core':{requireNativeViewManager:()=> 'NativeReplaySurface'},
   'react-native':{Platform:{OS:'ios'},View:'View',Text:'Text',Switch:'Switch',Pressable:'Pressable',StyleSheet:{create:(v:unknown)=>v},AppState:{currentState:'active',addEventListener:()=>({remove(){}})}},
  }});
  let nodes=h.render();assert.ok(nodes.some(n=>n.type==='NativeReplaySurface'&&n.props.synthetic===true));
  assert.equal(nodes.find(n=>n.type==='NativeReplaySurface')!.props.testID,'ph-no-capture');
  assert.equal(calls.includes('prepare'),false);assert.equal(calls.includes('start'),false);
  control(nodes,'Allow this replay test for this launch').props.onValueChange(true);nodes=h.render();
  control(nodes,'Start app replay test').props.onPress();for(let i=0;i<6;i++)await Promise.resolve();
  nodes=h.render();assert.ok(textContent(nodes).includes('Recording synthetic test'));assert.equal(calls.filter(v=>v==='start').length,1);
  events.get('actualAppReplayStopped')!({nonce:'SYNTHETIC_OLD_RUN'});nodes=h.render();assert.ok(textContent(nodes).includes('Recording synthetic test'));
  events.get('actualAppReplayStopped')!({nonce:'00000000-0000-4000-8000-000000000001'});nodes=h.render();assert.ok(textContent(nodes).includes('Actual app recording is off'));
  assert.equal(calls.filter(v=>v==='start').length,1);h.dispose();assert.equal(events.size,0);
 }finally{
  if(previousInternal===undefined)delete process.env.EXPO_PUBLIC_INTERNAL_REPLAY_TEST_ENABLED;else process.env.EXPO_PUBLIC_INTERNAL_REPLAY_TEST_ENABLED=previousInternal;
  if(previousLocal===undefined)delete process.env.EXPO_PUBLIC_INTERNAL_APP_REPLAY_LOCAL_ENABLED;else process.env.EXPO_PUBLIC_INTERNAL_APP_REPLAY_LOCAL_ENABLED=previousLocal;
 }
});


test('iOS subscribes only to supported AppState change events and still revokes in background',async()=>{
 const {controller,pending,permits}=ready();
 const events=new Map<string,(value:string)=>void>();
 const h=componentHarness('src/components/privacy/AppReplayPrivacyBoundary.tsx','AppReplayPrivacyBoundary',{controller,children:null},{effects:true,modules:{
  'expo-router':{useSegments:()=>['dev','replay-test']},
  '@/src/stores/authStore':{useAuthStore:(select:(v:unknown)=>unknown)=>select({status:'SIGNED_OUT',sessionUserId:null})},
  'react-native':{Platform:{OS:'ios'},View:'View',StyleSheet:{create:(v:unknown)=>v},AppState:{currentState:'active',
   addEventListener:(event:string,listener:(value:string)=>void)=>{assert.equal(event,'change','iOS does not support Android focus/blur native events');events.set(event,listener);return{remove:()=>events.delete(event)};}}},
 }});
 h.render();controller.setConsent(true);const started=controller.start();pending[0](true);await started;
 events.get('change')!('background');assert.equal(permits[0](),false);assert.equal(controller.getSnapshot().recording,false);
 events.get('change')!('active');assert.equal(controller.getSnapshot().recording,false);h.dispose();assert.equal(events.size,0);
});


test('disabled builds preserve the original root children without adding a layout host',()=>{
 const controller=createAppReplayController({activationApproved:false,nativeBuildVerified:false,maskingVerified:false,driver:null});
 const h=componentHarness('src/components/privacy/AppReplayPrivacyBoundary.tsx','AppReplayPrivacyBoundary',{
  children:createElement('OriginalRootChild',{value:'SYNTHETIC_CHILD'}),
 },{modules:{
  '../../services/localAppReplay':{getLocalAppReplayRuntime:()=>({kind:'off',controller,Surface:null,subscribeStopped:()=>()=>{}})},
  'expo-router':{useSegments:()=>['(auth)','login']},
  '@/src/stores/authStore':{useAuthStore:(select:(state:unknown)=>unknown)=>select({status:'SIGNED_OUT',sessionUserId:null})},
  'react-native':{Platform:{OS:'web'},AppState:{currentState:'active'},View:'View',StyleSheet:{create:(v:unknown)=>v}},
 }});
 const hosts=h.render().filter(n=>typeof n.type==='string');
 assert.deepEqual(hosts.map(n=>n.type),['OriginalRootChild']);
 assert.equal(hosts[0].props.value,'SYNTHETIC_CHILD');h.dispose();
});
