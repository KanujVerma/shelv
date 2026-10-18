import ExpoModulesCore
import UIKit
@_spi(PostHogInternal) import PostHog

/// Retains the real RN root inside a clipped generated border for LOCAL validation.
final class ActualAppReplayGuardView: ExpoView {
 private(set) var synthetic = false
 required init(appContext: AppContext? = nil) {
  super.init(appContext: appContext)
  clipsToBounds = true; backgroundColor = .white; accessibilityIdentifier = "ph-no-capture"
  ActualAppReplayRuntime.shared.register(self)
 }
 func setSynthetic(_ value: Bool) { synthetic = value; ActualAppReplayRuntime.shared.reconcile() }
 override func didMoveToWindow() { super.didMoveToWindow(); ActualAppReplayRuntime.shared.reconcile() }
 override func layoutSubviews() { super.layoutSubviews(); ActualAppReplayRuntime.shared.reconcile() }
 var maskReady: Bool {
  guard synthetic, accessibilityIdentifier == "ph-no-capture", window != nil, bounds.width > 24, bounds.height > 24, clipsToBounds else { return false }
  guard !isHidden, alpha == 1, transform.isIdentity, layer.animationKeys()?.isEmpty != false,
   subviews.count == 1, let child = subviews.first, !child.isHidden, child.alpha == 1, child.transform.isIdentity,
   child.layer.animationKeys()?.isEmpty != false, child.accessibilityIdentifier == "ph-no-capture",
   child.clipsToBounds, child.bounds.width > 0, child.bounds.height > 0 else { return false }
  return bounds.insetBy(dx: 12, dy: 12).contains(child.frame)
 }
 func pulse(_ tick: Int) {
  // Only a generated grayscale border changes. App content remains masked.
  backgroundColor = tick % 2 == 0 ? .white : .lightGray
  setNeedsLayout(); layoutIfNeeded()
 }
}

