import {createMayaSample} from '../advisor/maya-sample.js';
import {mountWalkthroughViewer} from './viewer.js';
const message=(speaker,text)=>({speaker,text});
/** Maya alone opts into the company service tour; private guides keep their own layout. */
export const mayaTourConfiguration={
 intro:{
  title:'See how Shelv works',
  body:[
   'We’re Shelv, a skincare concierge led by people. We help you choose products, research the options, build a routine you understand and follow through as you try it.',
   'See the service through Maya’s fictional sample, from the first conversation to a later review. Open a few details if you like, or use Next throughout.'
  ],
  meta:'About 3–4 minutes · $100/month · Month to month · Products separate',
  primaryLabel:'Start tour',secondaryLabel:'Explore on my own'
 },
 steps:{
  'meet-maya':{target:'overview',view:'plan',interaction:{label:'Read Maya’s overview',action:'open-overview'}},
  'plan-reasoning':{target:'keep-card',view:'plan',interaction:{label:'See why we keep it',action:'open-keep-card'}},
  'spending':{target:'approval-controls',view:'plan',interaction:{label:'Inspect the proposed treatment',action:'open-treatment-card'}},
  'daily-routine':{target:'routine-grid',view:'routine',interaction:{label:'Open a product’s directions',action:'open-routine-product'}},
  'between-reviews':{target:'support',view:'service'},
  'review-decision':{target:'review',view:'service'},
  'ongoing-support':{target:'terms',view:'service'}
 },
 finish:{
  title:'A plan, with people behind it',
  body:[
   'We help you choose what earns a place in your routine, understand how to use it and decide what to do next. Sometimes that means keeping the plan unchanged.',
   'Talk to Shelv about whether the service fits you, or keep exploring Maya’s sample.'
  ],
  meta:'Fictional sample · No messages, orders or payments sent'
 }
};
// Company voice applies only to editorial reasoning in this public guided clone.
// Product identities, evidence, usage and safety directions remain verbatim.
const companyVoice=text=>typeof text!=='string'?text:text
 .replace(/\bI’d\b/g,'we’d').replace(/\bI’m\b/g,'we’re').replace(/\bI chose\b/g,'we chose')
 .replace(/\bI can’t\b/g,'we can’t').replace(/\bI wouldn’t\b/g,'we wouldn’t').replace(/\bI want\b/g,'we want')
 .replace(/\btell me\b/g,'tell us').replace(/(^|[.!?]\s+)we\b/g,(_match,prefix)=>prefix+'We');
export function createGuidedMayaSnapshot(presentation=createMayaSample().clientView.plan.presentation){
 const p=structuredClone(presentation);
 p.preparedBy='Shelv';
 for(const section of p.consultationSections){section.title=companyVoice(section.title);section.body=companyVoice(section.body);}
 for(const card of p.categoryCards){
  card.rationaleTitle=companyVoice(card.rationaleTitle);
  for(const reason of card.reasons){reason.title=companyVoice(reason.title);reason.body=companyVoice(reason.body);}
  for(const comparison of card.comparisons)comparison.significance=companyVoice(comparison.significance);
 }
 // Reuse already-public local assets, with no cross-origin image request.
 for(const step of p.baselineRoutine)if(step.product?.imageUrl?.includes('/maya/assets/'))step.product.imageUrl='assets/'+step.product.imageUrl.split('/maya/assets/')[1];
 for(const card of p.categoryCards)for(const key of ['currentProduct','proposedProduct'])if(card[key]?.imageUrl?.includes('/maya/assets/'))card[key].imageUrl='assets/'+card[key].imageUrl.split('/maya/assets/')[1];
 const stage=(id,title,section,day,body,messages=[],more={})=>({id,title,section,day,body,messages,...more});
 const stages=[
  stage('meet-maya','We start with a conversation','plan','2026-10-20','We begin with Maya’s priorities, current products and budget. She wants help with lingering marks and layers that pill under sunscreen and makeup. This fictional example shows the personal plan we prepare after that conversation. The portal keeps our reasoning and directions in one place.'),
  stage('plan-reasoning','First, keep what works','plan','2026-10-20','We keep Maya’s comfortable cleanser, lotion, makeup remover and sunscreen. We pause two extra serums before replacing dependable basics. Her plan explains why each product stays, pauses or is proposed, with sources and limits behind the detail. Open a product card if you’d like to see that reasoning.'),
  stage('spending','Maya controls the spending','plan','2026-10-20','We propose one treatment, while explaining that evidence for stronger 15–20% formulas does not prove the same results for this 10% bottle. Maya can approve, defer or decline. Approval does not place an order: we confirm the total, arrange approved purchases and coordinate eligible returns ourselves. Products cost extra.'),
  stage('daily-routine','Clear steps for ordinary days','routine','2026-10-20','We turn the plan into morning and evening directions and product guides. Maya’s existing basics appear here. The treatment stays proposed in the portal until she records receipt and her actual Start; approval alone does not change the routine. Its guide keeps the original gradual introduction and safety directions close at hand.'),
  stage('between-reviews','Help between reviews','service','2026-10-27','We give a useful personal reply within 24 elapsed hours every day, including weekends. This short sample text exchange happens outside the portal, where ongoing conversations normally happen. Your portal keeps the conclusions handy for the next review.',[
   message('Maya','Hey, quick question. Am I still using the niacinamide with the new cream, or was that one I was meant to leave out?'),
   message('Shelv','Keep the separate niacinamide and hyaluronic acid serums paused, as the plan says. The extra layers are what we’re testing. The glycolic toner stays out too. We’ll review how the simpler routine wears.')]),
  stage('review-decision','A review can mean no new purchase','service','2026-11-03','We review at two weeks, then at the ends of months one, two and three. In this sample follow-up, Maya reports easier mornings, unchanged marks and a few comfortable uses. We clarify timing, save the decision and keep the plan unchanged. A few uses aren’t enough to judge whether the treatment helps the marks.',[],{review:{channel:'text',occurredOn:'2026-11-03',summary:'Authored sample review with Shelv by text. Mornings reported easier with fewer layers; marks reported unchanged.',reportedUse:'Twice in week one and once so far in week two. No stinging or peeling reported. Missed use was a timing issue. Exact Start date not supplied.',decision:'No additional purchase. Keep the current instructions and gradual introduction. Keep the separate niacinamide and hyaluronic serums and glycolic toner out. A few uses do not establish efficacy.',nextReviewOn:'2026-11-20'}}),
  stage('ongoing-support','We stay involved','service','2026-11-03','We stay involved with reviews and practical help, including approved orders and eligible returns. The service is $100 per month, month to month; products are separate. Photos and advance updates are optional. If you’re dissatisfied, our guarantee covers service fees actually paid for the first three monthly periods. Read the full scope, request deadline and repayment timing below.')
 ];
 return {schemaVersion:1,caseId:'ec000000-0000-4000-8000-00000000a002',versionId:'ec000000-0000-4000-8000-00000000b002',presentation:p,stages};
}
export function mountGuidedMaya(root,{presentation}={}){
 return mountWalkthroughViewer(root,{snapshot:createGuidedMayaSnapshot(presentation),tour:mayaTourConfiguration,showSampleDisclosure:true,endLinks:[{label:'Talk to Shelv',href:'https://derive-beta-site.vercel.app/support'},{label:'Discuss referrals',href:'https://derive-beta-site.vercel.app/support'}]});
}
