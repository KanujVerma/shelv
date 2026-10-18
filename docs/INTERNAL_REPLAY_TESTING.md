# Internal synthetic replay validation

Customer replay remains disabled. Anonymous usage consent never grants replay permission. This integration is an explicitly started development test containing generated content only; it does not qualify customer screens or activate PostHog Error Tracking.

The React Native/Fabric root stays mounted. An isolated iOS Debug build, development/Mock JS runtime, both `EXPO_PUBLIC_INTERNAL_REPLAY_TEST_ENABLED=true` and `EXPO_PUBLIC_INTERNAL_APP_REPLAY_LOCAL_ENABLED=true`, and exact `dev/replay-test` route are required. Native availability independently requires bundle `com.derive.skincare.internalreplay`. Expo Go, Android, web and Release cannot start the native recorder. With replay unavailable, the root boundary returns its original children without adding a layout host.

The generated screen has separate launch-only consent and Start. Opening, returning, foregrounding or restarting cannot grant permission. Stop, route/owner changes, backgrounding, mask loss and another native window revoke. Pending starts and stopped callbacks are fenced by the current JS generation and native UUID. The native lease expires after 120 seconds.

## Capture and transport boundaries

`modules/internal-replay` pins PostHog iOS 3.88.2. The SDK renders pixels before its asynchronous `beforeSend` callback, so a persistence callback alone is insufficient to exclude a short-lived native overlay. The repository therefore applies a small SDK source patch during CocoaPods `post_install` through `plugins/with-internal-replay.js`.

The patch checks the installed version and complete original or expected patched SHA-256 of both affected files before writing either. Unknown versions, changed source, ambiguous hooks or modified installation blocks stop the build. This is a repository-maintained patch to the pinned SDK, not unmodified upstream behavior. No runtime swizzle is added by the patch.

The configured SDK callback runs synchronously on main before wireframe content reads, mask collection and screenshot rendering. It binds capture to the exact owned window, foreground state, active lease and mask geometry. Background screenshot capture is refused when this callback is configured. Configured captures synchronize recent screen updates and recheck admission after rendering before enqueue; an unhooked SDK keeps upstream behavior. `beforeSend` and the local transport remain independent persistence/admission checks. The older generated UIKit fixture uses the same capture hook.

Unknown nonhidden siblings deny regardless of opacity, bounds or clipping: a fading view may have model alpha zero, and a zero-size wrapper can render descendants. Hidden views with active layer animations also deny. Every visible direct CALayer along the branch must belong to an inspected child UIView. Unowned layers deny even if they have zero model opacity or bounds. Backing-layer ancestry must reach the parent layer from an exact inspected child view's actual CALayer. Intermediate containers require the paired child owner, full-window geometry, identity transforms and no mask/filter/opacity change or animation; every visible off-path layer is rejected recursively. No layer is hidden or admitted by its private class name, semantic equality or delegate alone. The branch must have full-window geometry, no 3D transform, mask, corner clipping, filter, compositing filter or animation. The owned guard must cover the full window with an opaque background. Only the exact runtime-created childless 8pt grayscale cue is allowed outside the masked root. The inspected React Native developer highlight wrapper is temporarily detached and restored to its original parent/index on Stop; other overlays are never ignored. Known developer windows are hidden and restored. The private root keeps clipped 12pt padding around the SDK's rounded masks.

The actual-RN adapter accepts no host or credential. Its fixed synthetic `https://127.0.0.1:49318` URL is handled by an always-intercepting in-process URLProtocol. There is no collector listener and no forwarding session. Only exact fake config and bounded snapshot requests are admitted; other origins, events, paths, nonempty queries and revoked leases fail. Generated evidence is stored in the isolated app's Documents. The capture-guard build uses a separate local SDK/evidence namespace, preserving older generated queues.

All automatic errors, screens, lifecycle/element/push capture, logs, touches, network telemetry, surveys, person profiles and GeoIP are disabled for these tests. No usage event, account ID, skincare text, real photo or credential belongs in replay evidence.

The older **Open PostHog dummy test** path remains separate and hidden while actual-RN local mode is selected. It requires an existing approved public client configuration and a fresh exact dummy flag evaluation for each Start. Its presence is not permission to enable project recording, start another hosted test, or record customer screens. The actual-RN adapter has no hosted switch.

## Build and offline checks

The local Expo module is discovered under `modules/`; its Apple configuration is debug-only. Standard Expo native generation applies the Podfile plugin, and CocoaPods applies the pinned patch before compilation. A native rebuild is required after source/configuration changes; a JS export or Expo Go cannot supply the native recorder. Existing development signing can be used with the isolated bundle; this change creates no credentials or EAS profile.

Run the standard application tests and type checks, then:

```sh
bash modules/internal-replay/tests/run-offline.sh
```

The runner executes both UIKit admission/flag/transport suites and the ActualApp admission/transport suites. Its default output is a fresh ignored `.local-artifacts/internal-replay-offline-*` directory, preserving earlier receipts. The transport tests use the nonforwarding URLProtocol, including a real local URLSession upload matching the pinned SDK's empty query.

`tests/internal-replay-build.test.ts` runs the real Expo Podfile mod and Ruby patch against licensed exact-source fixtures without CocoaPods downloads. It verifies installation/idempotence, source/version drift rejection without partial writes, and emitted capture methods against a small Swift harness when a compiler is available.

`modules/internal-replay/tests/native/ReplayUITests.xcodeproj` contains the durable simulator acceptance cases. Build/install the isolated Debug app, serve development/Mock JS from a task-owned reachable Metro port with dotenv/telemetry/usage collection off, open `/dev/replay-test`, and run the ReplayUITests scheme against that simulator. The transient cases insert each generated opaque/low-opacity/zero-bounds/animated view sibling and unowned layers both at the window and inside an admitted backing container, invokes the real SDK capture, and removes the sibling before asynchronous persistence validation can run. Passing requires explicit capture-time denial, no enqueued frame and recording off; a false SDK result caused only by an overlapping render does not pass.

The cold-start case terminates the app, verifies it is not running, and launches the known Metro project (`REPLAY_METRO_URL` in the test scheme environment, default `http://127.0.0.1:8097`) and opens the replay deep link anew before checking the absent grant. Run the legacy UIKit local case separately with the actual-RN local gate off; it checks Start/flush/Stop/restart and app-root restoration.

After copying only the isolated generated app's evidence, verify decoded payloads and pending queues, canary pixels/text, explicit grant intervals, actual clipping/scroll frames, all exclusion transitions and cold-start off with unchanged synthetic caches. Do not inspect unrelated app containers or customer recordings.

## Acceptance limits

Local fake HTTP success is not PostHog ingestion or replay-player proof. A future bounded hosted RN test needs a separately reviewed transport, exact generated run receipts/readback and its authorized remote-control window. Existing UIKit hosted evidence cannot certify RN playback.

The fixture does not qualify camera/picker, authentication, account, result or other customer surfaces. Arbitrary custom views that mutate the hierarchy reentrantly while drawing, private system rendering and wider platform visual/performance behavior are not accepted. These require explicit treatment before broader recording; customer activation stays hard false. Signed physical-device launch, masking and lifecycle acceptance remain separate from simulator/build checks.
