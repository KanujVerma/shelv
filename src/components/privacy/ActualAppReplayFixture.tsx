import React, {useState} from 'react';
import {Image,Modal,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {useRouter} from 'expo-router';
import {getLocalAppReplayRuntime} from '../../services/localAppReplay';

/** Generated-only RN content. No stores, account details, camera, picker or remote data. */
export function ActualAppReplayFixture(){
 const runtime=getLocalAppReplayRuntime(),router=useRouter();const [modal,setModal]=useState(false),[transient,setTransient]=useState('');
 if(runtime.kind!=='local_probe')return null;
 return <View style={styles.content}>
  <Text>Generated React Native masking probe</Text>
  <TextInput accessibilityLabel="Synthetic replay field" editable={false} value="SYNTHETIC_RN_PRIVATE_INPUT_6262" style={styles.input}/>
  <View style={styles.label}><Text>SYNTHETIC_RN_PRIVATE_LABEL_7373</Text></View>
  <Image testID="actual-replay-green-canary" accessibilityLabel="Synthetic green image" source={{uri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEElEQVR4nGNg+M+AHQ0tCQDpMD/B9YBzjgAAAABJRU5ErkJggg=='}} style={styles.image}/>
  <View testID="actual-replay-magenta-canary" style={styles.magenta}/>
  <Pressable accessibilityRole="button" accessibilityLabel="Open synthetic modal" style={styles.button} onPress={()=>{runtime.controller.stop();setModal(true);}}><Text>Open synthetic modal — revoke first</Text></Pressable>
  <Pressable accessibilityRole="button" accessibilityLabel="Open synthetic sibling" style={styles.button} onPress={runtime.sibling}><Text>Open sibling — native revocation</Text></Pressable>
  <Pressable accessibilityRole="button" accessibilityLabel="Open actual-app alternate window" style={styles.button} onPress={runtime.alternateWindow}><Text>Open alternate window — native revocation</Text></Pressable>
  <Pressable accessibilityRole="button" accessibilityLabel="Open excluded synthetic screen" style={styles.button} onPress={()=>{runtime.controller.stop();router.push('/dev/replay-excluded');}}><Text>Open excluded synthetic screen</Text></Pressable>
  {(['opaque','lowOpacity','zeroBounds','animating','layer','backingLayer'] as const).map(kind=><Pressable key={kind} accessibilityRole="button" accessibilityLabel={'Probe transient '+kind+' sibling'} style={styles.button} onPress={()=>{void runtime.transientSibling(kind).then(result=>setTransient(kind+': '+result));}}><Text>{'Probe transient '+kind+' sibling'}</Text></Pressable>)}
  {!!transient&&<Text accessibilityLiveRegion="polite">{transient}</Text>}
  <Modal visible={modal} animationType="none" onRequestClose={()=>setModal(false)}><View style={styles.modal}><Text>SYNTHETIC_MODAL_CANARY</Text><Pressable accessibilityRole="button" accessibilityLabel="Close synthetic modal" style={styles.button} onPress={()=>setModal(false)}><Text>Close synthetic modal</Text></Pressable></View></Modal>
 </View>;
}
const styles=StyleSheet.create({content:{gap:12},input:{minHeight:44,borderWidth:1,padding:8},label:{height:60,backgroundColor:'#cccccc'},magenta:{height:64,backgroundColor:'#ff00ff'},image:{width:96,height:180},button:{minHeight:44,justifyContent:'center'},modal:{flex:1,padding:32,gap:20,backgroundColor:'#00ffff'}});
