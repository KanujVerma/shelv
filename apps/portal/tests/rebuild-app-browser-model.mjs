import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mapReviewResult} from '../../../src/contracts/PortalReviewMapping.ts';
import {readReviewCommand} from '../../../src/contracts/PortalReviewValidation.ts';
import {sameCareValue} from '../../../src/contracts/PortalCareValidation.ts';

/** @typedef {import('../../../src/contracts/PortalRebuild.ts').ClientPlanView} ClientView */
/** @typedef {import('../../../src/contracts/PortalRebuild.ts').AdvisorPublicationView} AdvisorView */
/** @typedef {import('../../../src/contracts/PortalReview.ts').ClientPlanViewV3} ReviewView */
/** @typedef {import('../../../src/contracts/PortalReview.ts').GuidanceDecisionReceipt} DecisionReceipt */
/** @typedef {Extract<import('../../../src/contracts/PortalReview.ts').ReviewCommand,{action:'record_decision_v2'}>} DecisionCommand */
/** @typedef {{asOfDay:string,reportHead:number,instructionHead:number,serviceRevision:number,instructions:never[],decisions:Map<string,{command:DecisionCommand,receipt:DecisionReceipt}>}} ReviewFacts */
/** @typedef {{view:ClientView,careRevision:number,reportedUse:Map<string,Partial<import('../../../src/contracts/PortalCare.ts').EffectiveUse<import('../../../src/contracts/PortalCare.ts').PlanProductRef>>>,review:ReviewFacts,failure:number,hold?:boolean,release?:()=>void}} BrowserState */

// SYNTHETIC HTTP fixture projection, not SQL, Auth or permission admission.
// Mechanical extraction of the browser fixture's existing Care V2 projection.
/**
 * @template {ClientView|AdvisorView} T
 * @param {Pick<BrowserState,'careRevision'|'reportedUse'>} s
 * @param {T} view
 * @returns {Omit<T,'schemaVersion'>&Pick<import('../../../src/contracts/PortalCare.ts').ClientPlanViewV2,'schemaVersion'|'use'|'latestPublicReview'>}
 */
export function browserCareView(s, view) {
  const plan=view.plan;
  return {...view,schemaVersion:2,use:{revision:s.careRevision,
    planProducts:plan?plan.content.products.map(product=>({
      product:{kind:'plan_product',publication:{version:plan.version,documentSchemaVersion:plan.documentSchemaVersion},productId:product.id,slotId:null},
      state:'not_reported',originalStart:{state:'unknown'},latestEvent:null,
      identity:null,contradiction:false,...s.reportedUse.get(product.id),
    })):[],reportedProducts:{items:[],nextCursor:null}},latestPublicReview:null};
}

/** @returns {ReviewFacts} */
export function browserReviewFacts() {
  // This fictional client has no separate published instructions, reports or
  // service events. Published Maya directions remain in the original plan.
  return {asOfDay:'2026-11-01', reportHead:0, instructionHead:0,
    serviceRevision:0, instructions:[], decisions:new Map()};
}

