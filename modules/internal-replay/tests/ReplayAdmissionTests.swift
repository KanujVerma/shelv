import Foundation
@main struct AdmissionTests {
 static func main() {
  var assertions=0
  func check(_ value:Bool,_ label:String){precondition(value,label);assertions+=1}
  let gate=ReplayAdmission(internalBuild:true)
  check(gate.explicitStart()==nil,"no grant outside synthetic surface")
  gate.enterSyntheticSurface();check(gate.currentLease==nil,"entry never starts")
  let first=gate.explicitStart()!;check(gate.permits(first),"explicit start allows this lease")
  gate.excludeSurface();check(!gate.permits(first),"sensitive transition revokes old start")
  gate.enterSyntheticSurface();check(gate.currentLease==nil,"return does not regrant")
  let second=gate.explicitStart()!;check(!gate.permits(first)&&gate.permits(second),"late first start is rejected")
  gate.setForeground(false);check(!gate.permits(second),"background closes admission")
  gate.setForeground(true);check(gate.currentLease==nil,"foreground does not resume")
  let third=gate.explicitStart()!;gate.revoke();check(!gate.permits(third),"stop closes pending delivery admission")
  var effect=false;check(!gate.withPermit(third){effect=true},"revoked callback cannot forward");check(!effect,"no revoked side effect")
  check(ReplayAdmission(internalBuild:true).currentLease==nil,"restart has no persisted grant")
  let release=ReplayAdmission(internalBuild:false);release.enterSyntheticSurface();check(release.explicitStart()==nil,"release build cannot grant")
  print("PASS: \(assertions) native admission assertions")
 }
}
