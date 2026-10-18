import Foundation

@main struct ActualAppReplayAdmissionTests {
 static func main() {
  var count = 0
  func check(_ value: @autoclosure () -> Bool) { if !value() { print("FAIL at assertion \(count + 1)"); exit(1) }; count += 1 }
  var time: TimeInterval = 10
  let gate = ActualAppReplayAdmission(internalBuild: true, clock: {time})
  check(gate.prepare() == nil); check(gate.activeLease == nil)
  gate.update(surfaceReady: true, foreground: true)
  let nonce = gate.prepare()!; check(gate.activeLease == nil)
  check(gate.start("wrong") == nil)
  let first = gate.start(nonce)!; check(gate.permits(first)); check(gate.start(nonce) == nil)
  gate.revoke(); check(!gate.permits(first)); check(gate.start(nonce) == nil)
  let secondNonce = gate.prepare()!, second = gate.start(secondNonce)!
  check(!gate.permits(first)); check(gate.permits(second))
  gate.update(surfaceReady: false, foreground: true); check(!gate.permits(second)); check(gate.prepare() == nil)
  gate.update(surfaceReady: true, foreground: true); check(gate.activeLease == nil)
  let third = gate.start(gate.prepare()!)!; gate.update(surfaceReady: true, foreground: false)
  check(!gate.permits(third)); gate.update(surfaceReady: true, foreground: true); check(gate.activeLease == nil)
  let expiredNonce = gate.prepare()!; time += 121; check(gate.start(expiredNonce) == nil)
  let fourth = gate.start(gate.prepare()!)!; time += 121; check(!gate.permits(fourth))
  var ran = false; check(!gate.withPermit(fourth) {ran = true}); check(!ran)
  let ordinary = ActualAppReplayAdmission(internalBuild: false)
  ordinary.update(surfaceReady: true, foreground: true); check(ordinary.prepare() == nil); check(ordinary.activeLease == nil)
  let frameGate = ActualAppReplayAdmission(internalBuild: true)
  frameGate.update(surfaceReady: true, foreground: true)
  let oldTimestamp = Date().timeIntervalSince1970 - 10
  let frameLease = frameGate.start(frameGate.prepare()!)!
  check(frameGate.permitsFrame(frameLease, timestamp: Date().timeIntervalSince1970))
  check(!frameGate.permitsFrame(frameLease, timestamp: oldTimestamp))
  check(!frameGate.permitsFrame(frameLease, timestamp: .infinity))
  check(!frameGate.permitsFrame(frameLease, timestamp: Date().timeIntervalSince1970+60))
  frameGate.revoke(); check(!frameGate.permitsFrame(frameLease, timestamp: Date().timeIntervalSince1970))
  let nextLease = frameGate.start(frameGate.prepare()!)!
  check(!frameGate.permitsFrame(frameLease, timestamp: Date().timeIntervalSince1970))
  check(frameGate.permitsFrame(nextLease, timestamp: Date().timeIntervalSince1970))
  print("ACTUAL_APP_ADMISSION_PASS: \(count) assertions; no SDK or network")
 }
}
