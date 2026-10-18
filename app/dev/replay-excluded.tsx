import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {Redirect,useRouter} from 'expo-router';
import {getLocalAppReplayRuntime} from '../../src/services/localAppReplay';
export default function ReplayExcluded(){
 const runtime=getLocalAppReplayRuntime(),router=useRouter();
 if(runtime.kind!=='local_probe')return <Redirect href="/"/>;
 return <View style={{flex:1,padding:32,gap:20,backgroundColor:'#00ffff'}}>
  <Text>Excluded generated React Native screen</Text><Text>SYNTHETIC_EXCLUDED_CANARY</Text>
  <Pressable accessibilityRole="button" accessibilityLabel="Return to local replay — off" onPress={()=>router.back()} style={{minHeight:44,justifyContent:'center'}}><Text>Return to local replay — off</Text></Pressable>
 </View>;
}
