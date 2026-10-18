import ExpoModulesCore
import UIKit
import PostHog

public class InternalReplayModule:Module {
 public func definition()->ModuleDefinition {
  Name("DeriveInternalReplay")
  Events("actualAppReplayStopped")
  OnCreate {
   ActualAppReplayRuntime.shared.onStopped = { [weak self] nonce in self?.sendEvent("actualAppReplayStopped", ["nonce": nonce]) }
  }
  View(ActualAppReplayGuardView.self) {
   Prop("synthetic") { (view: ActualAppReplayGuardView, value: Bool) in view.setSynthetic(value) }
  }
  Function("actualAppAvailability") { ActualAppReplayRuntime.availability }
  AsyncFunction("actualAppPrepare") { ActualAppReplayRuntime.shared.prepare() }.runOnQueue(.main)
  AsyncFunction("actualAppStart") { (nonce: String, promise: Promise) in
   ActualAppReplayRuntime.shared.start(nonce) { promise.resolve($0) }
  }.runOnQueue(.main)
  Function("actualAppRevoke") { ActualAppReplayRuntime.shared.revoke() }
  AsyncFunction("actualAppFlush") { ActualAppReplayRuntime.shared.flush() }.runOnQueue(.main)
  AsyncFunction("actualAppTransientSiblingProbe") { (kind: String, promise: Promise) in
   ActualAppReplayRuntime.shared.transientSiblingProbe(kind) { promise.resolve($0) }
  }.runOnQueue(.main)
  AsyncFunction("actualAppSiblingProbe") { ActualAppReplayRuntime.shared.siblingProbe() }.runOnQueue(.main)
  AsyncFunction("actualAppAlternateWindowProbe") { ActualAppReplayRuntime.shared.alternateWindowProbe() }.runOnQueue(.main)

  Function("availability"){ReplayTestRuntime.availability}
  AsyncFunction("open"){(mode:String,host:String,token:String)->String in
   ReplayTestRuntime.shared.open(mode:mode,host:host,token:token)
  }.runOnQueue(.main)
 }
}

