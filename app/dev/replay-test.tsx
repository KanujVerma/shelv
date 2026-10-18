import {ActualAppReplayFixture} from '../../src/components/privacy/ActualAppReplayFixture';
import {getLocalAppReplayRuntime} from '../../src/services/localAppReplay';
import {AppReplayControls} from '../../src/components/privacy/AppReplayControls';
import React,{useState} from 'react';
import {Platform,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {Redirect,useRouter} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {publicEnvironment} from '../../src/config/environment';
import {resolveInternalReplayConfig} from '../../src/presentation/internal-replay/config';
import {internalReplayNative} from '../../modules/internal-replay';
export default function InternalReplayTest(){
 const router=useRouter(),insets=useSafeAreaInsets();
 const [message,setMessage]=useState('Recording is off. The native dummy screen also requires Start.');
 const config=resolveInternalReplayConfig({developmentRuntime:typeof __DEV__!=='undefined'&&__DEV__,buildFlavor:publicEnvironment.buildFlavor,
  remoteEnabled:publicEnvironment.useRemoteService,platform:Platform.OS,enabled:process.env.EXPO_PUBLIC_INTERNAL_REPLAY_TEST_ENABLED,
  host:process.env.EXPO_PUBLIC_POSTHOG_HOST,projectToken:process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN});
 if(!config.available)return <Redirect href="/"/>;
 const localProbe=getLocalAppReplayRuntime().kind==='local_probe';
 const availability=internalReplayNative?.availability()??'native_module_unavailable';
 async function open(mode:'local'|'posthog'){
  if(!config.available||!internalReplayNative||availability!=='available')return;
  if(mode==='posthog'&&!config.live)return;
  try{const result=await internalReplayNative.open(mode,config.live?.host??'',config.live?.projectToken??'');setMessage(result==='opened'?'Recording off after closing the native test.':'Could not open test: '+result);}catch{setMessage('The native test could not open. Recording remains off.');}
 }
 return <ScrollView contentContainerStyle={[styles.screen,{paddingTop:insets.top+20,paddingBottom:insets.bottom+20}]}>
  <Pressable accessibilityRole="button" onPress={()=>router.back()}><Text>Back</Text></Pressable>
  <Text style={styles.title}>Internal replay test</Text>
  <Text>Generated dummy content only. No customer screen is recorded. This is separate from anonymous usage analytics.</Text>
  {!localProbe&&<Text accessibilityLiveRegion="polite">{message}</Text>}
  <Text>Native: {availability}. Expo Go cannot run this test. Use the isolated internal debug bundle.</Text>
  <ActualAppReplayFixture/>
  {!localProbe&&<Pressable accessibilityRole="button" disabled={availability!=='available'} onPress={()=>void open('local')} style={styles.button}><Text>Open local recorder probe</Text></Pressable>}
  {!localProbe&&<Pressable accessibilityRole="button" disabled={availability!=='available'||!config.live} onPress={()=>void open('posthog')} style={styles.button}><Text>Open PostHog dummy test</Text></Pressable>}
  {!localProbe&&!config.live&&<Text>The existing PostHog client host and public token are not configured. Nothing can upload in local probe mode.</Text>}
  <AppReplayControls/>
  {localProbe&&<View style={{height:400}}/>}
 </ScrollView>;
}
const styles=StyleSheet.create({screen:{flexGrow:1,padding:24,gap:20,backgroundColor:'#F6F3EC'},title:{fontSize:24,fontWeight:'600'},button:{padding:16,borderWidth:1,borderRadius:12}});
