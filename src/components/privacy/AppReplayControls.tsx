import React, {useSyncExternalStore} from 'react';
import {Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import {getLocalAppReplayRuntime} from '../../services/localAppReplay';
import type {AppReplayController} from '../../presentation/session-replay/controller';

/** Developer test surface only. Usage sharing never grants this permission. */
export function AppReplayControls({controller: supplied}: {controller?: AppReplayController}) {
 const runtime = getLocalAppReplayRuntime();
 const controller = supplied ?? runtime.controller;
 const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
 const unavailable = state.reason !== null && state.reason !== 'consent_required' && state.reason !== 'recorder_failed';
 return <View style={styles.panel}>
  <Text style={styles.title}>Actual app replay {runtime.kind === 'local_probe' ? 'local validation' : 'preparation'}</Text>
  {runtime.kind === 'local_probe' ? <Text>Generated React Native content only. Local interception never forwards data to PostHog.</Text> : null}
  <Text>Separate from Share app usage. Permission lasts for this launch only; Start is a separate action.</Text>
  {unavailable ? <Text>Actual app recording is unavailable until native privacy checks and activation approval are complete.</Text> : null}
  <Switch accessibilityLabel="Allow this replay test for this launch" value={state.consent}
   disabled={!state.consent && unavailable} onValueChange={controller.setConsent}/>
  <Text accessibilityLiveRegion="polite">{state.reason === 'recorder_stop_failed' ? 'Recorder stop could not be confirmed. Close this internal build.' : state.recording ? 'Recording synthetic test' : 'Actual app recording is off'}</Text>
  <Pressable accessibilityRole="button" accessibilityLabel="Start app replay test" disabled={!state.canStart}
   accessibilityState={{disabled: !state.canStart}} onPress={() => { void controller.start(); }} style={styles.button}>
   <Text>Start app replay test</Text>
  </Pressable>
  {runtime.kind === 'local_probe' ? <Pressable accessibilityRole="button" accessibilityLabel="Send local replay frames" onPress={runtime.flush} style={styles.button}><Text>Send local replay frames</Text></Pressable> : null}
  <Pressable accessibilityRole="button" accessibilityLabel="Stop app replay" onPress={controller.stop} style={styles.button}>
   <Text>Stop app replay</Text>
  </Pressable>
 </View>;
}
const styles = StyleSheet.create({panel: {gap: 12, padding: 16, borderWidth: 1, borderRadius: 12},
 title: {fontWeight: '600'}, button: {minHeight: 44, justifyContent: 'center'}});
