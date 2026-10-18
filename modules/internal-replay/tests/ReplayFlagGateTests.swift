import Foundation
@main struct FlagGateTests {
 static func main() throws {
  var checks=0,tick:TimeInterval=100,wall:TimeInterval=1_792_182_500
  func check(_ value:Bool,_ label:String){if !value{print("FAIL: "+label);exit(1)};checks+=1}
  func gate(_ bundle:String=ReplayFlagPolicy.bundleIdentifier)->ReplayAdmission {
   ReplayAdmission(internalBuild:true,bundleIdentifier:bundle,clock:{tick},wallClock:{wall})
  }
  func response(_ changes:[String:Any]=[:])->Data {
   var row:[String:Any]=["flags":[ReplayFlagPolicy.flagKey:["enabled":true]],"errorsWhileComputingFlags":false,"requestId":UUID().uuidString,"evaluatedAt":wall]
   row.merge(changes){_,new in new};return try! JSONSerialization.data(withJSONObject:row)
  }
  func begin(_ g:ReplayAdmission)->(Int,String,String){
   g.enterSyntheticSurface();let lease=g.explicitStart()!,nonce=g.evaluationNonce(lease)!,id=UUID().uuidString
   check(!g.permitsSnapshots(lease),"Start alone cannot admit cached SDK snapshots")
   check(g.beginFlagRequest(lease,nonce:nonce,id:id),"matching fresh evaluation begins")
   return(lease,nonce,id)
  }
  let wrong=gate("com.derive.skincare");wrong.enterSyntheticSurface();check(wrong.explicitStart()==nil,"ordinary bundle denied")
  let g=gate();let (lease,nonce,id)=begin(g)
  check(!g.beginFlagRequest(lease,nonce:nonce,id:"duplicate"),"only one evaluation per Start")
  let receipt=response();check(g.finishFlagRequest(lease,id:id,status:200,data:receipt),"fresh positive response admits")
  check(g.permitsSnapshots(lease),"approved explicit lease can send")
  g.revoke();check(!g.permitsSnapshots(lease),"Stop revokes approval")
  g.enterSyntheticSurface();let next=g.explicitStart()!,nextNonce=g.evaluationNonce(next)!,nextID=UUID().uuidString
  check(nextNonce != nonce,"each Start gets a new generated nonce")
  check(!g.beginFlagRequest(next,nonce:nonce,id:"old"),"old request body denied")
  check(!g.finishFlagRequest(lease,id:id,status:200,data:response()),"late old response cannot grant")
  check(g.beginFlagRequest(next,nonce:nextNonce,id:nextID),"next request begins")
  check(!g.finishFlagRequest(next,id:nextID,status:200,data:receipt),"replayed receipt rejected even within timestamp window")
  check(!g.permitsSnapshots(next),"replayed or cached receipt cannot grant")
  for changes:[String:Any] in [
   ["flags":[:]],["flags":[ReplayFlagPolicy.flagKey:["enabled":false]]],
   ["flags":[ReplayFlagPolicy.flagKey:["enabled":1]]],
   ["flags":[ReplayFlagPolicy.flagKey:["enabled":true,"variant":"test"]]],
   ["errorsWhileComputingFlags":true],["errorsWhileComputingFlags":NSNull()],
   ["requestId":NSNull()],["evaluatedAt":NSNull()],["evaluatedAt":true],
   ["evaluatedAt":wall-20],["evaluatedAt":wall+20],["quotaLimited":["feature_flags"]],
   ["quotaLimited":["mobile_recordings"]],["quotaLimited":"bad"],
   ["flags":"bad"],["featureFlags":[ReplayFlagPolicy.flagKey:true]]
  ] {
   let f=gate(),(l,_,r)=begin(f)
   check(!f.finishFlagRequest(l,id:r,status:200,data:response(changes)),"malformed/false/error/stale result denies")
   check(!f.finishFlagRequest(l,id:r,status:200,data:response()),"failed evaluation stays closed")
   check(!f.permitsSnapshots(l),"negative result never opens snapshots")
  }
  for status in [204,304,400,401,429,500] {
   let f=gate(),(l,_,r)=begin(f);check(!f.finishFlagRequest(l,id:r,status:status,data:response()),"non-200 status denies")
  }
  for age in ["1","120","invalid"] {
   let f=gate(),(l,_,r)=begin(f);check(!f.finishFlagRequest(l,id:r,status:200,data:response(),age:age),"cached response Age denies")
  }
  let cached=gate(),(cl,_,ci)=begin(cached)
  check(!cached.finishFlagRequest(cl,id:ci,status:200,data:response(),fromCache:true),"URL cache response denies")
  let offline=gate(),(ol,_,oi)=begin(offline);offline.failFlagRequest(ol,id:oi)
  check(!offline.finishFlagRequest(ol,id:oi,status:200,data:response()),"network error cannot be revived by late success")
  let slow=gate(),(sl,_,si)=begin(slow);tick+=ReplayAdmission.evaluationTimeout
  check(!slow.finishFlagRequest(sl,id:si,status:200,data:response()),"deadline is exclusive")
  check(!slow.permitsSnapshots(sl),"timeout cannot send")
  tick=100
  for transition in ["stop","background","exclude","replace"] {
   let f=gate(),(l,_,r)=begin(f)
   switch transition {case "stop":f.revoke();case "background":f.setForeground(false);f.setForeground(true);case "exclude":f.excludeSurface();f.enterSyntheticSurface();default:_=f.explicitStart()}
   check(!f.finishFlagRequest(l,id:r,status:200,data:response()),"late callback after "+transition+" denied")
   var sideEffect=false;check(!f.withSnapshotPermit(l){sideEffect=true},"atomic snapshot permit denied after "+transition);check(!sideEffect,"no snapshot side effect")
  }
  check(gate().currentLease==nil,"restart never restores a grant")
  let millis=gate(),(ml,_,mi)=begin(millis)
  check(millis.finishFlagRequest(ml,id:mi,status:200,data:response(["evaluatedAt":wall*1000])),"fresh millisecond timestamp accepted")
  var legacy:[String:Any]=["featureFlags":[ReplayFlagPolicy.flagKey:true],"featureFlagPayloads":[:],"errorsWhileComputingFlags":false,"requestId":UUID().uuidString,"evaluatedAt":wall]
  check(ReplayFlagPolicy.successfulReceipt(try JSONSerialization.data(withJSONObject:legacy),startedAt:wall,now:wall) != nil,"boolean legacy response supported")
  legacy["featureFlags"]=[ReplayFlagPolicy.flagKey:"variant"]
  check(ReplayFlagPolicy.successfulReceipt(try JSONSerialization.data(withJSONObject:legacy),startedAt:wall,now:wall)==nil,"legacy variant denied")
  print("PASS: \(checks) native fresh-flag admission assertions")
 }
}
