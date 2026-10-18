import Foundation
@main struct TransportTests {
 static func main() async throws {
  var checks=0
  func check(_ value:Bool,_ label:String){if !value{print("FAIL: "+label);exit(1)};checks+=1}
  let token="phc_SYNTHETIC_SHAPE_ONLY",origin="https://127.0.0.1:49317"
  func endpoint(_ url:String,_ host:String)->String?{ReplayRequestPolicy.endpoint(URL(string:url)!,origin:host,token:token)}
  check(endpoint("https://us-assets.i.posthog.com/array/"+token+"/config","https://us.i.posthog.com")=="config","US asset config")
  check(endpoint("https://eu-assets.i.posthog.com/array/"+token+"/config","https://eu.i.posthog.com")=="config","EU asset config")
  check(endpoint("https://us.i.posthog.com/flags/?v=2","https://us.i.posthog.com")=="flags","exact SDK US flags route")
  check(endpoint("https://eu.i.posthog.com/flags/?v=2","https://eu.i.posthog.com")=="flags","exact SDK EU flags route")
  for url in ["https://us-assets.i.posthog.com/s/","https://eu-assets.i.posthog.com/array/"+token+"/config","https://us-assets.i.posthog.com.evil.invalid/array/"+token+"/config","https://user@us.i.posthog.com/s/","https://us.i.posthog.com:444/s/","https://us.i.posthog.com/i/v0/e/","https://us-assets.i.posthog.com/array/wrong/config","https://us.i.posthog.com/flags","https://us.i.posthog.com/flags/?v=1","https://us.i.posthog.com/flags/?v=2&other=1","https://us-assets.i.posthog.com/flags/?v=2","https://eu.i.posthog.com/flags/?v=2","https://us.i.posthog.com/flags/?v=2&v=2"] {
   check(endpoint(url,"https://us.i.posthog.com")==nil,"wrong origin, credentials, port, path or query denied")
  }
  check(endpoint("https://us.i.posthog.com/s/","https://us.i.posthog.com")=="snapshot","snapshot route")
  let gate=ReplayAdmission(internalBuild:true);gate.enterSyntheticSurface();let lease=gate.explicitStart()!,nonce=gate.evaluationNonce(lease)!
  let directory=URL(fileURLWithPath:CommandLine.arguments[1]),evidence=ReplayEvidence(directory:URL(fileURLWithPath:CommandLine.arguments[1]))
  ReplayTransport.configure(gate:gate,evidence:evidence,mode:"local",origin:origin,token:token)
  let cfg=URLSessionConfiguration.ephemeral;cfg.protocolClasses=[ReplayTransport.self];cfg.urlCache=nil
  let session=URLSession(configuration:cfg);defer{session.invalidateAndCancel()}
  func blocked(_ request:URLRequest,_ label:String) async {
   do{_=try await session.data(for:request);check(false,label)}catch{check(true,label)}
  }
  let (_,response)=try await session.data(from:URL(string:origin+"/array/"+token+"/config")!)
  check((response as? HTTPURLResponse)?.statusCode==200,"local config accepted")
  var snapshot=URLRequest(url:URL(string:origin+"/s/")!);snapshot.httpMethod="POST"
  snapshot.httpBody=try JSONSerialization.data(withJSONObject:[["event":"$snapshot","api_key":token,"properties":["synthetic":true]]])
  await blocked(snapshot,"snapshot requires a fresh evaluation despite an explicit Start and config")
  func flagBody(_ nonce:String)->[String:Any] {
   ["api_key":token,"distinct_id":UUID().uuidString,"$device_id":UUID().uuidString,"timezone":"UTC","groups":[:],"geoip_disable":true,
    "person_properties":["$app_namespace":ReplayFlagPolicy.bundleIdentifier,ReplayFlagPolicy.markerKey:true,ReplayFlagPolicy.nonceKey:nonce]]
  }
  let good=flagBody(nonce)
  let cleaned=ReplayFlagPolicy.requestBody(try JSONSerialization.data(withJSONObject:good),token:token,nonce:nonce)!
  let wire=try JSONSerialization.jsonObject(with:cleaned) as! [String:Any]
  check(Set(wire.keys)==["api_key","distinct_id","groups","geoip_disable","person_properties"],"only minimal SDK evaluation fields leave")
  check(wire["timezone"]==nil && wire["$device_id"]==nil,"device ID/timezone stripped")
  for change:[String:Any] in [
   ["api_key":"wrong"],["distinct_id":"SYNTHETIC_EMAIL@example.invalid"],["groups":["account":"SYNTHETIC_ACCOUNT"]],
   ["geoip_disable":false],["event":"$exception"],["person_properties":["skin":"SYNTHETIC_CONTEXT"]],
   ["person_properties":["$app_namespace":"com.derive.skincare",ReplayFlagPolicy.markerKey:true,ReplayFlagPolicy.nonceKey:nonce]],
   ["person_properties":["$app_namespace":ReplayFlagPolicy.bundleIdentifier,ReplayFlagPolicy.markerKey:1,ReplayFlagPolicy.nonceKey:nonce]],
   ["person_properties":["$app_namespace":ReplayFlagPolicy.bundleIdentifier,ReplayFlagPolicy.markerKey:true,ReplayFlagPolicy.nonceKey:UUID().uuidString]],
   ["person_properties":["$app_namespace":ReplayFlagPolicy.bundleIdentifier,ReplayFlagPolicy.markerKey:true,ReplayFlagPolicy.nonceKey:nonce,"photo":"SYNTHETIC_PHOTO"]],
   ["$device_id":"SYNTHETIC_CONTEXT"]
  ] {
   var bad=good;bad.merge(change){_,new in new}
   check(ReplayFlagPolicy.requestBody(try JSONSerialization.data(withJSONObject:bad),token:token,nonce:nonce)==nil,"unapproved evaluation data denied")
  }
  func flags(_ row:[String:Any])->URLRequest {
   var request=URLRequest(url:URL(string:origin+"/flags/?v=2")!);request.httpMethod="POST"
   request.httpBody=try! JSONSerialization.data(withJSONObject:row);return request
  }
  let staleRequest=flags(flagBody(UUID().uuidString))
  await blocked(staleRequest,"wrong generated nonce cannot evaluate")
  var wrongMethod=flags(good);wrongMethod.httpMethod="GET"
  await blocked(wrongMethod,"flags GET denied")
  _=try await session.data(for:flags(good))
  check(gate.permitsSnapshots(lease),"actual local response grants only matching lease")
  _=try await session.data(for:snapshot)
  var wrongEvent=snapshot;wrongEvent.httpBody=try JSONSerialization.data(withJSONObject:[["event":"$exception","message":"SYNTHETIC_ERROR"]])
  await blocked(wrongEvent,"exception event cannot cross replay transport")
  var wrongSnapshotMethod=snapshot;wrongSnapshotMethod.httpMethod="GET"
  await blocked(wrongSnapshotMethod,"snapshot GET denied")
  let bodies=try FileManager.default.contentsOfDirectory(at:directory,includingPropertiesForKeys:nil).filter{$0.lastPathComponent.hasPrefix("snapshot-")}
  check(bodies.count==1,"only the admitted dummy snapshot is saved")
  let bodyText=try String(contentsOf:bodies[0],encoding:.utf8)
  check(!bodyText.contains(token),"client token redacted")
  gate.revoke();ReplayTransport.revoke();check(!gate.permitsSnapshots(lease),"revocation drops flag approval")
  await blocked(snapshot,"Stop blocks queued snapshot")
  _=gate.explicitStart()
  await blocked(snapshot,"a later Start cannot inherit the positive flag result")
  await blocked(flags(good),"a prior Start's evaluation body cannot cross a later lease")
  let newLease=gate.currentLease!,newNonce=gate.evaluationNonce(newLease)!
  _=try await session.data(for:flags(flagBody(newNonce)))
  check(gate.permitsSnapshots(newLease),"later Start requires its own actual positive response")
  gate.excludeSurface();ReplayTransport.revoke()
  await blocked(snapshot,"Close or excluded surface denies even after fresh approval")
  let log=try String(contentsOf:directory.appendingPathComponent("timeline.jsonl"),encoding:.utf8)
  let rows=log.split(separator:"\n").compactMap{try? JSONSerialization.jsonObject(with:Data($0.utf8)) as? [String:Any]}
  let receipts=rows.filter{$0["kind"] as? String=="ingestion_response"}
  check(receipts.count==1,"one snapshot response gets a sanitized ingestion receipt")
  check(receipts.first?["httpStatus"] as? Int==200,"HTTP status preserved in receipt")
  check((receipts.first?["sanitizedBody"] as? [String:Any])?["status"] as? Int==1,"only whitelisted ingestion body status is saved")
  let sentinel="SYNTHETIC_SECRET_MUST_NOT_BE_EXPORTED"
  for value:Any in [true,42,"unknown-"+sentinel,["token":sentinel]] {
   let raw=try JSONSerialization.data(withJSONObject:["status":value,"api_key":sentinel,"error":sentinel,"nested":["token":sentinel]])
   let fields=ReplayIngestionReceipt.fields(id:"generated",status:400,data:raw)
   check((fields["sanitizedBody"] as? [String:Any])?.isEmpty==true,"unknown or boolean status and sensitive response fields omitted")
   check(!String(data:try JSONSerialization.data(withJSONObject:fields),encoding:.utf8)!.contains(sentinel),"arbitrary response values cannot escape")
  }
  for value:Any in [0,1,"ok","success","error","failed","Ok","OK","Success","ERROR"] {
   let fields=ReplayIngestionReceipt.fields(id:"generated",status:200,data:try JSONSerialization.data(withJSONObject:["status":value,"token":sentinel]))
   check((fields["sanitizedBody"] as? [String:Any])?.count==1,"only recognized status body survives")
  }
  for (raw,shape):(Data,String) in [(Data(),"empty"),(Data(sentinel.utf8),"unparseable"),(Data("[]".utf8),"json_value"),(Data(repeating:65,count:16385),"oversize")] {
   let fields=ReplayIngestionReceipt.fields(id:"generated",status:503,data:raw)
   check(fields["bodyShape"] as? String==shape && fields["bodyBytes"] as? Int==raw.count && fields["httpStatus"] as? Int==503,"response shape/size/status retained without content")
   check((fields["sanitizedBody"] as? [String:Any])?.isEmpty==true,"unrecognized response body is empty")
  }
  check(!log.contains("network_started"),"local probe never forwards")
  check(!log.contains(token) && !log.contains(nonce),"evaluation key/body not exported in receipts")
  check(log.contains("flag_evaluation_result") && log.contains("fresh_evaluation_required"),"control evidence records gate outcome")
  print("PASS: \(checks) native transport/request privacy assertions; zero forwarded requests")
 }
}
