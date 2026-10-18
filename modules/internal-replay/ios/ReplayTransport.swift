import Foundation
import CoreFoundation

final class ReplayEvidence {
 let directory:URL
 private let lock=NSLock()
 init(directory:URL?=nil){self.directory=directory ?? FileManager.default.urls(for:.documentDirectory,in:.userDomainMask)[0].appendingPathComponent("internal-replay").appendingPathComponent(UUID().uuidString);try? FileManager.default.createDirectory(at:self.directory,withIntermediateDirectories:true)}
 func record(_ kind:String,_ fields:[String:Any]=[:]){
  lock.lock();defer{lock.unlock()};var row=fields;row["kind"]=kind;row["time"]=Date().timeIntervalSince1970
  guard let data=try? JSONSerialization.data(withJSONObject:row,options:[.sortedKeys]) else{return}
  let file=directory.appendingPathComponent("timeline.jsonl")
  if !FileManager.default.fileExists(atPath:file.path){FileManager.default.createFile(atPath:file.path,contents:nil)}
  if let handle=try? FileHandle(forWritingTo:file){defer{try? handle.close()};_=try? handle.seekToEnd();try? handle.write(contentsOf:data+Data([10]))}
 }
 func saveBody(_ data:Data,id:String){
  func redact(_ value:Any)->Any {
   if let rows=value as? [Any]{return rows.map(redact)}
   if let row=value as? [String:Any]{return row.mapValues{redact($0)}.map{($0.key,$0.key=="api_key" ? "[redacted]":$0.value)}.reduce(into:[String:Any]()){$0[$1.0]=$1.1}}
   return value
  }
  guard let value=try? JSONSerialization.jsonObject(with:data),let cleaned=try? JSONSerialization.data(withJSONObject:redact(value),options:[.sortedKeys]) else{return}
  try? cleaned.write(to:directory.appendingPathComponent("snapshot-"+id+".json"),options:.atomic)
 }
}

/// Snapshot ingestion diagnostics only. Never save arbitrary response strings,
/// nested objects, headers or URLs: error responses can echo client credentials.
enum ReplayIngestionReceipt {
 static func fields(id:String,status:Int,data:Data)->[String:Any] {
  var fields:[String:Any]=["id":id,"httpStatus":status,"bodyBytes":data.count,"sanitizedBody":[:]]
  guard !data.isEmpty else{fields["bodyShape"]="empty";return fields}
  guard data.count<=16384 else{fields["bodyShape"]="oversize";return fields}
  guard let parsed=try? JSONSerialization.jsonObject(with:data,options:[.fragmentsAllowed]) else{fields["bodyShape"]="unparseable";return fields}
  guard let object=parsed as? [String:Any] else{fields["bodyShape"]="json_value";return fields}
  fields["bodyShape"]="json_object"
  var body=[String:Any]()
  if let value=object["status"] as? NSNumber,CFGetTypeID(value) != CFBooleanGetTypeID(),[0.0,1.0].contains(value.doubleValue){body["status"]=value.intValue}
  else if let raw=object["status"] as? String,["ok","success","error","failed"].contains(raw.lowercased()){body["status"]=raw.lowercased()}
  fields["sanitizedBody"]=body
  return fields
 }
}

private final class NoReplayRedirects:NSObject,URLSessionTaskDelegate {
 func urlSession(_ session:URLSession,task:URLSessionTask,willPerformHTTPRedirection response:HTTPURLResponse,newRequest request:URLRequest,completionHandler:@escaping(URLRequest?)->Void){completionHandler(nil)}
}

