import Foundation

enum ActualAppReplayLocalPolicy {
 static let origin = "https://127.0.0.1:49318"
 static let token = "synthetic-actual-app-replay-local-v3-capture-final"
 static func endpoint(_ request: URLRequest) -> String? {
  guard let url = request.url, url.scheme == "https", url.host == "127.0.0.1", url.port == 49318,
   url.user == nil, url.password == nil, url.fragment == nil, (url.query == nil || url.query == "") else { return nil }
  if request.httpMethod == "GET", url.path == "/array/"+token+"/config" { return "config" }
  if request.httpMethod == "POST", (url.path == "/s" || url.path == "/s/") { return "snapshot" }
  return nil
 }
}

/// This URLProtocol always intercepts. It has no forwarding URLSession, host input,
/// credentials or redirect path. Even an unexpected SDK request is denied locally.
final class ActualAppReplayLocalTransport: URLProtocol {
 private static let lock = NSLock()
 private static var gate: ActualAppReplayAdmission?
 private static var snapshot: ((Data, String) -> Void)?
 private static var fact: ((String, [String: Any]) -> Void)?
 private var cancelled = false
 private let ownLock = NSLock()
 static func configure(gate: ActualAppReplayAdmission, snapshot: @escaping (Data, String) -> Void,
                       fact: @escaping (String, [String: Any]) -> Void) {
  lock.lock(); self.gate = gate; self.snapshot = snapshot; self.fact = fact; lock.unlock()
 }
 override class func canInit(with request: URLRequest) -> Bool { true }
 override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
 override func startLoading() {
  Self.lock.lock(); let gate = Self.gate, snapshot = Self.snapshot, fact = Self.fact; Self.lock.unlock()
  let id = UUID().uuidString
  func deny() { fact?("local_request_denied", ["id": id]); client?.urlProtocol(self, didFailWithError: URLError(.cancelled)) }
  guard let endpoint = ActualAppReplayLocalPolicy.endpoint(request), let gate, let lease = gate.activeLease else { deny(); return }
  let response: Data
  if endpoint == "snapshot" {
   guard let body = boundedBody(), !body.isEmpty, body.count <= 16*1024*1024,
    let events = (try? JSONSerialization.jsonObject(with: body)) as? [[String: Any]],
    !events.isEmpty, events.allSatisfy({ $0["event"] as? String == "$snapshot" }) else { deny(); return }
   guard gate.withPermit(lease, { snapshot?(body, id); fact?("local_snapshot_accepted", ["id": id, "lease": lease, "bytes": body.count]) }) else { deny(); return }
   response = Data("{\"status\":1}".utf8)
  } else {
   guard gate.withPermit(lease, { fact?("local_config_accepted", ["id": id, "lease": lease]) }) else { deny(); return }
   let value: [String: Any] = ["sessionRecording": ["endpoint": "/s/", "sampleRate": 1.0, "minimumDurationMilliseconds": 0],
    "autocaptureExceptions": false, "surveys": [], "capturePerformance": false, "supportedCompression": [], "hasFeatureFlags": false]
   response = (try? JSONSerialization.data(withJSONObject: value)) ?? Data()
  }
  ownLock.lock(); let cancelled = self.cancelled; ownLock.unlock()
  guard !cancelled, gate.permits(lease), let url = request.url,
   let http = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": "application/json", "Cache-Control": "no-store"]) else { deny(); return }
  client?.urlProtocol(self, didReceive: http, cacheStoragePolicy: .notAllowed)
  client?.urlProtocol(self, didLoad: response); client?.urlProtocolDidFinishLoading(self)
 }
 private func boundedBody() -> Data? {
  if let data = request.httpBody { return data.count <= 16*1024*1024 ? data : nil }
  guard let stream = request.httpBodyStream else { return nil }
  stream.open(); defer { stream.close() }
  var data = Data(), buffer = [UInt8](repeating: 0, count: 16384)
  while stream.hasBytesAvailable {
   let size = stream.read(&buffer, maxLength: buffer.count)
   if size < 0 { return nil }; if size == 0 { break }
   guard data.count+size <= 16*1024*1024 else { return nil }; data.append(buffer, count: size)
  }
  return data
 }
 override func stopLoading() { ownLock.lock(); cancelled = true; ownLock.unlock() }
}
