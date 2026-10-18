import Foundation

@main struct ActualAppReplayLocalTransportTests {
 static func main() async {
  var count = 0
  func check(_ value: @autoclosure () -> Bool) { if !value() { print("FAIL at assertion \(count + 1)"); exit(1) }; count += 1 }
  let origin = ActualAppReplayLocalPolicy.origin, token = ActualAppReplayLocalPolicy.token
  func request(_ address: String, _ method: String = "GET") -> URLRequest {
   var value = URLRequest(url: URL(string: address)!); value.httpMethod = method; return value
  }
  check(ActualAppReplayLocalPolicy.endpoint(request(origin+"/array/"+token+"/config")) == "config")
  check(ActualAppReplayLocalPolicy.endpoint(request(origin+"/s/", "POST")) == "snapshot")
  for url in ["https://us.i.posthog.com/s/", "https://eu.i.posthog.com/s/", "http://127.0.0.1:49318/s/", "https://127.0.0.1:49319/s/", origin+"/i/v0/e/", origin+"/s/?secret=value", origin+"/s/#x", "https://user:password@127.0.0.1:49318/s/", origin+"/flags/?v=2"] {
   check(ActualAppReplayLocalPolicy.endpoint(request(url,"POST")) == nil)
  }
  check(ActualAppReplayLocalPolicy.endpoint(request(origin+"/s/")) == nil)
  check(ActualAppReplayLocalPolicy.endpoint(request(origin+"/array/"+token+"/config","POST")) == nil)
  // Match PostHogApi.getEndpointURL's zero-item URLComponents query exactly.
  var uploadURL = URLComponents(string: origin)!; uploadURL.path = "/s/"; uploadURL.queryItems = []
  let uploadRequest = request(uploadURL.url!.absoluteString, "POST")
  check(ActualAppReplayLocalPolicy.endpoint(uploadRequest) == "snapshot")
  let gate = ActualAppReplayAdmission(internalBuild: true)
  gate.update(surfaceReady: true, foreground: true); _ = gate.start(gate.prepare()!)
  let sink = SnapshotSink()
  ActualAppReplayLocalTransport.configure(gate: gate, snapshot: { _, _ in sink.increment() }, fact: { _, _ in })
  let config = URLSessionConfiguration.ephemeral; config.protocolClasses = [ActualAppReplayLocalTransport.self]
  config.urlCache = nil; config.httpCookieStorage = nil; config.urlCredentialStorage = nil
  let session = URLSession(configuration: config)
  func accepted(_ request: URLRequest) async -> Bool {
   do { let (_, response) = try await session.data(for: request); return (response as? HTTPURLResponse)?.statusCode == 200 }
   catch { return false }
  }
  let configAccepted = await accepted(request(origin+"/array/"+token+"/config")); check(configAccepted)
  var snapshot = request(origin+"/s/", "POST"); snapshot.httpBody = Data("[{\"event\":\"$snapshot\",\"api_key\":\"SYNTHETIC_ONLY\"}]".utf8)
  let snapshotAccepted = await accepted(snapshot); check(snapshotAccepted); check(sink.value == 1)
  let uploadBody = Data("[{\"event\":\"$snapshot\",\"api_key\":\"SYNTHETIC_ONLY\"}]".utf8)
  let uploadAccepted: Bool
  do { let (_, response) = try await session.upload(for: uploadRequest, from: uploadBody); uploadAccepted = (response as? HTTPURLResponse)?.statusCode == 200 }
  catch { uploadAccepted = false }
  check(uploadAccepted); check(sink.value == 2)
  var event = snapshot; event.httpBody = Data("[{\"event\":\"app_opened\"}]".utf8)
  let eventAccepted = await accepted(event); check(!eventAccepted); check(sink.value == 2)
  gate.revoke(); let revokedAccepted = await accepted(snapshot); check(!revokedAccepted); check(sink.value == 2)
  session.invalidateAndCancel()
  print("ACTUAL_APP_LOCAL_POLICY_PASS: \(count) assertions; hosted origins and arbitrary endpoints denied")
 }
}

private final class SnapshotSink: @unchecked Sendable {
 private let lock = NSLock(); private var count = 0
 func increment() { lock.lock(); count += 1; lock.unlock() }
 var value: Int { lock.lock(); defer { lock.unlock() }; return count }
}
