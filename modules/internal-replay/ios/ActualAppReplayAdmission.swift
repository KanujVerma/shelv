import Foundation

/// Admission for a generated React Native surface. It has no hosted mode.
final class ActualAppReplayAdmission {
 private let lock = NSLock()
 private let internalBuild: Bool, clock: () -> TimeInterval
 private let wallClock: () -> TimeInterval
 private var eligible = false, foreground = false, recording = false
 private var nonce: String?, lease = 0, expires: TimeInterval = 0, startedWall: TimeInterval = 0
 init(internalBuild: Bool, clock: @escaping () -> TimeInterval = {ProcessInfo.processInfo.systemUptime}, wallClock: @escaping () -> TimeInterval = {Date().timeIntervalSince1970}) {
  self.internalBuild = internalBuild; self.clock = clock; self.wallClock = wallClock
 }
 func update(surfaceReady: Bool, foreground: Bool) {
  lock.lock(); defer { lock.unlock() }
  self.eligible = surfaceReady; self.foreground = foreground
  if !surfaceReady || !foreground { clear() }
 }
 private func clear() { lease += 1; nonce = nil; recording = false; expires = 0; startedWall = 0 }
 func prepare() -> String? {
  lock.lock(); defer { lock.unlock() }
  guard internalBuild, eligible, foreground else { return nil }
  clear(); let value = UUID().uuidString; nonce = value; expires = clock() + 120; return value
 }
 func start(_ value: String) -> Int? {
  lock.lock(); defer { lock.unlock() }
  guard internalBuild, eligible, foreground, value == nonce, !recording, clock() < expires else { return nil }
  startedWall = wallClock(); guard startedWall.isFinite else { clear(); return nil }; recording = true; return lease
 }
 func revoke() { lock.lock(); clear(); lock.unlock() }
 var currentNonce: String? { lock.lock(); defer { lock.unlock() }; return nonce }
 var activeLease: Int? {
  lock.lock(); defer { lock.unlock() }
  return internalBuild && eligible && foreground && recording && clock() < expires ? lease : nil
 }
 func permits(_ expected: Int) -> Bool { activeLease == expected }
 func permitsFrame(_ expected: Int, timestamp: TimeInterval) -> Bool {
  lock.lock(); defer { lock.unlock() }
  let now = wallClock()
  return internalBuild && eligible && foreground && recording && clock() < expires && lease == expected
   && timestamp.isFinite && now.isFinite && now >= startedWall && timestamp >= startedWall && timestamp <= now+1
 }
 func matches(_ expected: Int) -> Bool { lock.lock(); defer { lock.unlock() }; return recording && lease == expected }
 @discardableResult func withPermit(_ expected: Int, _ action: () -> Void) -> Bool {
  lock.lock(); defer { lock.unlock() }
  guard internalBuild, eligible, foreground, recording, clock() < expires, lease == expected else { return false }
  action(); return true
 }
}
