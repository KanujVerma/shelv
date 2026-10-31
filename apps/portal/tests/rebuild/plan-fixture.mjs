import {createMayaSample} from '../../site/advisor/maya-sample.js';
import {adaptLegacyPlan,projectClientPlan} from '../../../../src/contracts/PortalRebuild.ts';

// Fictional public source only. No staged later events, review dates or payment records.
export function mayaPlan() {
  const source=createMayaSample().clientView.plan;
  const content=adaptLegacyPlan({version:source.version,presentation:source.presentation,recommendations:source.recommendations},2).content;
  content.routine.find(s=>s.productId==='maybelline-fit-me').schedule.asNeeded=true;
  content.routine.find(s=>s.productId==='bioderma-sensibio-h2o').schedule.condition='if wearing makeup';
  return {schemaVersion:1,access:'active',plan:{documentSchemaVersion:3,version:1,publishedAt:'2026-10-20T12:00:00Z',content:projectClientPlan(content)},decisionRevision:0,decisions:[],actualUse:[],nextReviewOn:null};
}
