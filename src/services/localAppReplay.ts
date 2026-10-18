import type {ComponentType, ReactNode} from 'react';
import {Platform, type StyleProp, type ViewStyle} from 'react-native';
import {publicEnvironment} from '../config/environment';
import {appReplayController} from './appReplay';
import {createAppReplayController} from '../presentation/session-replay/controller';
import {createLocalAppReplayDriver, type LocalAppReplayNativePort} from '../presentation/session-replay/localNativeDriver';

type SurfaceProps = {synthetic:boolean;style?:StyleProp<ViewStyle>;children?:ReactNode;testID?:string;collapsable?:boolean;accessible?:boolean};
type Runtime = {kind:'off'|'local_probe';controller:ReturnType<typeof createAppReplayController>;
 Surface:ComponentType<SurfaceProps>|null;flush():void;alternateWindow():void;sibling():void;transientSibling(kind:string):Promise<string>;subscribeStopped(listener:()=>void):()=>void};
const off:Runtime = {kind:'off',controller:appReplayController,Surface:null,flush(){},alternateWindow(){},sibling(){},async transientSibling(){return 'not_attempted';},subscribeStopped:()=>()=>{}};
let local:Runtime|null = null;
/** A separate LOCAL validation runtime. Customer gates stay hard off. No config or credentials are read. */
export function getLocalAppReplayRuntime():Runtime {
 if (!(typeof __DEV__ !== 'undefined' && __DEV__) || publicEnvironment.buildFlavor !== 'development'
  || publicEnvironment.useRemoteService
  || process.env.EXPO_PUBLIC_INTERNAL_REPLAY_TEST_ENABLED !== 'true'
  || process.env.EXPO_PUBLIC_INTERNAL_APP_REPLAY_LOCAL_ENABLED !== 'true'
  || Platform.OS !== 'ios') return off;
 if (local) return local;
 // Load native binding only inside the explicit local debug gates. Expo Go/release fail closed.
 const {internalReplayNative:native} = require('../../modules/internal-replay') as typeof import('../../modules/internal-replay');
 const driver = createLocalAppReplayDriver(native as unknown as LocalAppReplayNativePort|null);
 if (!driver || typeof native?.addListener !== 'function') return off;
 const {requireNativeViewManager} = require('expo-modules-core') as typeof import('expo-modules-core');
 const Surface = requireNativeViewManager<SurfaceProps>('DeriveInternalReplay');
 // These grant only a generated LOCAL validation probe. They never qualify customer replay.
 const controller = createAppReplayController({activationApproved:true,nativeBuildVerified:true,maskingVerified:true,driver});
 local = {kind:'local_probe',controller,Surface,flush:driver.flush,alternateWindow(){void native?.actualAppAlternateWindowProbe?.();},sibling(){void native?.actualAppSiblingProbe?.();},async transientSibling(kind){return await native?.actualAppTransientSiblingProbe?.(kind)??'not_attempted';},
  subscribeStopped(listener){const subscription=native?.addListener?.('actualAppReplayStopped',event=>{if(driver.isCurrentNativeRun(event?.nonce))listener();});return()=>subscription?.remove();}};
 return local;
}
