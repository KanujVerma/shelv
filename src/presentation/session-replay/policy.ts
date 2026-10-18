/** All ordinary app screens remain excluded. Never pass route parameters to replay. */
export type AppReplaySurface = 'excluded' | 'synthetic_fixture';
export function resolveAppReplaySurface(segments: unknown): AppReplaySurface {
 try {
  return Array.isArray(segments) && segments.length === 2
   && segments[0] === 'dev' && segments[1] === 'replay-test' ? 'synthetic_fixture' : 'excluded';
 } catch { return 'excluded'; }
}

/** PostHog iOS 3.88.2 recognizes this native accessibility identifier.
 * Keep the host view in Fabric without grouping or hiding accessible children.
 * This source marker is NOT device masking proof, including rounded corners,
 * native-stack screens, portals, modals, camera/picker or alternate windows.
 */
export const APP_REPLAY_MASK_PROPS = Object.freeze({
 testID: 'ph-no-capture', collapsable: false, accessible: false,
});