/** @param {BrowserState} s @returns {ReviewView} */
export function browserReviewView(s) {
  const base=browserCareView(s,s.view), facts=s.review;
  assert.deepEqual(facts.instructions,[]);
  assert.equal(facts.reportHead,0);
  assert.equal(facts.instructionHead,0);
  assert.equal(facts.serviceRevision,0);
  const publication=base.plan?{version:base.plan.version,documentSchemaVersion:base.plan.documentSchemaVersion}:null;
  // A deterministic SYNTHETIC consistency digest over this model's actual
  // clinical facts, not a reproduction of PostgreSQL plan_hash/admission.
  // Choice-only updates leave clinical guidance unchanged.
  const manifestHash=createHash('sha256').update(JSON.stringify({model:'SYNTHETIC-app-browser',publication,content:base.plan?.content??null,use:base.use,reportHead:facts.reportHead,instructions:facts.instructions})).digest('hex');
  const snapshot=publication?{publication,currentPublication:publication,
    useHead:base.use.revision,reportHead:facts.reportHead,instructionHead:facts.instructionHead,
    serviceRevision:facts.serviceRevision,decisionRevision:base.decisionRevision,
    asOfDay:facts.asOfDay,manifestHash}:null;
  /** @type {ReviewView} */
  const value={...base,schemaVersion:3,currentGuidance:snapshot?{schemaVersion:1,
    mode:'current_document',instructionSemantics:'current_for_selected_publication',
    snapshot,instructionCount:facts.instructions.length}:null,decisionGuidance:base.decisions.map(decision=>{
      const binding=[...facts.decisions.values()].reverse().find(({receipt})=>receipt.publicationVersion===publication?.version&&receipt.decisionId===decision.decisionId&&receipt.choice===decision.choice&&receipt.reason===decision.reason);
      return binding?{decisionId:decision.decisionId,recordedDecisionRevision:binding.receipt.decisionRevision,
        acceptedSnapshot:binding.receipt.snapshot,basisStatus:binding.receipt.snapshot.manifestHash===manifestHash?'current':'stale'}:
        {decisionId:decision.decisionId,recordedDecisionRevision:null,acceptedSnapshot:null,basisStatus:'legacy_unbound'};
    })};
  mapReviewResult(value,{schemaVersion:1,action:'read_client_plan_v3',version:null});
  return value;
}

/** @param {BrowserState} s @param {unknown} input */
export async function browserReviewResponse(s,input) {
  if(!input||typeof input!=='object'||!('action'in input)||!['read_client_plan_v3','record_decision_v2','request_status_v1'].includes(String(input.action)))return null;
  const command=readReviewCommand(input);
  if(s.failure)return {status:s.failure,json:{code:({403:'forbidden',409:'revision_conflict'})[s.failure]??'unavailable'}};
  let value;
  if(command.action==='read_client_plan_v3'){
    if(s.hold)await new Promise(resolve=>s.release=()=>resolve(undefined));
    if(command.version!==null&&command.version!==s.view.plan?.version)return {status:404,json:{code:'not_found'}};
    value=browserReviewView(s);
  }else if(command.action==='request_status_v1'){
    const prior=s.review.decisions.get(command.requestId);
    value=prior?{status:'committed',receipt:prior.receipt}:{status:'absent'};
  }else if(command.action==='record_decision_v2'){
    // Access here is fictional view data, never an Auth/permission proof.
    if(s.view.access!=='active')return {status:403,json:{code:'forbidden'}};
    const prior=s.review.decisions.get(command.requestId);
    if(prior){
      if(!sameCareValue(prior.command,command))return {status:409,json:{code:'request_conflict'}};
      value=prior.receipt;
    }else{
      const current=browserReviewView(s);
      if(command.expectedDecisionRevision!==current.decisionRevision||command.publicationVersion!==current.plan?.version||!sameCareValue(command.snapshot,current.currentGuidance?.snapshot))return {status:409,json:{code:'guidance_conflict'}};
      if(!current.plan?.content.decisions.some(d=>d.id===command.decisionId))return {status:404,json:{code:'not_found'}};
      const receipt={requestId:command.requestId,action:command.action,snapshot:structuredClone(command.snapshot),
        decisionRevision:current.decisionRevision+1,publicationVersion:command.publicationVersion,
        decisionId:command.decisionId,choice:command.choice,reason:command.reason};
      mapReviewResult(receipt,command);
      s.review.decisions.set(command.requestId,{command:structuredClone(command),receipt});
      s.view={...s.view,decisionRevision:receipt.decisionRevision,decisions:s.view.decisions.filter(d=>d.decisionId!==command.decisionId).concat({decisionId:command.decisionId,choice:command.choice,reason:command.reason})};
      value=receipt;
    }
  }else return null;
  return {json:mapReviewResult(value,command)};
}