/// No normal app root is attached to the capture window while this surface records.
final class ReplayTestRuntime {
 static var availability:String {
  #if DEBUG
  return Bundle.main.bundleIdentifier=="com.derive.skincare.internalreplay" ? "available":"isolated_debug_bundle_required"
  #else
  return "release_disabled"
  #endif
 }
 static let shared=ReplayTestRuntime()
 var hasConfiguredSDK:Bool {configured}
 var ownsSurface:Bool {surface != nil}
 private let gate=ReplayAdmission(internalBuild:availability=="available",bundleIdentifier:Bundle.main.bundleIdentifier ?? "")
 private var configuredIdentity:String?,configured=false
 private var previousRoot:UIViewController?,window:UIWindow?,alternateWindow:UIWindow?,surface:ReplayDummyController?
 private var evidence:ReplayEvidence?,mode="local",host="",token=""
 private var notifications=[NSObjectProtocol]()
 private var suspendedDeveloperWindows=[UIWindow]()
 private init(){
  notifications.append(NotificationCenter.default.addObserver(forName:UIApplication.willResignActiveNotification,object:nil,queue:.main){[weak self] _ in self?.gate.setForeground(false);self?.stop("background")})
  notifications.append(NotificationCenter.default.addObserver(forName:UIApplication.didBecomeActiveNotification,object:nil,queue:.main){[weak self] _ in self?.gate.setForeground(true)})
  for name in [UIWindow.didResignKeyNotification,UIWindow.didBecomeKeyNotification,UIWindow.didBecomeVisibleNotification] {
   notifications.append(NotificationCenter.default.addObserver(forName:name,object:nil,queue:.main){[weak self] event in
    guard let self,self.surface != nil else{return}
    if !self.ownsCaptureWindow {self.stop("capture_window_changed")}
   })
  }
 }
 func open(mode:String,host:String,token:String)->String {
  guard Self.availability=="available",surface==nil,UIApplication.shared.applicationState == .active else{return "isolated_debug_build_required"}
  guard !ActualAppReplayRuntime.shared.hasConfiguredSDK else{return "restart_to_change_recorder"}
  guard mode=="local" || (mode=="posthog" && ["https://us.i.posthog.com","https://eu.i.posthog.com"].contains(host) && token.range(of:"^phc_[A-Za-z0-9_-]+$",options:.regularExpression) != nil) else{return "configuration_missing"}
  let origin=mode=="local" ? "https://127.0.0.1:49317":host
  // Keep pre-fix dummy queues intact in their old local-only storage namespace.
  let projectToken=mode=="local" ? "synthetic-internal-replay-local-only-mask-v2":token
  let identity=mode+origin+projectToken
  guard configuredIdentity==nil || configuredIdentity==identity else{return "restart_to_change_transport"}
  guard let window=UIApplication.shared.connectedScenes.compactMap({$0 as? UIWindowScene}).flatMap({$0.windows}).first(where:{$0.isKeyWindow}),let root=window.rootViewController else{return "window_unavailable"}
  self.mode=mode;self.host=origin;self.token=projectToken
  let evidence=ReplayEvidence();self.evidence=evidence
  ReplayTransport.configure(gate:gate,evidence:evidence,mode:mode,origin:origin,token:projectToken)
  hideDeveloperWindows()
  gate.enterSyntheticSurface()
  let screen=ReplayDummyController();screen.runtime=self;surface=screen
  root.view.endEditing(true)
  previousRoot=root;self.window=window;window.rootViewController=screen
  evidence.record("surface_opened",["mode":mode,"sdkSetup":configured,"active":false,"run":evidence.directory.lastPathComponent])
  return "opened"
 }
 private var ownsCaptureWindow:Bool {
  guard let screen=surface,let window,window.rootViewController===screen,window.isKeyWindow,!window.isHidden else{return false}
  let scenes=UIApplication.shared.connectedScenes.compactMap{$0 as? UIWindowScene}.filter{$0.activationState == .foregroundActive}
  guard scenes.count==1 else{return false}
  return scenes.flatMap{$0.windows}.allSatisfy{$0===window || ActualAppReplayRuntime.isDefinitelyHidden($0)}
   && ActualAppReplayRuntime.captureBranchIsExclusive(screen.view, in: window)
 }
 private func hideDeveloperWindows(){
  let known:Set<String>=["DevMenuFABWindow","DevMenuWindow"]
  let windows=UIApplication.shared.connectedScenes.compactMap{$0 as? UIWindowScene}.flatMap{$0.windows}
  var hidden=[String]()
  for other in windows where !other.isHidden {
   let name=String(reflecting:type(of:other)).split(separator:".").last.map(String.init) ?? ""
   guard known.contains(name),other !== window else{continue}
   if !suspendedDeveloperWindows.contains(where:{$0===other}){suspendedDeveloperWindows.append(other)}
   other.isHidden=true;hidden.append(name)
  }
  if !hidden.isEmpty{evidence?.record("developer_windows_suspended",["classes":hidden])}
 }
 func start(){
  guard let screen=surface,screen.synthetic else{return}
  screen.view.layoutIfNeeded()
  guard screen.maskBoundsReady else{stop("mask_geometry_unavailable");return}
  hideDeveloperWindows()
  stop("start_replaces_grant")
  guard Self.availability=="available",ownsCaptureWindow,UIApplication.shared.applicationState == .active else{stop("capture_boundary_unavailable");return}
  guard let lease=gate.explicitStart() else{return}
  evidence?.record("explicit_start",["lease":lease,"mode":mode])
  if !configured {
   let config=PostHogConfig(projectToken:token,host:host)
   config.deriveBeforeReplayCapture = { [weak self] capturedWindow in
    guard Thread.isMainThread, let self, let lease = self.gate.currentLease,
     self.gate.permitsSnapshots(lease), self.window === capturedWindow,
     self.ownsCaptureWindow, self.surface?.synthetic == true, self.surface?.maskBoundsReady == true,
     UIApplication.shared.applicationState == .active else {
     self?.stop("capture_boundary_denied"); return false
    }
    return true
   }
   config.rageClickConfig.enabled = false; config.captureAutocaptureElementText = false
   config.optOut=true;config.sessionReplay=false
   config.personProfiles = .never;config.disableGeoIp=true
   config.sessionReplayConfig.maskAllTextInputs=true;config.sessionReplayConfig.maskAllImages=true
   config.sessionReplayConfig.maskAllSandboxedViews=true
   config.sessionReplayConfig.captureTouches=false;config.sessionReplayConfig.captureLogs=false
   config.sessionReplayConfig.captureNetworkTelemetry=false
   config.sessionReplayConfig.screenshotMode=true;config.sessionReplayConfig.screenshotModeBackgroundCapture=false
   config.sessionReplayConfig.throttleDelay=0.3
   config.captureApplicationLifecycleEvents=false;config.captureScreenViews=false
   config.captureElementInteractions=false;config.captureSwiftUIElementInteractions=false
   config.capturePushNotificationSubscriptions=false;config.capturePushNotificationOpened=false
   config.errorTrackingConfig.autoCapture=false;config.surveys=false
   config.preloadFeatureFlags=false;config.sendFeatureFlagEvent=false
   config.setDefaultPersonProperties=false;config.featureFlagRequestMaxRetries=0
   config.flushAt=1000;config.maxBatchSize=1000;config.flushIntervalSeconds=300;config.compression = .none
   let session=URLSessionConfiguration.ephemeral;session.protocolClasses=[ReplayTransport.self]
   session.urlCache=nil;session.requestCachePolicy = .reloadIgnoringLocalAndRemoteCacheData
   session.httpCookieStorage=nil;session.urlCredentialStorage=nil;config.urlSessionConfiguration=session
   PostHogSDK.shared.setup(config);configured=true;configuredIdentity=mode+host+token
   // A persisted opt-in may have overridden config.optOut. Actual optOut reconciles it.
   PostHogSDK.shared.optOut()
   evidence?.record("sdk_setup_after_grant",["sessionReplay":false,"resolvedOptOut":PostHogSDK.shared.isOptOut(),"masks":true,"sdkVersion":"3.88.2"])
  }
  guard let nonce=gate.evaluationNonce(lease) else{stop("evaluation_unavailable");return}
  PostHogSDK.shared.resetPersonPropertiesForFlags(reloadFeatureFlags:false)
  PostHogSDK.shared.setPersonPropertiesForFlags(["$app_namespace":Bundle.main.bundleIdentifier ?? "",ReplayFlagPolicy.markerKey:true,ReplayFlagPolicy.nonceKey:nonce],reloadFeatureFlags:false)
  PostHogSDK.shared.optIn()
  PostHogSDK.shared.reloadFeatureFlags { [weak self] in
   DispatchQueue.main.async {
    guard let self,self.gate.permits(lease) else{return}
    // A completed callback may be a cache fallback; only the transport receipt grants.
    self.evidence?.record("flag_reload_finished",["lease":lease,"fresh":self.gate.permitsSnapshots(lease)])
   }
  }
  tryStart(lease:lease,attempt:0)
 }
 private func tryStart(lease:Int,attempt:Int){
  guard gate.permits(lease),let screen=surface,screen.synthetic,ownsCaptureWindow,UIApplication.shared.applicationState == .active else{return}
  guard screen.maskBoundsReady else{stop("mask_geometry_unavailable");return}
  let evaluated=gate.permitsSnapshots(lease)
  if evaluated {PostHogSDK.shared.startSessionRecording(resumeCurrent:false)}
  let active=evaluated && PostHogSDK.shared.isSessionReplayActive()
  evidence?.record("start_returned",["lease":lease,"active":active,"attempt":attempt])
  screen.setStatus(active ? "Recording dummy screen" : "Waiting for fresh flag and replay configuration…")
  if active {return}
  if attempt<24 {DispatchQueue.main.asyncAfter(deadline:.now()+0.25){[weak self] in self?.tryStart(lease:lease,attempt:attempt+1)}}
  else {stop("configuration_unavailable");screen.setStatus("Replay unavailable. Check existing project configuration.")}
 }
 func stop(_ reason:String){
  gate.revoke();ReplayTransport.revoke()
  if configured {
   PostHogSDK.shared.optOut();PostHogSDK.shared.stopSessionRecording()
   PostHogSDK.shared.resetPersonPropertiesForFlags(reloadFeatureFlags:false)
  }
  evidence?.record("stopped",["reason":reason,"active":configured ? PostHogSDK.shared.isSessionReplayActive():false,"sdkOptedOut":configured ? PostHogSDK.shared.isOptOut():true])
  surface?.setStatus("Recording off")
 }
 func flush(){
  guard let lease=gate.currentLease,gate.permitsSnapshots(lease),configured,surface?.synthetic==true else{return}
  evidence?.record("explicit_flush",["lease":lease]);PostHogSDK.shared.flush()
 }
 func exclude(){stop("excluded_surface");gate.excludeSurface();surface?.showExcluded();evidence?.record("excluded_surface_visible")}
 func returnToDummy(){stop("return_to_dummy");gate.enterSyntheticSurface();surface?.showDummy();evidence?.record("dummy_surface_visible_off")}
 func alternateWindowProbe(){
  guard let scene=window?.windowScene,alternateWindow==nil else{return}
  evidence?.record("before_alternate_window")
  let other=UIWindow(windowScene:scene),controller=UIViewController()
  controller.view.backgroundColor = .cyan
  let label=UILabel(frame:CGRect(x:20,y:180,width:340,height:60));label.text="SYNTHETIC_ALTERNATE_WINDOW_CANARY";label.numberOfLines=2;controller.view.addSubview(label)
  let button=UIButton(type:.system);button.setTitle("Return to test — recording off",for:.normal);button.frame=CGRect(x:20,y:300,width:340,height:60)
  button.addAction(UIAction{[weak self] _ in self?.alternateWindow?.isHidden=true;self?.alternateWindow=nil;self?.window?.makeKeyAndVisible();self?.evidence?.record("alternate_window_closed_off")},for:.touchUpInside)
  controller.view.addSubview(button);other.rootViewController=controller;alternateWindow=other;other.makeKeyAndVisible()
  evidence?.record("alternate_window_visible",["active":configured ? PostHogSDK.shared.isSessionReplayActive():false,"granted":gate.currentLease != nil])
 }
 func close(){
  stop("close_before_restore");gate.excludeSurface()
  alternateWindow?.isHidden=true;alternateWindow=nil
  let restored=previousRoot;surface=nil;previousRoot=nil
  window?.rootViewController=restored
  for other in suspendedDeveloperWindows{other.isHidden=false};suspendedDeveloperWindows.removeAll()
  window?.makeKeyAndVisible();window=nil
  evidence?.record("app_root_restored_off");evidence=nil
 }
 func pulse(_ tick:Int){evidence?.record("synthetic_tick",["tick":tick,"active":configured ? PostHogSDK.shared.isSessionReplayActive():false])}
}

