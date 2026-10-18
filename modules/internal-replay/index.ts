import {requireOptionalNativeModule} from 'expo-modules-core';
export interface InternalReplayNative {
 availability():string;
 actualAppAvailability?():string;
 actualAppPrepare?():Promise<string>;
 actualAppStart?(nonce:string):Promise<boolean>;
 actualAppRevoke?():void;
 actualAppFlush?():Promise<void>;
 actualAppSiblingProbe?(): Promise<void>;
 actualAppTransientSiblingProbe?(kind:string):Promise<string>;
 actualAppAlternateWindowProbe?():Promise<void>;
 addListener?(event:'actualAppReplayStopped',listener:(event:{nonce?:unknown})=>void):{remove():void};
 open(mode:'local'|'posthog',host:string,projectToken:string):Promise<string>;
}
// Debug-only autolinking. Missing is expected in Expo Go, web and release builds.
export const internalReplayNative=requireOptionalNativeModule<InternalReplayNative>('DeriveInternalReplay');
