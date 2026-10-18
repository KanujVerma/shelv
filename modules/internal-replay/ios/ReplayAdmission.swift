import Foundation
import CoreFoundation

/// Volatile permission for one explicit synthetic run. Nothing restores a grant.
/// Recording additionally requires one fresh successful flag evaluation for this lease.
final class ReplayAdmission {
 private let lock=NSLock()
 private let internalBuild:Bool,bundleIdentifier:String
 private let clock:()->TimeInterval,wallClock:()->TimeInterval
 private var synthetic=false,foreground=true,granted=false
 private var generation=0,nonce:String?,requestID:String?
 private var approved=false,failed=false,started:TimeInterval=0,startedWall:TimeInterval=0
 private var seenReceipts=Set<String>()
 static let evaluationTimeout:TimeInterval=6
 init(internalBuild:Bool,bundleIdentifier:String=ReplayFlagPolicy.bundleIdentifier,clock:@escaping()->TimeInterval={ProcessInfo.processInfo.systemUptime},wallClock:@escaping()->TimeInterval={Date().timeIntervalSince1970}){
  self.internalBuild=internalBuild;self.bundleIdentifier=bundleIdentifier;self.clock=clock;self.wallClock=wallClock
 }
 var currentLease:Int? {lock.lock();defer{lock.unlock()};return eligible ? generation:nil}
 private var eligible:Bool {internalBuild && bundleIdentifier==ReplayFlagPolicy.bundleIdentifier && synthetic && foreground && granted}
 private var awaiting:Bool {let elapsed=clock()-started;return !approved && !failed && elapsed>=0 && elapsed<Self.evaluationTimeout}
 private func clear(){granted=false;approved=false;failed=false;nonce=nil;requestID=nil;generation+=1}
 func enterSyntheticSurface(){lock.lock();synthetic=true;clear();lock.unlock()}
 func excludeSurface(){lock.lock();synthetic=false;clear();lock.unlock()}
 func setForeground(_ value:Bool){lock.lock();foreground=value;if !value{clear()};lock.unlock()}
 func explicitStart()->Int? {
  lock.lock();defer{lock.unlock()}
  guard internalBuild,bundleIdentifier==ReplayFlagPolicy.bundleIdentifier,synthetic,foreground else{return nil}
  clear();granted=true;nonce=UUID().uuidString;started=clock();startedWall=wallClock();return generation
 }
 func revoke(){lock.lock();clear();lock.unlock()}
 func permits(_ lease:Int)->Bool {lock.lock();defer{lock.unlock()};return eligible && generation==lease}
 func evaluationNonce(_ lease:Int)->String? {lock.lock();defer{lock.unlock()};return eligible && generation==lease && awaiting ? nonce:nil}
 func permitsSnapshots(_ lease:Int)->Bool {lock.lock();defer{lock.unlock()};return eligible && generation==lease && approved}
 func beginFlagRequest(_ lease:Int,nonce:String,id:String)->Bool {
  lock.lock();defer{lock.unlock()}
  guard eligible,generation==lease,awaiting,self.nonce==nonce,requestID==nil else{return false}
  requestID=id;return true
 }
 @discardableResult func finishFlagRequest(_ lease:Int,id:String,status:Int,data:Data,age:String?=nil,fromCache:Bool=false)->Bool {
  lock.lock();defer{lock.unlock()}
  guard eligible,generation==lease,requestID==id,awaiting else{return false}
  guard !fromCache,status==200,age==nil || age=="0",
        let receipt=ReplayFlagPolicy.successfulReceipt(data,startedAt:startedWall,now:wallClock()),
        !seenReceipts.contains(receipt) else{failed=true;return false}
  seenReceipts.insert(receipt);approved=true;return true
 }
 func failFlagRequest(_ lease:Int,id:String){
  lock.lock();defer{lock.unlock()}
  if eligible,generation==lease,requestID==id,!approved{failed=true}
 }
 /// Admission and task resume share this lock with revocation.
 @discardableResult func withPermit(_ lease:Int,_ action:()->Void)->Bool {
  lock.lock();defer{lock.unlock()};guard eligible,generation==lease else{return false};action();return true
 }
 @discardableResult func withSnapshotPermit(_ lease:Int,_ action:()->Void)->Bool {
  lock.lock();defer{lock.unlock()};guard eligible,generation==lease,approved else{return false};action();return true
 }
 @discardableResult func withEvaluationPermit(_ lease:Int,id:String,_ action:()->Void)->Bool {
  lock.lock();defer{lock.unlock()};guard eligible,generation==lease,requestID==id,awaiting else{return false};action();return true
 }
}

