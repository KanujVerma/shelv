import {createMayaSample} from '../../site/advisor/maya-sample.js';
import {adaptLegacyPlan,projectClientPlan} from '../../../../src/contracts/PortalRebuild.ts';

// Fictional public source only. No staged later events, review dates or payment records.
export function mayaPlan() {
  const source=createMayaSample().clientView.plan;
  const content=adaptLegacyPlan({version:source.version,presentation:source.presentation,recommendations:source.recommendations},2).content;
  content.title='Maya';
  content.summary='lingering marks, fewer layers, comfortable skin';
  content.products.forEach(p=>{p.imageUrl=p.id==='cerave-pm'?'assets/cerave.png':p.id==='ordinary-azelaic-10'?'assets/azelaic.png':null;});
  content.routine.find(s=>s.productId==='maybelline-fit-me').schedule.asNeeded=true;
  content.routine.find(s=>s.productId==='bioderma-sensibio-h2o').schedule.condition='if wearing makeup';
  const moisturizer=content.decisions.find(d=>d.id==='maya-card-moisturizer');
  moisturizer.kind='keep';moisturizer.primaryProductId=null;moisturizer.alternativeProductIds=[];
  // Approved frame copy is a public-source-derived synthetic presentation, not new advice.
  const treatment=content.decisions.find(d=>d.id==='maya-card-treatments');
  treatment.reason='for lingering marks. introduce one change while your comfortable basics stay.';
  treatment.guidance.rationaleTitle='why this fits your plan';
  treatment.guidance.reasons=[{title:'why this fits your plan',body:'your priority is the marks left after spots. we’re proposing one treatment while keeping your comfortable basics and leaving out the toner that irritated your cheeks.'}];
  treatment.limitations=['the stronger clinical evidence is for 15–20% formulas. that does not establish the same result for this 10% product.'];
  treatment.cautions=treatment.directions.slice(3).map(t=>t[0].toLowerCase()+t.slice(1));
  treatment.directions=['patch test first. apply a small amount to dry, intact skin after cleansing, then moisturize. begin with two nonconsecutive evenings in week one; increase only if comfortable, following your full guide.'];
  const labels={'maya-water-rinse':'water rinse','maya-baseline-moisturizer':'CeraVe PM','maya-baseline-sunscreen':'La Roche-Posay Anthelios UV Control SPF 50'};
  for(const step of content.routine){step.title=labels[step.id]??step.title;step.directions=step.directions.map(t=>t[0].toLowerCase()+t.slice(1));if(step.usage){step.usage.short.morning=null;step.usage.short.evening=null;}}
  content.routine.find(s=>s.id==='maya-baseline-moisturizer').usage.short={morning:'keep your comfortable moisturizer beneath sunscreen.',evening:'follow cleansing with your comfortable moisturizer.'};
  content.routine.find(s=>s.id==='maya-baseline-makeup').usage.short.morning='your usual makeup after sunscreen. makeup is optional; your shade is not recorded.';
  content.products.find(p=>p.id==='cerave-pm').name='CeraVe PM';
  content.decisions=content.decisions.filter(d=>['maya-card-treatments','maya-card-serums','maya-card-exfoliant','maya-card-moisturizer'].includes(d.id));
  return {schemaVersion:1,access:'active',plan:{documentSchemaVersion:3,version:1,publishedAt:'2026-10-20T12:00:00Z',content:projectClientPlan(content)},decisionRevision:0,decisions:[],actualUse:[],nextReviewOn:null};
}