/// No hosted mode, host/token parameter, app-root replacement or forwarding path.
final class ActualAppReplayRuntime {
 static var availability: String {
  #if DEBUG
  return Bundle.main.bundleIdentifier == ReplayFlagPolicy.bundleIdentifier ? "local_only_v1" : "isolated_debug_bundle_required"
  #else
  return "release_disabled"
  #endif
 }
 static let shared = ActualAppReplayRuntime()
 private let gate = ActualAppReplayAdmission(internalBuild: availability == "local_only_v1")
 private let views = NSHashTable<ActualAppReplayGuardView>.weakObjects()
 private var sdk: PostHogSDK?, evidence: ReplayEvidence?, observers = [NSObjectProtocol]()
 private var developerWindows = [UIWindow](), developerOverlays = [(view: UIView, parent: UIView, index: Int)](), pulseTimer: Timer?, tick = 0
 private var alternateWindow: UIWindow?, siblingOverlay: UIView?
 private var publicCue: UIView?
 private weak var transientSibling: UIView?
 private var captureDenials = 0
 var onStopped: ((String) -> Void)?
 var hasConfiguredSDK: Bool { sdk != nil }
 private init() {
  observers.append(NotificationCenter.default.addObserver(forName: UIApplication.willResignActiveNotification, object: nil, queue: .main) { [weak self] _ in self?.revoke() })
  for name in [UIWindow.didResignKeyNotification, UIWindow.didBecomeKeyNotification, UIWindow.didBecomeVisibleNotification] {
   observers.append(NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in self?.reconcile() })
  }
 }
 func register(_ view: ActualAppReplayGuardView) { views.add(view) }
 /// Any visible sibling outside the marked root is a portal/overlay exclusion.
 /// Check again synchronously before the SDK can persist every snapshot.
 /// The only allowed sibling is this runtime-created, childless, grayscale 8pt
 /// cue, wholly inside the generated outer padding and outside the private root.
 private func isPublicCue(_ sibling: UIView, for view: ActualAppReplayGuardView, window: UIWindow) -> Bool {
  guard sibling === publicCue, sibling.window === window, sibling.superview === window,
   sibling.subviews.isEmpty, Self.viewLayersAreExclusive(sibling), sibling.frame == CGRect(x: 1, y: 1, width: 8, height: 8),
   let privateRoot = view.subviews.first else { return false }
  let privateBounds = privateRoot.convert(privateRoot.bounds, to: window)
  return !privateBounds.intersects(sibling.frame)
 }
 /// Alpha and model bounds cannot prove invisibility: presentation opacity and
 /// descendants of a zero-sized, nonclipping wrapper can still render pixels.
 static func isDefinitelyHidden(_ view: UIView) -> Bool {
  view.isHidden && view.layer.animationKeys()?.isEmpty != false
 }
 /// Direct CALayers render outside subviews. Never admit an unowned visible layer.
 /// UIKit may insert a backing container between a UIView's actual layer and
 /// its parent's layer. Prove the complete ancestry instead of trusting a class
 /// name or delegate alone, and reject every visible off-path layer recursively.
 static func viewLayersAreExclusive(_ view: UIView) -> Bool {
  let terminals = Set(view.subviews.map { ObjectIdentifier($0.layer) })
  var owners = [ObjectIdentifier: Set<ObjectIdentifier>]()
  for child in view.subviews {
   var current = child.layer, seen = Set<ObjectIdentifier>()
   while current !== view.layer {
    guard seen.count < 64, seen.insert(ObjectIdentifier(current)).inserted,
     let parent = current.superlayer else { return false }
    if parent !== view.layer { owners[ObjectIdentifier(parent), default: []].insert(ObjectIdentifier(child)) }
    current = parent
   }
  }
  func admitted(_ layer: CALayer) -> Bool {
   if terminals.contains(ObjectIdentifier(layer)) { return true }
   if layer.isHidden && layer.animationKeys()?.isEmpty != false { return true }
   guard let expectedOwners = owners[ObjectIdentifier(layer)], let owner = layer.delegate as? UIView,
    expectedOwners.contains(ObjectIdentifier(owner)), layer.opacity == 1,
    layer.frame == view.bounds, layer.bounds == view.bounds,
    layer.cornerRadius == 0, layer.mask == nil, layer.filters?.isEmpty != false,
    layer.compositingFilter == nil, layer.animationKeys()?.isEmpty != false,
    CATransform3DIsIdentity(layer.transform), CATransform3DIsIdentity(layer.sublayerTransform) else { return false }
   return (layer.sublayers ?? []).allSatisfy(admitted)
  }
  return (view.layer.sublayers ?? []).allSatisfy(admitted)
 }
 static func captureBranchIsExclusive(_ view: UIView, in window: UIWindow, allowedSibling: (UIView) -> Bool = { _ in false }) -> Bool {
  guard viewLayersAreExclusive(view), view.backgroundColor?.cgColor.alpha == 1,
   view.convert(view.bounds, to: window) == window.bounds else { return false }
  var branch = view
  while branch !== window {
   guard !branch.isHidden, branch.alpha == 1, branch.transform.isIdentity,
    branch.convert(branch.bounds, to: window) == window.bounds,
    branch.layer.opacity == 1, branch.layer.cornerRadius == 0, branch.layer.mask == nil,
    branch.layer.filters?.isEmpty != false, branch.layer.compositingFilter == nil,
    CATransform3DIsIdentity(branch.layer.transform), CATransform3DIsIdentity(branch.layer.sublayerTransform),
    branch.layer.animationKeys()?.isEmpty != false, let parent = branch.superview,
    viewLayersAreExclusive(parent) else { return false }
   for sibling in parent.subviews where sibling !== branch {
    if isDefinitelyHidden(sibling) { continue }
    guard allowedSibling(sibling) else { return false }
   }
   branch = parent
  }
  return true
 }
 private func soleVisibleBranch(_ view: ActualAppReplayGuardView, in window: UIWindow) -> Bool {
  Self.captureBranchIsExclusive(view, in: window) { self.isPublicCue($0, for: view, window: window) }
 }
 private var ownedView: ActualAppReplayGuardView? {
  guard Thread.isMainThread, Self.availability == "local_only_v1", UIApplication.shared.applicationState == .active else { return nil }
  let attached = views.allObjects.filter { $0.window != nil }
  guard attached.count == 1, let view = attached.first, view.maskReady, let window = view.window,
   window.isKeyWindow, !window.isHidden, view.convert(view.bounds, to: window) == window.bounds,
   view.backgroundColor?.cgColor.alpha == 1, soleVisibleBranch(view, in: window) else { return nil }
  let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.filter { $0.activationState == .foregroundActive }
  guard scenes.count == 1, scenes.flatMap({$0.windows}).allSatisfy({$0 === window || Self.isDefinitelyHidden($0)}),
   var top = window.rootViewController else { return nil }
  while let presented = top.presentedViewController { top = presented }
  guard view.isDescendant(of: top.view) else { return nil }
  return view
 }
 /// Invoked by the pinned SDK immediately before native reads/rasterization.
 /// Close admission synchronously; defer SDK shutdown so a capture callback never
 /// recursively mutates SDK integration state. A newer explicit run is fenced.
 private func admitCapture(_ window: UIWindow) -> Bool {
  guard Thread.isMainThread else { return false }
  let lease = gate.activeLease, nonce = gate.currentNonce
  if let lease, let view = ownedView, view.window === window, gate.permits(lease) {
   evidence?.record("actual_app_capture_admitted", ["lease": lease, "transientSiblingAttached": (transientSibling?.superview != nil || transientSibling?.layer.superlayer != nil)])
   return true
  }
  gate.revoke()
  if lease != nil || nonce != nil {
   captureDenials += 1
   evidence?.record("actual_app_capture_denied", ["transientSiblingAttached": (transientSibling?.superview != nil || transientSibling?.layer.superlayer != nil)])
   DispatchQueue.main.async { [weak self] in
    guard let self else { return }
    guard self.gate.activeLease == nil, self.gate.currentNonce == nil else {
     if let nonce { self.onStopped?(nonce) }; return
    }
    self.finishStop(notify: true, nonce: nonce)
   }
  }
  return false
 }
 func reconcile() {
  guard Thread.isMainThread else { return }
  let wasActive = gate.activeLease != nil, nonce = gate.currentNonce, ready = ownedView != nil
  gate.update(surfaceReady: ready, foreground: UIApplication.shared.applicationState == .active)
  if !ready && wasActive { finishStop(notify: true, nonce: nonce) }
 }
 private func captureBranchFacts(_ view: UIView) -> [[String: Any]] {
  var branch = view, rows = [[String: Any]]()
  while let parent = branch.superview, rows.count < 12 {
   rows.append(["branch": String(reflecting: type(of: branch)), "hidden": branch.isHidden,
    "alpha": branch.alpha, "identityTransform": branch.transform.isIdentity,
    "animations": branch.layer.animationKeys() ?? [],
    "fullWindow": branch.window.map { branch.convert(branch.bounds, to: $0) == $0.bounds } ?? false,
    "layerOpacity": branch.layer.opacity, "cornerRadius": branch.layer.cornerRadius,
    "layerMask": branch.layer.mask != nil, "layerFilters": branch.layer.filters?.count ?? 0,
    "compositingFilter": branch.layer.compositingFilter != nil,
    "identityLayerTransform": CATransform3DIsIdentity(branch.layer.transform),
    "identitySublayerTransform": CATransform3DIsIdentity(branch.layer.sublayerTransform),
    "layersExclusive": Self.viewLayersAreExclusive(branch),
    "parentLayersExclusive": Self.viewLayersAreExclusive(parent),
    "parentUnownedLayers": (parent.layer.sublayers ?? []).filter { layer in !parent.subviews.contains { $0.layer === layer } }.prefix(8).map { layer -> [String: Any] in
     ["class": String(reflecting: type(of: layer)), "hidden": layer.isHidden, "animations": layer.animationKeys() ?? [],
      "frame": NSCoder.string(for: layer.frame), "bounds": NSCoder.string(for: layer.bounds),
      "delegateClass": layer.delegate.map { String(reflecting: type(of: $0)) } ?? "none",
      "delegateIsDirectSubview": parent.subviews.contains { child in (layer.delegate as? UIView) === child },
      "childLayerClasses": parent.subviews.map { String(reflecting: type(of: $0.layer)) },
      "childLayerAncestry": parent.subviews.map { child -> [String] in
       var current: CALayer? = child.layer, names = [String]()
       while let item = current, names.count < 8 { names.append(String(reflecting: type(of: item))); if item === parent.layer { break }; current = item.superlayer }
       return names
      }]
    },
    "siblings": parent.subviews.filter{$0 !== branch}.prefix(8).map { sibling -> [String: Any] in
     ["class": String(reflecting: type(of: sibling)), "hidden": sibling.isHidden,
      "definitelyHidden": Self.isDefinitelyHidden(sibling), "alpha": sibling.alpha,
      "presentationHidden": sibling.layer.presentation()?.isHidden ?? true,
      "animations": sibling.layer.animationKeys() ?? []]
    }])
   branch = parent
  }
  return rows
 }
 private func outsideBranchClasses(_ view: UIView) -> [String] {
  var branch = view, names = [String]()
  while let parent = branch.superview {
   for sibling in parent.subviews where sibling !== branch && !sibling.isHidden && sibling.alpha > 0.01 && sibling.bounds.width > 0 && sibling.bounds.height > 0 {
    names.append(String(reflecting: type(of: sibling))+"["+sibling.subviews.map{String(reflecting: type(of: $0))}.joined(separator: ",")+"]")
   }
   branch = parent
  }
  return Array(names.prefix(12))
 }
 func prepare() -> String {
  guard Self.availability == "local_only_v1", !ReplayTestRuntime.shared.hasConfiguredSDK, !ReplayTestRuntime.shared.ownsSurface else { return "" }
  for window in UIApplication.shared.connectedScenes.compactMap({$0 as? UIWindowScene}).flatMap({$0.windows}) where !window.isHidden {
   let name = String(reflecting: type(of: window)).split(separator: ".").last.map(String.init) ?? ""
   if ["DevMenuFABWindow", "DevMenuWindow"].contains(name) { developerWindows.append(window); window.isHidden = true }
  }
  // The exact RN developer highlight overlay is outside the app's React root.
  // Detach only its inspected single-child wrapper; hidden presentation pixels
  // are not treated as proof of invisibility. Restore exact parent/index on Stop.
  if let view = views.allObjects.first(where: {$0.window != nil}) {
   var branch: UIView = view
   while let parent = branch.superview {
    for sibling in parent.subviews where sibling !== branch && !sibling.isHidden {
     if String(reflecting: type(of: sibling)) == "RCTViewComponentView", sibling.subviews.count == 1,
      String(reflecting: type(of: sibling.subviews[0])) == "RCTDebuggingOverlayComponentView" {
      if let index = parent.subviews.firstIndex(of: sibling) {
       developerOverlays.append((sibling, parent, index)); sibling.removeFromSuperview()
      }
     }
    }
    branch = parent
   }
  }
  reconcile()
  if evidence == nil {
   let folder = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("actual-app-replay-capture-final").appendingPathComponent(UUID().uuidString)
   evidence = ReplayEvidence(directory: folder)
  }
  let attached = views.allObjects.filter { $0.window != nil }
  evidence?.record("actual_app_prepare_check", ["ready": ownedView != nil, "attachedViews": attached.count,
   "maskReady": attached.first?.maskReady ?? false, "directChildren": attached.first?.subviews.count ?? 0,
   "maskedChildren": attached.first?.subviews.filter { $0.accessibilityIdentifier == "ph-no-capture" }.count ?? 0,
   "outsideBranchClasses": attached.first.map{outsideBranchClasses($0)} ?? [],
   "captureBranchFacts": attached.first.map{captureBranchFacts($0)} ?? [],
   "visibleWindowClasses": UIApplication.shared.connectedScenes.compactMap{$0 as? UIWindowScene}.flatMap{$0.windows}.filter{!$0.isHidden && $0.alpha > 0}.map{String(reflecting:type(of:$0))},
   "windowFacts": UIApplication.shared.connectedScenes.compactMap{$0 as? UIWindowScene}.flatMap{$0.windows}.prefix(8).map { ["class": String(reflecting:type(of:$0)), "hidden": $0.isHidden, "definitelyHidden": Self.isDefinitelyHidden($0), "animations": $0.layer.animationKeys() ?? []] },
   "captureWindowKey": attached.first?.window?.isKeyWindow ?? false,
   "guardFrameInWindow": attached.first.map { view in view.window.map { NSCoder.string(for: view.convert(view.bounds, to: $0)) } ?? "detached" } ?? "missing",
   "windowBounds": attached.first?.window.map { NSCoder.string(for: $0.bounds) } ?? "missing",
   "guardBackgroundAlpha": attached.first?.backgroundColor?.cgColor.alpha ?? -1])
  guard let nonce = gate.prepare() else { finishStop(notify: false); return "" }
  evidence?.record("actual_app_prepared_off", ["mode": "local", "sdkSetup": sdk != nil])
  return nonce
 }
 func start(_ nonce: String, completion: @escaping (Bool) -> Void) {
  reconcile()
  guard let lease = gate.start(nonce), ownedView != nil else { completion(false); return }
  if let window = ownedView?.window {
   let cue = UIView(frame: CGRect(x: 1, y: 1, width: 8, height: 8))
   cue.isUserInteractionEnabled = false; cue.isAccessibilityElement = false
   cue.clipsToBounds = true; cue.backgroundColor = .white
   publicCue = cue; window.addSubview(cue)
  }
  evidence?.record("actual_app_explicit_start", ["lease": lease, "mode": "local"])
  if sdk == nil {
   ActualAppReplayLocalTransport.configure(gate: gate, snapshot: { [weak self] data, id in self?.evidence?.saveBody(data, id: id) }, fact: { [weak self] kind, fields in self?.evidence?.record(kind, fields) })
   let config = PostHogConfig(projectToken: ActualAppReplayLocalPolicy.token, host: ActualAppReplayLocalPolicy.origin)
   config.deriveBeforeReplayCapture = { [weak self] window in self?.admitCapture(window) ?? false }
   config.rageClickConfig.enabled = false; config.captureAutocaptureElementText = false
   config.optOut = true; config.sessionReplay = false; config.personProfiles = .never; config.disableGeoIp = true
   config.sessionReplayConfig.maskAllTextInputs = true; config.sessionReplayConfig.maskAllImages = true
   config.sessionReplayConfig.maskAllSandboxedViews = true; config.sessionReplayConfig.captureTouches = false
   config.sessionReplayConfig.captureLogs = false; config.sessionReplayConfig.captureNetworkTelemetry = false
   config.sessionReplayConfig.screenshotMode = true; config.sessionReplayConfig.screenshotModeBackgroundCapture = false; config.sessionReplayConfig.throttleDelay = 0.3
   config.captureApplicationLifecycleEvents = false; config.captureScreenViews = false; config.captureElementInteractions = false
   config.captureSwiftUIElementInteractions = false; config.capturePushNotificationSubscriptions = false; config.capturePushNotificationOpened = false
   config.errorTrackingConfig.autoCapture = false; config.surveys = false; config.preloadFeatureFlags = false; config.sendFeatureFlagEvent = false
   config.setDefaultPersonProperties = false; config.flushAt = 1000; config.maxBatchSize = 1000; config.flushIntervalSeconds = 300; config.compression = .none
   config.setBeforeSend { [weak self] event in
    guard event.event == "$snapshot", let self, let current = self.gate.activeLease else { return nil }
    // Synchronous before-persistence hook: modal/window or mask loss drops the frame.
    let validate = {
     self.reconcile()
     let safe = self.ownedView != nil && self.gate.permitsFrame(current, timestamp: event.timestamp.timeIntervalSince1970)
     self.evidence?.record("actual_app_before_persistence", ["safe": safe, "transientSiblingAttached": (self.transientSibling?.superview != nil || self.transientSibling?.layer.superlayer != nil)])
     return safe
    }
    let safe = Thread.isMainThread ? validate() : DispatchQueue.main.sync(execute: validate)
    return safe ? event : nil
   }
   let session = URLSessionConfiguration.ephemeral; session.protocolClasses = [ActualAppReplayLocalTransport.self]
   session.urlCache = nil; session.requestCachePolicy = .reloadIgnoringLocalAndRemoteCacheData; session.httpCookieStorage = nil; session.urlCredentialStorage = nil
   config.urlSessionConfiguration = session
   sdk = PostHogSDK.with(config); sdk?.optOut()
   evidence?.record("actual_app_sdk_setup", ["version": "3.88.2", "mode": "local", "forwarding": false, "captureAdmission": true])
  }
  sdk?.optIn(); tryStart(lease, attempt: 0, completion: completion)
 }
 private func tryStart(_ lease: Int, attempt: Int, completion: @escaping (Bool) -> Void) {
  reconcile()
  guard gate.permits(lease), ownedView != nil else { completion(false); return }
  sdk?.startSessionRecording(resumeCurrent: false)
  if sdk?.isSessionReplayActive() == true {
   evidence?.record("actual_app_recording_active", ["lease": lease, "mode": "local"])
   pulseTimer?.invalidate(); tick = 0
   pulseTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
    guard let self else { return }; self.reconcile(); guard self.gate.permits(lease) else { return }
    self.tick += 1
    // No text, image, private props or gestures: only generated public gray pixels.
    self.publicCue?.backgroundColor = UIColor(white: CGFloat(30+self.tick%120)/200, alpha: 1)
    self.publicCue?.setNeedsLayout(); self.publicCue?.layoutIfNeeded()
   }
   DispatchQueue.main.asyncAfter(deadline: .now()+120) { [weak self] in
    guard let self, self.gate.matches(lease) else { return }; self.revoke(forceNotify: true)
   }
   completion(true); return
  }
  if attempt >= 24 { revoke(); completion(false); return }
  DispatchQueue.main.asyncAfter(deadline: .now()+0.25) { [weak self] in
   guard let self else { completion(false); return }; self.tryStart(lease, attempt: attempt+1, completion: completion)
  }
 }
 /// A synchronous Expo Function closes admission before queued SDK shutdown work.
 func revoke(forceNotify: Bool = false) {
  let notify = forceNotify || gate.activeLease != nil, nonce = gate.currentNonce; gate.revoke()
  if Thread.isMainThread { finishStop(notify: notify, nonce: nonce) }
  else { DispatchQueue.main.async { [weak self] in self?.finishStop(notify: notify, nonce: nonce) } }
 }
 private func finishStop(notify: Bool, nonce: String? = nil) {
  pulseTimer?.invalidate(); pulseTimer = nil; sdk?.optOut(); sdk?.stopSessionRecording()
  publicCue?.removeFromSuperview(); publicCue = nil
  for window in developerWindows { window.isHidden = false }; developerWindows.removeAll()
  for overlay in developerOverlays where overlay.view.superview == nil {
   overlay.parent.insertSubview(overlay.view, at: min(overlay.index, overlay.parent.subviews.count))
  }
  developerOverlays.removeAll()
  evidence?.record("actual_app_stopped", ["sdkActive": sdk?.isSessionReplayActive() ?? false])
  if notify, let nonce { onStopped?(nonce) }
 }
 /// Deterministic generated-only capture-time probe. The sibling is removed on
 /// the same main block before asynchronous beforeSend can inspect the window.
 func transientSiblingProbe(_ kind: String, attempt: Int = 0, completion: @escaping (String) -> Void) {
  guard ["opaque", "lowOpacity", "zeroBounds", "animating", "layer", "backingLayer"].contains(kind),
   let owner = ownedView, let parent = owner.window, let lease = gate.activeLease, let sdk else { completion("not_attempted"); return }
  var targetLayer = parent.layer
  if kind == "backingLayer" {
   var branch: UIView = owner, container: CALayer?
   while let superview = branch.superview {
    if let intermediate = branch.layer.superlayer, intermediate !== superview.layer { container = intermediate; break }
    branch = superview
   }
   guard let container else { completion("not_attempted"); return }
   targetLayer = container
  }
  let overlay = UIView(frame: parent.bounds)
  overlay.backgroundColor = .cyan; overlay.isUserInteractionEnabled = false
  if kind == "lowOpacity" { overlay.alpha = 0.005 }
  if kind == "zeroBounds" {
   overlay.frame = .zero; overlay.backgroundColor = .clear; overlay.clipsToBounds = false
   let content = UIView(frame: parent.bounds); content.backgroundColor = .cyan; overlay.addSubview(content)
  }
  if kind == "animating" {
   overlay.alpha = 0
   let animation = CABasicAnimation(keyPath: "opacity")
   animation.fromValue = 1; animation.toValue = 0; animation.duration = 60
   overlay.layer.add(animation, forKey: "generated-transient-opacity")
  }
  let priorDenials = captureDenials
  transientSibling = overlay
  if kind == "layer" || kind == "backingLayer" { targetLayer.addSublayer(overlay.layer) } else { parent.addSubview(overlay) }
  evidence?.record("actual_app_transient_sibling_inserted", ["variant": kind, "lease": lease])
  let captured = sdk.captureSessionReplaySnapshot(episodeFirstFrame: true)
  overlay.layer.removeAllAnimations(); overlay.removeFromSuperview(); overlay.layer.removeFromSuperlayer(); transientSibling = nil
  let denied = captureDenials > priorDenials && gate.activeLease == nil
  evidence?.record("actual_app_transient_sibling_removed", ["variant": kind, "captureEnqueued": captured, "deniedAtCapture": denied, "granted": gate.activeLease != nil])
  if !captured && !denied && gate.permits(lease) && attempt < 20 {
   DispatchQueue.main.asyncAfter(deadline: .now()+0.1) { [weak self] in
    guard let self else { completion("not_attempted"); return }
    self.transientSiblingProbe(kind, attempt: attempt+1, completion: completion)
   }
   return
  }
  completion(denied && !captured ? "denied_before_render" : (captured ? "unsafe_frame_enqueued" : "not_attempted"))
 }
 func siblingProbe() {
  guard let parent = ownedView?.window, siblingOverlay == nil else { return }
  let overlay = UIView(frame: parent.bounds); overlay.backgroundColor = .cyan
  let label = UILabel(frame: CGRect(x: 20, y: 180, width: 340, height: 70))
  label.text = "SYNTHETIC_ACTUAL_APP_SIBLING"; overlay.addSubview(label)
  let close = UIButton(type: .system); close.setTitle("Close synthetic sibling — off", for: .normal)
  close.frame = CGRect(x: 20, y: 300, width: 340, height: 70)
  close.addAction(UIAction { [weak self] _ in
   self?.siblingOverlay?.removeFromSuperview(); self?.siblingOverlay = nil
   self?.evidence?.record("actual_app_sibling_closed_off")
  }, for: .touchUpInside)
  overlay.addSubview(close); siblingOverlay = overlay; parent.addSubview(overlay)
  reconcile()
  evidence?.record("actual_app_sibling_visible", ["granted": gate.activeLease != nil, "sdkActive": sdk?.isSessionReplayActive() ?? false])
 }
 func alternateWindowProbe() {
  guard let parent = ownedView?.window, let scene = parent.windowScene, alternateWindow == nil else { return }
  let other = UIWindow(windowScene: scene), controller = UIViewController()
  controller.view.backgroundColor = .cyan
  let label = UILabel(frame: CGRect(x: 20, y: 180, width: 340, height: 70))
  label.text = "SYNTHETIC_ACTUAL_APP_ALTERNATE_WINDOW"; label.numberOfLines = 2; controller.view.addSubview(label)
  let close = UIButton(type: .system); close.setTitle("Close actual-app alternate window — off", for: .normal)
  close.frame = CGRect(x: 20, y: 300, width: 340, height: 70)
  close.addAction(UIAction { [weak self, weak parent] _ in
   self?.alternateWindow?.isHidden = true; self?.alternateWindow = nil; parent?.makeKeyAndVisible()
   self?.evidence?.record("actual_app_alternate_closed_off")
  }, for: .touchUpInside)
  controller.view.addSubview(close); other.rootViewController = controller; alternateWindow = other; other.makeKeyAndVisible()
  evidence?.record("actual_app_alternate_visible", ["granted": gate.activeLease != nil, "sdkActive": sdk?.isSessionReplayActive() ?? false])
 }
 func flush() {
  reconcile(); guard gate.activeLease != nil, ownedView != nil else { return }
  evidence?.record("actual_app_explicit_local_flush"); sdk?.flush()
 }
}
