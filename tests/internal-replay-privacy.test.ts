import assert from 'node:assert/strict';
import test from 'node:test';
import {resolveInternalReplayConfig} from '../src/presentation/internal-replay/config.ts';
const internal={developmentRuntime:true,buildFlavor:'development',remoteEnabled:false,platform:'ios',enabled:'true'};
test('replay is unavailable without every independent development guard',()=>{
 for(const changed of [{developmentRuntime:false},{buildFlavor:'production'},{buildFlavor:'remote-staging'},{remoteEnabled:true},{platform:'web'},{platform:'android'},{enabled:undefined},{enabled:'false'}])
  assert.equal(resolveInternalReplayConfig({...internal,...changed}).available,false);
});
test('internal probe is explicit, synthetic and carries no live credentials',()=>{
 const value=resolveInternalReplayConfig(internal);
 assert.equal(value.available,true);assert.equal(value.live,null);
 assert.equal('projectToken' in value,false);assert.equal('autoStart' in value,false);
});
test('live mode accepts only the supplied existing public token and exact ingestion origin',()=>{
 const token='phc_SYNTHETIC_CONFIGURATION_SHAPE_ONLY';
 assert.deepEqual(resolveInternalReplayConfig({...internal,host:'https://us.i.posthog.com',projectToken:token}).live,{host:'https://us.i.posthog.com',projectToken:token});
 for(const host of ['http://us.i.posthog.com','https://us.i.posthog.com/','https://evil.invalid','https://us.i.posthog.com.evil.invalid','https://eu.i.posthog.com/private'])
  assert.equal(resolveInternalReplayConfig({...internal,host,projectToken:token}).live,null);
 for(const projectToken of ['','phx_private','secret','phc_has space'])
  assert.equal(resolveInternalReplayConfig({...internal,host:'https://us.i.posthog.com',projectToken}).live,null);
 assert.equal(resolveInternalReplayConfig({...internal,developmentRuntime:false,host:'https://us.i.posthog.com',projectToken:token}).live,null);
});

test('the actual internal screen renders off without opening or starting native replay',async()=>{
 const {componentHarness,textContent}=await import('./ux-profile-render.ts');
 const previous=process.env.EXPO_PUBLIC_INTERNAL_REPLAY_TEST_ENABLED;
 process.env.EXPO_PUBLIC_INTERNAL_REPLAY_TEST_ENABLED='true';
 try{
  const calls:unknown[]=[];
  const h=componentHarness('app/dev/replay-test.tsx','default',{}, {developmentRuntime:true,modules:{
   '../../src/config/environment':{publicEnvironment:{buildFlavor:'development',useRemoteService:false}},
   '../../modules/internal-replay':{internalReplayNative:{availability:()=> 'available',open:async(...args:unknown[])=>{calls.push(args);return 'opened';}}},
   'react-native':{Platform:{OS:'ios'},View:'View',Text:'Text',Pressable:'Pressable',StyleSheet:{create:(x:unknown)=>x}},
   'expo-router':{Redirect:'Redirect',useRouter:()=>({back(){}})},
  }});
  const nodes=h.render();assert.deepEqual(calls,[]);assert.ok(textContent(nodes).includes('Recording is off'));
  const buttons=nodes.filter(n=>n.type==='Pressable');
  const local=buttons.find(n=>n.props.children?.props?.children==='Open local recorder probe')!;
  const live=buttons.find(n=>n.props.children?.props?.children==='Open PostHog dummy test')!;
  assert.ok(local);assert.equal(live.props.disabled,true);local.props.onPress();await Promise.resolve();assert.deepEqual(calls,[['local','','']]);h.dispose();
 }finally{if(previous===undefined)delete process.env.EXPO_PUBLIC_INTERNAL_REPLAY_TEST_ENABLED;else process.env.EXPO_PUBLIC_INTERNAL_REPLAY_TEST_ENABLED=previous;}
});

test('release runtime redirects before invoking native availability or replay',async()=>{
 const {componentHarness}=await import('./ux-profile-render.ts');let calls=0;
 const h=componentHarness('app/dev/replay-test.tsx','default',{}, {developmentRuntime:false,modules:{
  '../../src/config/environment':{publicEnvironment:{buildFlavor:'development',useRemoteService:false}},
  '../../modules/internal-replay':{internalReplayNative:{availability(){calls++;return 'available';},async open(){calls++;return 'opened';}}},
  'react-native':{Platform:{OS:'ios'},View:'View',Text:'Text',Pressable:'Pressable',StyleSheet:{create:(x:unknown)=>x}},
  'expo-router':{Redirect:'Redirect',useRouter:()=>({back(){}})},
 }});
 const nodes=h.render();assert.equal(nodes.length,1);assert.equal(nodes[0].type,'Redirect');assert.equal(calls,0);h.dispose();
});
