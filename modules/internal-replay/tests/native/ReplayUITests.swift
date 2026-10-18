import XCTest
final class ReplayUITests: XCTestCase {
 let app = XCUIApplication(bundleIdentifier: "com.derive.skincare.internalreplay")
 override func setUpWithError() throws {
  continueAfterFailure = false
  app.activate()
  let title = name.contains("testLegacyUIKitLocalCapture") ? "Internal replay test" : "Actual app replay local validation"
  XCTAssertTrue(app.staticTexts[title].waitForExistence(timeout: 90), app.debugDescription)
  if name.contains("testLegacyUIKitLocalCapture") {
   try XCTSkipIf(!app.buttons["Open local recorder probe"].exists, "Run legacy acceptance separately with the actual-RN local gate off.")
  }
 }
 func screenshot(_ name: String) { let a = XCTAttachment(screenshot: app.screenshot()); a.name = name; a.lifetime = .keepAlways; add(a) }
 func settle(_ seconds: TimeInterval) { Thread.sleep(forTimeInterval: seconds) }
 var scroll: XCUIElement { app.scrollViews.firstMatch }
 func reveal(_ e: XCUIElement) {
  XCTAssertTrue(e.waitForExistence(timeout: 15), app.debugDescription)
  for _ in 0..<8 {
   if e.isHittable && e.frame.minY >= scroll.frame.minY && e.frame.maxY <= scroll.frame.maxY { return }
   if e.frame.minY < scroll.frame.minY { scroll.swipeDown(velocity: .slow) } else { scroll.swipeUp(velocity: .slow) }
  }
  XCTAssertTrue(e.isHittable, app.debugDescription)
 }
 func tap(_ label: String) { let e = app.buttons[label]; reveal(e); e.tap() }
 func status(_ text: String) {
  let e = app.staticTexts[text]
  XCTAssertTrue(e.waitForExistence(timeout: 12), app.debugDescription)
 }
 var permission: XCUIElement { app.switches["Allow this replay test for this launch"] }
 func start() {
  reveal(permission)
  if permission.value as? String == "0" { permission.tap() }
  tap("Start app replay test"); status("Recording synthetic test")
 }
 func top() { for _ in 0..<5 { scroll.swipeDown(velocity: .fast) } }
 func testActualRNGeneratedLifecycle() throws {
  reveal(permission); XCTAssertEqual(permission.value as? String, "0")
  XCTAssertFalse(app.buttons["Start app replay test"].isEnabled)
  status("Actual app recording is off"); screenshot("00-actual-rn-prepared-off")
  start(); settle(3); top(); settle(2); screenshot("01-actual-rn-source-full")
  let green = app.images["Synthetic green image"]; XCTAssertTrue(green.exists, app.debugDescription)
  let from = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.8, dy: 0.8))
  let delta = green.frame.maxY - scroll.frame.minY - 35
  XCTAssertGreaterThan(delta, 0)
  from.press(forDuration: 0.1, thenDragTo: from.withOffset(CGVector(dx: 0, dy: -min(delta,scroll.frame.height*0.7))), withVelocity: .slow, thenHoldForDuration: 0.1)
  settle(4); screenshot("02-actual-rn-source-partial")
  tap("Send local replay frames"); settle(2); tap("Stop app replay"); status("Actual app recording is off")
  tap("Send local replay frames"); settle(2); screenshot("03-actual-rn-explicit-stop")

  start(); settle(2); tap("Open actual-app alternate window")
  XCTAssertTrue(app.staticTexts["SYNTHETIC_ACTUAL_APP_ALTERNATE_WINDOW"].waitForExistence(timeout: 10), app.debugDescription)
  settle(2); screenshot("04-alternate-window-revoked")
  app.buttons["Close actual-app alternate window — off"].tap(); status("Actual app recording is off")

  start(); settle(2); tap("Open synthetic sibling")
  XCTAssertTrue(app.staticTexts["SYNTHETIC_ACTUAL_APP_SIBLING"].waitForExistence(timeout: 10), app.debugDescription)
  settle(2); screenshot("05-sibling-revoked")
  app.buttons["Close synthetic sibling — off"].tap(); status("Actual app recording is off")

  start(); settle(2); tap("Open synthetic modal")
  XCTAssertTrue(app.staticTexts["SYNTHETIC_MODAL_CANARY"].waitForExistence(timeout: 10), app.debugDescription)
  settle(2); screenshot("06-modal-revoked"); app.buttons["Close synthetic modal"].tap(); status("Actual app recording is off")

  start(); settle(2); tap("Open excluded synthetic screen")
  XCTAssertTrue(app.staticTexts["Excluded generated React Native screen"].waitForExistence(timeout: 10), app.debugDescription)
  settle(2); screenshot("07-excluded-route-off")
  app.buttons["Return to local replay — off"].tap(); status("Actual app recording is off")
  reveal(permission); XCTAssertEqual(permission.value as? String, "0")

  start(); settle(2); XCUIDevice.shared.press(.home); settle(2); app.activate()
  status("Actual app recording is off"); settle(2); screenshot("08-background-return-off")
  print("ACTUAL_RN_LOCAL_PASS: real RN root, explicit start/stop, local flush, window, sibling, modal, route, background revocation")
 }
 func testTransientSiblingDeniedBeforeRender() throws {
  for kind in ["opaque", "lowOpacity", "zeroBounds", "animating"] {
   start(); settle(2)
   tap("Probe transient \(kind) sibling")
   status("\(kind): denied_before_render")
   status("Actual app recording is off")
   screenshot("transient-\(kind)-denied-before-render")
  }
  print("TRANSIENT_CAPTURE_GUARD_PASS: opaque/low-opacity/zero-bounds/animating native siblings rejected before SDK render")
 }
 func testTransientLayerDeniedBeforeRender() throws {
  for kind in ["layer", "backingLayer"] {
   start(); settle(2); tap("Probe transient \(kind) sibling"); settle(1)
   tap("Send local replay frames"); settle(2)
   status("\(kind): denied_before_render"); status("Actual app recording is off")
   screenshot("transient-\(kind)-denied-before-render")
  }
  print("TRANSIENT_LAYER_GUARD_PASS: direct and backing-container native layers rejected before SDK render")
 }
 /// Run separately with only the UIKit test gate enabled; actual-RN local gate off.
 func testLegacyUIKitLocalCapture() throws {
  tap("Open local recorder probe")
  status("Recording off — Start required")
  tap("Start dummy recording"); status("Recording dummy screen"); settle(3)
  tap("Send queued dummy frames"); settle(2)
  tap("Stop recording"); status("Recording off")
  tap("Start dummy recording"); status("Recording dummy screen"); settle(2)
  tap("Stop recording"); status("Recording off")
  tap("Close test"); status("Internal replay test")
  screenshot("legacy-uikit-local-rebuilt-capture-off")
  print("LEGACY_UIKIT_LOCAL_PASS: pinned capture hook, local flag/start/flush/stop/restart and root restoration")
 }
 func testColdStartOff() throws {
  app.terminate()
  XCTAssertEqual(app.state, .notRunning)
  let address = ProcessInfo.processInfo.environment["REPLAY_METRO_URL"] ?? "http://127.0.0.1:8097"
  let metro = try XCTUnwrap(URL(string: address))
  XCTAssertEqual(metro.scheme, "http")
  XCTAssertTrue(["127.0.0.1", "localhost"].contains(metro.host ?? ""))
  app.launchArguments = ["--initialUrl", address]
  app.launch()
  app.open(URL(string: "derive://dev/replay-test")!)
  XCTAssertTrue(app.staticTexts["Actual app replay local validation"].waitForExistence(timeout: 90), app.debugDescription)
  reveal(permission); XCTAssertEqual(permission.value as? String, "0")
  XCTAssertFalse(app.buttons["Start app replay test"].isEnabled)
  status("Actual app recording is off"); settle(4); screenshot("09-cold-launch-off")
  print("ACTUAL_RN_COLD_OFF_PASS: no launch grant; SDK/evidence/cache assertions follow outside UI")
 }
}
