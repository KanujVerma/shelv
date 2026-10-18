import React, {useEffect} from 'react';
import {AppState, Platform, StyleSheet, View} from 'react-native';
import {useSegments} from 'expo-router';
import {useAuthStore} from '@/src/stores/authStore';
import {getLocalAppReplayRuntime} from '../../services/localAppReplay';
import type {AppReplayController} from '../../presentation/session-replay/controller';
import {APP_REPLAY_MASK_PROPS, resolveAppReplaySurface} from '../../presentation/session-replay/policy';

/** Applied outside all root loading/error/auth branches. All ordinary routes are
 * excluded. JS lifecycle signals are defense in depth; they do not replace native
 * synchronous window/route revocation or prove Fabric/modal masking.
 */
export function AppReplayPrivacyBoundary({children, controller: supplied}: {
 children: React.ReactNode; controller?: AppReplayController;
}) {
 const runtime = getLocalAppReplayRuntime();
 const controller = supplied ?? runtime.controller;
 const surface = resolveAppReplaySurface(useSegments());
 const owner = useAuthStore(state => state.status === 'SIGNED_IN' ? state.sessionUserId : null);
 useEffect(() => { controller.setOwner(owner); }, [controller, owner]);
 useEffect(() => runtime.subscribeStopped(controller.stop), [runtime, controller]);
 useEffect(() => {
  const reconcile = (foreground: boolean) => controller.setContext({surface, foreground});
  reconcile(AppState.currentState === 'active');
  const change = AppState.addEventListener('change', state => reconcile(state === 'active'));
  const blur = Platform?.OS === 'android' ? AppState.addEventListener('blur', () => reconcile(false)) : null;
  const focus = Platform?.OS === 'android' ? AppState.addEventListener('focus', () => reconcile(AppState.currentState === 'active')) : null;
  return () => {
   // Clear permission before releasing the boundary. Remount never restores it.
   controller.setConsent(false);
   controller.setContext({surface: 'excluded', foreground: false});
   change.remove(); blur?.remove(); focus?.remove();
  };
 }, [controller, surface]);
 // Keep ordinary builds' native/web layout unchanged while replay is unavailable.
 if (!supplied && runtime.kind === 'off') return <>{children}</>;
 const Surface = supplied ? null : runtime.Surface;
 const content = <View {...APP_REPLAY_MASK_PROPS} style={[styles.root,Surface ? styles.localMask : null]}>{children}</View>;
 return Surface ? <Surface {...APP_REPLAY_MASK_PROPS} synthetic={surface === 'synthetic_fixture'} style={styles.localSurface}>{content}</Surface> : content;
}
const styles = StyleSheet.create({root: {flex: 1}, localMask: {overflow: 'hidden'}, localSurface: {flex: 1, padding: 12, overflow: 'hidden'}});