/// These are SDK selection conditions, not identity verification or an ingestion ACL.
enum ReplayFlagPolicy {
 static let bundleIdentifier="com.derive.skincare.internalreplay"
 static let flagKey="shelv-internal-dummy-replay-only"
 static let markerKey="shelv_internal_dummy_replay"
 static let nonceKey="shelv_internal_dummy_run"
 static func isBool(_ value:Any?,_ expected:Bool)->Bool {
  guard let number=value as? NSNumber,CFGetTypeID(number)==CFBooleanGetTypeID() else{return false}
  return number.boolValue==expected
 }
 /// Accept only this generated evaluation. Drop optional SDK device IDs/timezone from the wire.
 static func requestBody(_ data:Data,token:String,nonce:String)->Data? {
  guard data.count<=16384,let row=(try? JSONSerialization.jsonObject(with:data)) as? [String:Any],
        Set(row.keys).isSubset(of:["api_key","distinct_id","$anon_distinct_id","$device_id","groups","timezone","geoip_disable","person_properties"]),
        row["api_key"] as? String==token,
        let distinct=row["distinct_id"] as? String,UUID(uuidString:distinct) != nil,
        let groups=row["groups"] as? [String:Any],groups.isEmpty,isBool(row["geoip_disable"],true),
        let properties=row["person_properties"] as? [String:Any],
        Set(properties.keys)==["$app_namespace",markerKey,nonceKey],
        properties["$app_namespace"] as? String==bundleIdentifier,isBool(properties[markerKey],true),
        properties[nonceKey] as? String==nonce,UUID(uuidString:nonce) != nil else{return nil}
  for key in ["$anon_distinct_id","$device_id"] {
   if let value=row[key],!(value is String && UUID(uuidString:value as! String) != nil){return nil}
  }
  return try? JSONSerialization.data(withJSONObject:["api_key":token,"distinct_id":distinct,"groups":[:],"geoip_disable":true,"person_properties":properties],options:[.sortedKeys])
 }
 /// Freshness uses server receipt + timestamp, never SDK cache state or reload callback alone.
 /// Both Unix seconds and milliseconds are accepted; missing/unknown formats deny.
 static func successfulReceipt(_ data:Data,startedAt:TimeInterval,now:TimeInterval)->String? {
  guard data.count<=262144,let row=(try? JSONSerialization.jsonObject(with:data)) as? [String:Any],
        isBool(row["errorsWhileComputingFlags"],false),
        let receipt=row["requestId"] as? String,UUID(uuidString:receipt) != nil,
        let raw=row["evaluatedAt"] as? NSNumber,CFGetTypeID(raw) != CFBooleanGetTypeID() else{return nil}
  if let quota=row["quotaLimited"] {guard let quotas=quota as? [String],quotas.isEmpty else{return nil}}
  let number=raw.doubleValue,time=number>100_000_000_000 ? number/1000:number
  guard time.isFinite,time>=startedAt-1,time<=now+1,now>=startedAt else{return nil}
  if row["flags"] != nil {
   guard row["featureFlags"]==nil,let flags=row["flags"] as? [String:Any] else{return nil}
   guard let flag=flags[flagKey] as? [String:Any],isBool(flag["enabled"],true),
         flag["variant"]==nil || flag["variant"] is NSNull else{return nil}
  } else {
   guard let flags=row["featureFlags"] as? [String:Any],isBool(flags[flagKey],true),
         row["featureFlagPayloads"] is [String:Any] else{return nil}
  }
  return receipt
 }
}
