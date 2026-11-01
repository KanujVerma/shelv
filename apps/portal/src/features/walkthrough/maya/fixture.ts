import {createMayaSample} from '../../../../site/advisor/maya-sample.js';
import {adaptLegacyPlan,projectClientPlan} from '../../../../../../src/contracts/PortalRebuild.ts';
import type {ClientPlanView} from '../../../../../../src/contracts/PortalRebuild.ts';
import type {ClientPlanViewV2,PublicReviewSummary,UseProjection} from '../../../../../../src/contracts/PortalCare.ts';

export const MAYA_TREATMENT='ordinary-azelaic-10';
export const MAYA_MOISTURIZER='cerave-pm';
export const SAMPLE_RECORDED_AT='2026-11-03T18:00:00Z';
export const SAMPLE_ACTOR='ec000000-0000-4000-8000-00000000a002';
export const sampleId=(n:number)=>`ec000000-0000-4000-8000-${String(n).padStart(12,'0')}`;

/** Lossless directions/identities/evidence from the approved public sample.
 * Images use the renderer's neutral unavailable fallback, so mounting this
 * feature cannot initiate image requests. Links remain optional public sources. */
export function createMayaFixture():{base:ClientPlanView;use:UseProjection} {
  const source=createMayaSample().clientView.plan;
  const content=projectClientPlan(adaptLegacyPlan({version:source.version,presentation:source.presentation,recommendations:source.recommendations},2).content);
  for(const product of content.products)product.imageUrl=null;
  const makeup=content.routine.find(s=>s.productId==='maybelline-fit-me');
  const remover=content.routine.find(s=>s.productId==='bioderma-sensibio-h2o');
  if(!makeup||!remover)throw Error('approved public Maya routine unavailable');
  makeup.schedule.asNeeded=true;
  remover.schedule.condition='if wearing makeup';
  const base:ClientPlanView={schemaVersion:1,access:'active',plan:{documentSchemaVersion:3,version:1,publishedAt:'2026-10-20T18:00:00Z',content},decisionRevision:0,decisions:[],actualUse:[],nextReviewOn:null};
  const use:UseProjection={revision:0,planProducts:content.products.map(p=>({product:{kind:'plan_product',publication:{version:1,documentSchemaVersion:3},productId:p.id,slotId:null},state:'not_reported',originalStart:{state:'unknown'},latestEvent:null,identity:null,contradiction:false})),reportedProducts:{items:[],nextCursor:null}};
  return {base,use};
}

// Source: site/walkthrough/maya.js, already-public authored later story. These
// facts are kept separate from reports made with the demo's sample controls.
export const MAYA_FOLLOW_UP={
  occurredOn:'2026-11-03',
  messages:[
    {speaker:'Maya',text:'Hey, quick question. Am I still using the niacinamide with the new cream, or was that one I was meant to leave out?'},
    {speaker:'Shelv',text:'Keep the separate niacinamide and hyaluronic acid serums paused, as the plan says. The extra layers are what we’re testing. The glycolic toner stays out too. We’ll review how the simpler routine wears.'},
  ],
  summary:'Authored sample review with Shelv by text. Mornings reported easier with fewer layers; marks reported unchanged.',
  reportedUse:'Twice in week one and once so far in week two. No stinging or peeling reported. Missed use was a timing issue. Exact Start date not supplied.',
  decision:'No additional purchase. Keep the current instructions and gradual introduction. Keep the separate niacinamide and hyaluronic serums and glycolic toner out. A few uses do not establish efficacy.',
  nextReviewOn:'2026-11-20',
} as const;
export function mayaSampleReview():PublicReviewSummary {
  return {reviewId:sampleId(700),publicationVersion:1,publishedAt:SAMPLE_RECORDED_AT,occurredOn:{state:'known',value:MAYA_FOLLOW_UP.occurredOn},conclusion:MAYA_FOLLOW_UP.summary,rationale:MAYA_FOLLOW_UP.decision,nextStep:'review how the simpler routine wears',nextReviewOn:MAYA_FOLLOW_UP.nextReviewOn};
}
export function mayaCareView(base:ClientPlanView,use:UseProjection,showReview:boolean):ClientPlanViewV2 {
  return {...structuredClone(base),schemaVersion:2,use:structuredClone(use),latestPublicReview:showReview?mayaSampleReview():null};
}
