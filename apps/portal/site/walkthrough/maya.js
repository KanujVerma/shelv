import {createMayaSample} from '../advisor/maya-sample.js';
import {mountWalkthroughViewer} from './viewer.js';
const message=(speaker,text)=>({speaker,text});
export function createGuidedMayaSnapshot(presentation=createMayaSample().clientView.plan.presentation){
 const p=structuredClone(presentation);
 // Reuse already-public local assets, with no cross-origin image request.
 for(const step of p.baselineRoutine)if(step.product?.imageUrl?.includes('/maya/assets/'))step.product.imageUrl='assets/'+step.product.imageUrl.split('/maya/assets/')[1];
 for(const card of p.categoryCards)for(const key of ['currentProduct','proposedProduct'])if(card[key]?.imageUrl?.includes('/maya/assets/'))card[key].imageUrl='assets/'+card[key].imageUrl.split('/maya/assets/')[1];
 const stage=(id,title,section,day,body,messages=[],more={})=>({id,title,section,day,body,messages,...more});
 const stages=[
  stage('what-matters','Marks, with fewer layers','plan','2026-10-20','About four minutes. Maya wants help with lingering marks and a routine that wears comfortably under sunscreen and makeup. Start with the reasoning behind her plan.'),
  stage('one-treatment','One treatment, useful basics','plan','2026-10-20','Open Treatments for The Ordinary Azelaic Acid Suspension 10%. Keep the comfortable cleanser, lotion and makeup remover. The evidence for stronger 15–20% formulas does not prove the same result for this bottle.'),
  stage('daily-steps','A routine she can follow','routine','2026-10-20','The two separate serums are paused and the glycolic toner stays out. Follow the existing gradual introduction and product guide. No extra treatment is being added.'),
  stage('interim-question','A useful reply between reviews','plan','2026-10-27','An ordinary text question can be answered without waiting for a form.',[
   message('Maya','Hey, quick question. Am I still using the niacinamide with the new cream, or was that one I was meant to leave out?'),
   message('Kanuj',"Yep, that's one we're leaving out for now, along with the separate hyaluronic serum. We're keeping the extra layers down. Keep following the evening steps in your plan, and keep the glycolic toner out too.")]),
  stage('before-review','Read the update, ask one question','checkins','2026-11-03','A short update and one follow-up distinguish comfort from timing. These text illustrations do not send messages.',[
   message('Maya',"Mornings are a lot easier without all the layers. I used the new cream twice the first week and once so far this week. No stinging or peeling. The marks look about the same though. Do I need something else for them?"),
   message('Kanuj',"Hey Maya, I read your update. What got in the way of using it this week? Was it uncomfortable at any point, or was it more a timing thing?"),
   message('Maya',"Just timing. I got home late and forgot. It's felt fine when I've used it.")]),
  stage('recorded-review','The decision is saved','service','2026-11-03','Kanuj records the text conversation directly. A client form is optional. The review keeps the plan unchanged and makes the next review clear.',[
   message('Kanuj',"Got it. I wouldn't buy another product based on this update. Let's keep the current plan and its gradual introduction, with the two extra serums and toner still out. You've only used the new cream a few times, so this doesn't give us much to judge yet. I've saved the review in your portal. We'll look at it again at the end of the month. Text me before then if anything comes up.")],{review:{channel:'text',occurredOn:'2026-11-03',summary:'Review with Kanuj by text. Mornings reported easier with fewer layers; marks reported unchanged.',reportedUse:'Twice in week one and once so far in week two. No stinging or peeling reported. Missed use was a timing issue.',decision:'No additional purchase. Keep the current instructions and gradual introduction. Keep the separate niacinamide and hyaluronic serums and glycolic toner out. A few uses do not establish efficacy.',nextReviewOn:'2026-11-20'}}),
  stage('next-step','Support, then a clear next step','service','2026-11-03','Review again at the end of the month, using actual product experience. Explore the plan, restart, or discuss whether Shelv fits your needs. This public sample does not collect health details or send messages.')
 ];
 return {schemaVersion:1,caseId:'ec000000-0000-4000-8000-00000000a002',versionId:'ec000000-0000-4000-8000-00000000b002',presentation:p,stages};
}
export function mountGuidedMaya(root,{presentation}={}){
 return mountWalkthroughViewer(root,{snapshot:createGuidedMayaSnapshot(presentation),showSampleDisclosure:true,endLinks:[{label:'Talk to Shelv',href:'https://derive-beta-site.vercel.app/support'},{label:'Discuss referrals',href:'https://derive-beta-site.vercel.app/support'}]});
}