/// Applied only to the native replay SDK's URLSession. App HTTP is untouched.
final class ReplayTransport:URLProtocol {
 private static let lock=NSLock()
 private static var gate:ReplayAdmission?,evidence:ReplayEvidence?,mode="local",origin="",token=""
 private static var tasks=[String:URLSessionTask]()
 private static let session:URLSession={
  let config=URLSessionConfiguration.ephemeral;config.protocolClasses=[];config.urlCache=nil
  config.requestCachePolicy = .reloadIgnoringLocalAndRemoteCacheData
  config.httpCookieStorage=nil;config.urlCredentialStorage=nil;config.httpCookieAcceptPolicy = .never
  config.timeoutIntervalForRequest=ReplayAdmission.evaluationTimeout
  return URLSession(configuration:config,delegate:NoReplayRedirects(),delegateQueue:nil)
 }()
 private var ownTask:URLSessionTask?
 private var cancelled=false
 private let ownLock=NSLock()
 static func configure(gate:ReplayAdmission,evidence:ReplayEvidence,mode:String,origin:String,token:String){lock.lock();self.gate=gate;self.evidence=evidence;self.mode=mode;self.origin=origin;self.token=token;lock.unlock()}
 static func revoke(){lock.lock();let pending=Array(tasks.values);tasks.removeAll();let evidence=self.evidence;lock.unlock();pending.forEach{$0.cancel()};evidence?.record("transport_revoked",["cancelledTasks":pending.count])}
 override class func canInit(with request:URLRequest)->Bool {true}
 override class func canonicalRequest(for request:URLRequest)->URLRequest {request}
 override func startLoading(){
  Self.lock.lock();let gate=Self.gate,evidence=Self.evidence,mode=Self.mode,origin=Self.origin,token=Self.token;Self.lock.unlock()
  let id=UUID().uuidString
  func block(_ reason:String){evidence?.record("request_blocked",["id":id,"reason":reason]);client?.urlProtocol(self,didFailWithError:URLError(.cancelled))}
  guard let url=request.url,let gate,let lease=gate.currentLease else{block("closed_or_wrong_origin");return}
  guard let endpoint=ReplayRequestPolicy.endpoint(url,origin:origin,token:token) else{block("non_replay_endpoint");return}
  let snapshot=endpoint=="snapshot",flags=endpoint=="flags",config=endpoint=="config"
  guard request.httpMethod==(config ? "GET":"POST") else{block("method");return}
  var body=request.httpBody ?? readBody()
  if flags {
   guard let nonce=gate.evaluationNonce(lease),cachedResponse==nil,
         let cleaned=ReplayFlagPolicy.requestBody(body,token:token,nonce:nonce),
         gate.beginFlagRequest(lease,nonce:nonce,id:id) else{block("unmatched_or_stale_evaluation");return}
   body=cleaned
  }
  if snapshot {
   guard gate.permitsSnapshots(lease) else{block("fresh_evaluation_required");return}
   guard let events=(try? JSONSerialization.jsonObject(with:body)) as? [[String:Any]],!events.isEmpty,events.allSatisfy({($0["event"] as? String)=="$snapshot"}) else{block("non_snapshot_body");return}
   evidence?.saveBody(body,id:id)
  }
  evidence?.record("request_admission",["id":id,"endpoint":endpoint,"mode":mode,"lease":lease,"bytes":body.count])
  func withAdmission(_ action:()->Void)->Bool {
   if snapshot{return gate.withSnapshotPermit(lease,action)}
   if flags{return gate.withEvaluationPermit(lease,id:id,action)}
   return gate.withPermit(lease,action)
  }
  if mode=="local" {
   guard withAdmission({}) else{block("stale_grant");return}
   let response:[String:Any]
   if config {
    response=["sessionRecording":["endpoint":"/s/","sampleRate":1.0,"minimumDurationMilliseconds":0,"linkedFlag":ReplayFlagPolicy.flagKey],"autocaptureExceptions":false,"surveys":[],"capturePerformance":false,"supportedCompression":[],"hasFeatureFlags":true]
   } else if flags {
    response=["flags":[ReplayFlagPolicy.flagKey:["enabled":true]],"errorsWhileComputingFlags":false,"requestId":UUID().uuidString,"evaluatedAt":Int(Date().timeIntervalSince1970)]
   } else {response=["status":1]}
   deliver(id:id,data:(try? JSONSerialization.data(withJSONObject:response)) ?? Data(),status:200,evidence:evidence,mode:mode,gate:gate,lease:lease,flags:flags,snapshot:snapshot);return
  }
  var outbound=request
  outbound.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
  outbound.setValue("no-cache, no-store",forHTTPHeaderField:"Cache-Control")
  outbound.setValue("no-cache",forHTTPHeaderField:"Pragma")
  outbound.setValue(nil,forHTTPHeaderField:"Content-Length")
  outbound.httpBodyStream=nil;if !body.isEmpty{outbound.httpBody=body};outbound.httpShouldHandleCookies=false
  let task=Self.session.dataTask(with:outbound){[weak self] data,response,error in
   Self.lock.lock();Self.tasks.removeValue(forKey:id);Self.lock.unlock()
   guard let self else{return}
   self.ownLock.lock();let cancelled=self.cancelled;self.ownLock.unlock();if cancelled{return}
   guard error==nil,let response=response as? HTTPURLResponse else{
    if flags{gate.failFlagRequest(lease,id:id)}
    evidence?.record("network_failed",["id":id]);self.client?.urlProtocol(self,didFailWithError:URLError(.cancelled));return
   }
   self.deliver(id:id,data:data ?? Data(),status:response.statusCode,evidence:evidence,mode:mode,gate:gate,lease:lease,flags:flags,snapshot:snapshot,age:response.value(forHTTPHeaderField:"Age"))
  }
  ownTask=task
  Self.lock.lock()
  let sent=withAdmission{Self.tasks[id]=task;evidence?.record("network_started",["id":id,"endpoint":endpoint]);task.resume()}
  Self.lock.unlock()
  if !sent{task.cancel();block("stale_grant")}
 }
 private func deliver(id:String,data:Data,status:Int,evidence:ReplayEvidence?,mode:String,gate:ReplayAdmission,lease:Int,flags:Bool,snapshot:Bool,age:String?=nil){
  if flags {
   let accepted=gate.finishFlagRequest(lease,id:id,status:status,data:data,age:age,fromCache:cachedResponse != nil)
   evidence?.record("flag_evaluation_result",["id":id,"lease":lease,"accepted":accepted])
  }
  guard let url=request.url,let response=HTTPURLResponse(url:url,statusCode:status,httpVersion:"HTTP/1.1",headerFields:["Content-Type":"application/json","Cache-Control":"no-store"]) else{return}
  if snapshot{evidence?.record("ingestion_response",ReplayIngestionReceipt.fields(id:id,status:status,data:data))}
  evidence?.record("response",["id":id,"status":status,"mode":mode])
  client?.urlProtocol(self,didReceive:response,cacheStoragePolicy:.notAllowed);client?.urlProtocol(self,didLoad:data);client?.urlProtocolDidFinishLoading(self)
 }
 private func readBody()->Data {guard let stream=request.httpBodyStream else{return Data()};stream.open();defer{stream.close()};var data=Data(),buffer=[UInt8](repeating:0,count:16384);while stream.hasBytesAvailable{let count=stream.read(&buffer,maxLength:buffer.count);if count<=0{break};data.append(buffer,count:count)};return data}
 override func stopLoading(){ownLock.lock();cancelled=true;ownLock.unlock();ownTask?.cancel()}
}

enum ReplayRequestPolicy {
 static func endpoint(_ url:URL,origin:String,token:String)->String? {
  guard url.user==nil,url.password==nil,url.fragment==nil,let base=URL(string:origin),url.scheme==base.scheme else{return nil}
  let sameOrigin=url.host==base.host && url.port==base.port
  if sameOrigin && (url.path=="/s" || url.path=="/s/"){return "snapshot"}
  if sameOrigin && (url.path=="/flags" || url.path=="/flags/"),
     let query=URLComponents(url:url,resolvingAgainstBaseURL:false)?.queryItems,query.count==1,query[0].name=="v",query[0].value=="2" {return "flags"}
  let assets:String
  switch origin {
   case "https://us.i.posthog.com":assets="us-assets.i.posthog.com"
   case "https://eu.i.posthog.com":assets="eu-assets.i.posthog.com"
   default:assets=base.host ?? ""
  }
  if url.host==assets && url.port==base.port && url.path=="/array/"+token+"/config"{return "config"}
  return nil
 }
}