final class ReplayDummyController:UIViewController {
 weak var runtime:ReplayTestRuntime?
 private(set) var synthetic=true
 private let titleLabel=UILabel(),status=UILabel(),dummy=UILabel(),input=UITextField(),picture=UIImageView(),privateRegion=UIView()
 private let maskGuard=UIView(),sensitiveContent=UIStackView()
 private var timer:Timer?,tick=0
 // The pinned SDK rounds masks by 10 points. Keep every sensitive pixel at least
 // 12 points inside this additional mask; rounded outer corners contain clear padding.
 var maskBoundsReady:Bool {
  maskGuard.window != nil && maskGuard.clipsToBounds && sensitiveContent.clipsToBounds
   && sensitiveContent.bounds.width>0 && sensitiveContent.bounds.height>0
   && maskGuard.bounds.insetBy(dx:12,dy:12).contains(sensitiveContent.frame)
 }
 override func viewDidLoad(){
  super.viewDidLoad();view.backgroundColor = .white
  titleLabel.text="Internal dummy replay";titleLabel.font = .boldSystemFont(ofSize:23)
  status.text="Recording off — Start required";status.accessibilityIdentifier="internal-replay-status"
  dummy.text="SYNTHETIC_LABEL_4141"
  input.text="SYNTHETIC_INPUT_5252";input.isUserInteractionEnabled=false;input.borderStyle = .roundedRect
  picture.image=UIGraphicsImageRenderer(size:CGSize(width:140,height:65)).image{ctx in UIColor.green.setFill();ctx.fill(CGRect(x:0,y:0,width:140,height:65))}
  picture.clipsToBounds=true
  privateRegion.backgroundColor = .magenta;privateRegion.accessibilityLabel="ph-no-capture";privateRegion.clipsToBounds=true
  let privateText=UILabel();privateText.text="SYNTHETIC_PRIVATE_9292";privateText.frame=CGRect(x:5,y:5,width:300,height:40);privateRegion.addSubview(privateText)
  let note=UILabel();note.text="Generated data only. Masks stay on. Stop blocks new uploads; already-sent dummy data may remain. Queued dummy frames may send after another Start.";note.numberOfLines=0;note.font = .systemFont(ofSize:13)
  let start=button("Start dummy recording","internal-replay-start"){[weak self] in self?.runtime?.start()}
  let stop=button("Stop recording","internal-replay-stop"){[weak self] in self?.runtime?.stop("explicit_stop")}
  let flush=button("Send queued dummy frames","internal-replay-flush"){[weak self] in self?.runtime?.flush()}
  let exclude=button("Show excluded screen","internal-replay-exclude"){[weak self] in self?.runtime?.exclude()}
  let returnButton=button("Return to dummy screen","internal-replay-return"){[weak self] in self?.runtime?.returnToDummy()}
  let alternate=button("Test alternate window","internal-replay-alternate"){[weak self] in self?.runtime?.alternateWindowProbe()}
  let close=button("Close test","internal-replay-close"){[weak self] in self?.runtime?.close()}
  for item in [dummy,input,picture,privateRegion]{sensitiveContent.addArrangedSubview(item)}
  sensitiveContent.axis = .vertical;sensitiveContent.spacing=10;sensitiveContent.translatesAutoresizingMaskIntoConstraints=false;sensitiveContent.clipsToBounds=true
  maskGuard.accessibilityIdentifier="internal-replay-sensitive-region ph-no-capture";maskGuard.clipsToBounds=true;maskGuard.addSubview(sensitiveContent)
  NSLayoutConstraint.activate([sensitiveContent.topAnchor.constraint(equalTo:maskGuard.topAnchor,constant:12),sensitiveContent.bottomAnchor.constraint(equalTo:maskGuard.bottomAnchor,constant:-12),sensitiveContent.leadingAnchor.constraint(equalTo:maskGuard.leadingAnchor,constant:12),sensitiveContent.trailingAnchor.constraint(equalTo:maskGuard.trailingAnchor,constant:-12)])
  // Empty fixture space permits a partially visible sensitive-region scroll probe.
  let scrollProbeSpace=UIView();scrollProbeSpace.heightAnchor.constraint(equalToConstant:300).isActive=true
  let stack=UIStackView(arrangedSubviews:[titleLabel,status,note,maskGuard,start,stop,flush,exclude,returnButton,alternate,close,scrollProbeSpace]);stack.axis = .vertical;stack.spacing=10;stack.translatesAutoresizingMaskIntoConstraints=false
  let scroll=UIScrollView();scroll.translatesAutoresizingMaskIntoConstraints=false;view.addSubview(scroll);scroll.addSubview(stack)
  NSLayoutConstraint.activate([scroll.topAnchor.constraint(equalTo:view.safeAreaLayoutGuide.topAnchor),scroll.bottomAnchor.constraint(equalTo:view.safeAreaLayoutGuide.bottomAnchor),scroll.leadingAnchor.constraint(equalTo:view.leadingAnchor),scroll.trailingAnchor.constraint(equalTo:view.trailingAnchor),stack.topAnchor.constraint(equalTo:scroll.contentLayoutGuide.topAnchor,constant:12),stack.bottomAnchor.constraint(equalTo:scroll.contentLayoutGuide.bottomAnchor,constant:-12),stack.leadingAnchor.constraint(equalTo:scroll.contentLayoutGuide.leadingAnchor,constant:24),stack.trailingAnchor.constraint(equalTo:scroll.contentLayoutGuide.trailingAnchor,constant:-24),stack.widthAnchor.constraint(equalTo:scroll.frameLayoutGuide.widthAnchor,constant:-48),picture.heightAnchor.constraint(equalToConstant:65),privateRegion.heightAnchor.constraint(equalToConstant:55)])
  for control in [start,stop,flush,exclude,returnButton,alternate,close]{control.heightAnchor.constraint(equalToConstant:40).isActive=true}
  timer=Timer.scheduledTimer(withTimeInterval:0.5,repeats:true){[weak self] _ in guard let self else{return};self.tick+=1;self.view.backgroundColor=UIColor(white:self.tick%2==0 ? 0.98:0.9,alpha:1);self.runtime?.pulse(self.tick)}
 }
 override func viewDidLayoutSubviews(){super.viewDidLayoutSubviews();if !maskBoundsReady{runtime?.stop("mask_geometry_unavailable")}}
 override func viewWillDisappear(_ animated:Bool){super.viewWillDisappear(animated);runtime?.stop("surface_disappeared")}
 deinit{timer?.invalidate()}
 func setStatus(_ value:String){status.text=value}
 func showExcluded(){synthetic=false;dummy.text="SYNTHETIC_EXCLUDED_6363";input.text="SYNTHETIC_EXCLUDED_7474";titleLabel.text="Excluded dummy screen"}
 func showDummy(){synthetic=true;dummy.text="SYNTHETIC_LABEL_4141";input.text="SYNTHETIC_INPUT_5252";titleLabel.text="Internal dummy replay"}
 private func button(_ text:String,_ identifier:String,_ action:@escaping()->Void)->UIButton {
  let b=UIButton(type:.system);b.setTitle(text,for:.normal);b.accessibilityIdentifier=identifier;b.addAction(UIAction{_ in action()},for:.touchUpInside);return b
 }
}
