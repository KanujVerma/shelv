import {decisionKinds,taskActions} from './PortalRebuildValues.ts';
export {decisionKinds,taskActions} from './PortalRebuildValues.ts';
import type { Product as R2Product, Guide, Comparison, Fact as EvidenceFact, Source, Presentation } from './ConciergePresentation.ts';
import type { ConciergeRecommendation } from './ConciergePortal.ts';
import { readPlanContent, readLegacyPlan } from './PortalRebuildValidation.ts';

export type UUID = string;
/** Existing content identities are opaque bounded identifiers, never database UUID requirements. */
export type ContentId = string;
export type Revision = number;
export type Hash = string;
export type Known<T> = {state:'unknown'}|{state:'known';value:T};
export type ProductContext = {state:'unknown'}|{state:'none';factId:ContentId}|{state:'recorded';productIds:ContentId[]};
export type SourceLocation = {sourceId:UUID;sourceVersion:number;locator:{kind:'whole'}|{kind:'time';startMs:number;endMs:number}|{kind:'text';start:number;end:number}|{kind:'page';page:number}};
export type ProvenanceFact = {id:ContentId;kind:'client_report'|'advisor_conclusion'|'agent_proposal';visibility:'advisor_only'|'client';text:string;sources:SourceLocation[];contradicts:ContentId[]};
export type Goal = {id:ContentId;text:string;factIds:ContentId[]};
export type PlanProduct = R2Product & {strength:Known<string>;category:Known<string>;identity:'possible_match'|'client_confirmed'|'unresolved';formula:'unknown'|'label_recorded'|'verified';factIds:ContentId[];guides:Guide[];evidence:EvidenceFact[]};
export type Schedule = {periods:('morning'|'evening')[];days:{kind:'daily'}|{kind:'selected';weekdays:(1|2|3|4|5|6|7)[]};condition:string|null;asNeeded:boolean;stages:{id:ContentId;directions:string;minimumDaysFromActualStart:number|null;proceedOnlyWhen:string}[];anchor:'actual_start';automaticAdvance:false};
export type DecisionKind=typeof decisionKinds[number];
export type PlanDecision={id:ContentId;slotId:ContentId;recommendationId:ContentId|null;kind:DecisionKind;goalIds:ContentId[];currentProductIds:ContentId[];primaryProductId:ContentId|null;alternativeProductIds:ContentId[];reason:string;directions:string[];cautions:string[];limitations:string[];schedule:Schedule|null;factIds:ContentId[];guidance:{title:string;subtitle:string;rationaleTitle:string;reasons:{title:string;body:string}[];actions:string[];comparisons:Comparison[];factsTitle:string;facts:EvidenceFact[];how:Guide|null;sources:Source[];group:ContentId|null;decisionLabels:{current:string;proposed:string}|null}};
export type RoutineStep={id:ContentId;slotId:ContentId;kind:'product'|'instruction';productId:ContentId|null;title:string;directions:string[];cautions:string[];schedule:Schedule};
export type PlanContent={schemaVersion:1;title:string;summary:string;sources:Source[];context:{products:ProductContext;facts:ProvenanceFact[]};goals:Goal[];products:PlanProduct[];decisions:PlanDecision[];routine:RoutineStep[];followUp:{criteria:string[];authoredNotes:string[]}};
export type SectionId='sources'|'context'|'decisions'|'routine'|'follow_up';
export const planSections:readonly SectionId[]=['sources','context','decisions','routine','follow_up'];
export type ExactTarget={draftId:UUID;clientId:UUID;contentRevision:Revision;assignmentRevision:Revision;contentHash:Hash};
export type Publisher={kind:'human';actorId:UUID}|{kind:'task_agent';actorId:UUID;taskGrantId:UUID};
export type ApprovalScope='care_plan.publish';
export type Approval=ExactTarget & {id:UUID;scope:ApprovalScope;approvedBy:UUID;approvedAt:string;publisher:Publisher;revokedAt:string|null;publicationReceiptId:UUID|null};
export type Draft={id:UUID;clientId:UUID|null;kind:'care_plan';state:'working'|'published'|'archived';contentRevision:Revision;assignmentRevision:Revision;contentHash:Hash;content:PlanContent;savedAt:string;basis:{publicationVersion:number|null;useRevision:Revision};origin:{kind:'new'|'template'|'legacy'|'historical';id:string|null}};
export type ReadinessIssue={section:SectionId;path:string;code:string};
export type DraftView={draft:Draft;target:ExactTarget|null;sections:{sectionId:SectionId;sectionHash:Hash;reviewed:boolean}[];issues:ReadinessIssue[]};
export type PublishReceipt={requestId:UUID;publicationReceiptId:UUID;target:ExactTarget;kind:'care_plan';publicationVersion:number;instructionId:null;reviewId:null;publishedAt:string;firstServiceStarted:boolean;notificationEventId:UUID};
export type DraftWrite={requestId:UUID;draftId:UUID;expectedContentRevision:Revision;expectedAssignmentRevision:Revision};
export type TaskAction=typeof taskActions[number];
export type PlanCommand={schemaVersion:1}&(
 |{action:'list_plans_v1';clientId:UUID|null;cursor:string|null;limit:number}
 |{action:'read_draft_v1';draftId:UUID}
 |{action:'create_draft_v1';requestId:UUID;kind:'care_plan';templateVersionId:UUID|null}
 |({action:'save_draft_v1';kind:'care_plan';content:PlanContent}&DraftWrite)
 |({action:'checkpoint_draft_v1';label:string}&DraftWrite)
 |({action:'assign_draft_v1';fromClientId:UUID|null;toClientId:UUID}&DraftWrite)
 |{action:'compare_import_v1';draftId:UUID;baseContentRevision:Revision;baseAssignmentRevision:Revision;content:PlanContent}
 |({action:'apply_import_v1';baseContentRevision:Revision;proposalHash:Hash;content:PlanContent}&DraftWrite)
 |{action:'validate_draft_v1'|'preview_draft_v1';draftId:UUID;contentRevision:Revision;assignmentRevision:Revision}
 |({action:'review_section_v1';sectionId:SectionId;sectionHash:Hash}&DraftWrite)
 |{action:'approve_publication_v1';requestId:UUID;target:ExactTarget;scope:ApprovalScope;publisher:Publisher}
 |{action:'revoke_approval_v1';requestId:UUID;approvalId:UUID;expectedPolicyRevision:Revision}
 |{action:'publish_plan_v1';requestId:UUID;target:ExactTarget;approvalId:UUID;firstServiceClaimId:UUID|null}
 |{action:'read_client_plan_v1';version:number|null}
 |{action:'record_decision_v1';requestId:UUID;expectedDecisionRevision:Revision;publicationVersion:number;decisionId:ContentId;choice:'approved'|'deferred'|'declined';reason:string|null}
 |{action:'restore_publication_v1';requestId:UUID;clientId:UUID;publicationVersion:number;expectedWorkingDraftId:UUID|null}
 |{action:'request_status_v1';requestId:UUID}
 |{action:'read_policy_v1'}
 |{action:'set_sami_approval_policy_v1';requestId:UUID;expectedPolicyRevision:Revision;requireKanujApproval:boolean;confirmed:true}
 |{action:'grant_task_v1';requestId:UUID;agentActorId:UUID;providerSessionId:UUID;clientId:UUID|null;draftId:UUID|null;actions:TaskAction[];sourceIds:UUID[];expiresAt:string}
 |{action:'revoke_task_v1';requestId:UUID;grantId:UUID});
export type PlanRpcCall={name:'concierge_plan_command_v1';args:{p_command:PlanCommand}};
export type ClientFact=Pick<ProvenanceFact,'id'|'kind'|'text'>;
export type ClientPlanContent=Omit<PlanContent,'context'> & {context:{products:ProductContext;facts:ClientFact[]}};
export type ClientPlanView={schemaVersion:1;access:'preparation'|'active'|'read_only';plan:{documentSchemaVersion:3;version:number;publishedAt:string;content:ClientPlanContent}|null;decisionRevision:number;decisions:{decisionId:ContentId;choice:'approved'|'deferred'|'declined';reason:string|null}[];actualUse:{slot:ContentId;productId:ContentId;startedOn:string;publicationVersion:number}[];nextReviewOn:string|null};
export type PlanPolicyView={revision:number;ownerActorId:UUID;requireKanujApproval:boolean};
export type LegacyPlan={version:number;recommendations:ConciergeRecommendation[];presentation:Presentation|null};
export type LegacyPlanAdapter={documentSchemaVersion:1|2;original:LegacyPlan;content:PlanContent};

export function createEmptyPlanContent():PlanContent{return {schemaVersion:1,title:'',summary:'',sources:[],context:{products:{state:'unknown'},facts:[]},goals:[],products:[],decisions:[],routine:[],followUp:{criteria:[],authoredNotes:[]}};}
/** Positive projection: raw fact provenance and private reference IDs never enter the document. */
export function projectClientPlan(value:PlanContent):ClientPlanContent{
 const c=readPlanContent(value),allowed=new Set(c.context.facts.filter(f=>f.visibility==='client').map(f=>f.id));
 const refs=(ids:ContentId[])=>ids.filter(id=>allowed.has(id));
 const products=c.context.products.state==='none'&&!allowed.has(c.context.products.factId)?{state:'unknown' as const}:c.context.products;
 return {schemaVersion:1,title:c.title,summary:c.summary,sources:c.sources,context:{products,facts:c.context.facts.filter(f=>allowed.has(f.id)).map(f=>({id:f.id,kind:f.kind,text:f.text}))},goals:c.goals.map(g=>({...g,factIds:refs(g.factIds)})),products:c.products.map(p=>({...p,factIds:refs(p.factIds)})),decisions:c.decisions.map(d=>({...d,factIds:refs(d.factIds)})),routine:c.routine,followUp:c.followUp};
}
const schedule=(periods:('morning'|'evening')[]):Schedule=>({periods,days:{kind:'daily'},condition:null,asNeeded:false,stages:[],anchor:'actual_start',automaticAdvance:false});
/** Keeps the validated complete original, and all content/slot/product IDs, for lossless historical rendering. */
export function adaptLegacyPlan(value:unknown,version:1|2):LegacyPlanAdapter{
 const original=readLegacyPlan(value,version),p=original.presentation,c=createEmptyPlanContent();
 if(p){
  c.title=p.title;c.summary=p.summary;c.sources=p.sources;
  const products=new Map<string,PlanProduct>();
  const add=(product:R2Product|null)=>{if(product&&!products.has(product.id))products.set(product.id,{...product,strength:{state:'unknown'},category:{state:'unknown'},identity:'unresolved',formula:'unknown',factIds:[],guides:p.routineGuides.filter(g=>g.productId===product.id),evidence:[]});};
  p.baselineRoutine.forEach(s=>add(s.product));p.categoryCards.forEach(d=>{add(d.currentProduct);add(d.proposedProduct);});c.products=[...products.values()];
  c.routine=p.baselineRoutine.map(s=>({id:s.id,slotId:s.slot??s.id,kind:s.kind,productId:s.productId,title:s.title,directions:s.usage.instructions,cautions:[],schedule:schedule(s.usage.periods)}));
  c.decisions=p.categoryCards.map(d=>({id:d.id,slotId:d.slot,recommendationId:d.recommendationId,kind:d.kind,goalIds:[],currentProductIds:d.currentProduct?[d.currentProduct.id]:[],primaryProductId:d.proposedProduct?.id??null,alternativeProductIds:[],reason:d.reasons.map(r=>r.body).join('\n'),directions:d.usage?.instructions??[],cautions:[],limitations:[],schedule:d.usage?schedule(d.usage.periods):null,factIds:[],guidance:{title:d.title,subtitle:d.subtitle,rationaleTitle:d.rationaleTitle,reasons:d.reasons,actions:d.actions,comparisons:d.comparisons,factsTitle:d.factsTitle,facts:d.facts,how:d.how,sources:d.sources,group:d.group??null,decisionLabels:d.decisionLabels??null}}));
 }else c.decisions=original.recommendations.map(r=>({id:r.id,slotId:r.slot,recommendationId:r.id,kind:r.currentProductId?'replace':'addition',goalIds:[],currentProductIds:r.currentProductId?[r.currentProductId]:[],primaryProductId:r.proposedProductId,alternativeProductIds:[],reason:r.rationale,directions:[],cautions:[],limitations:[],schedule:null,factIds:[],guidance:{title:'',subtitle:'',rationaleTitle:'',reasons:[],actions:[],comparisons:[],factsTitle:'',facts:[],how:null,sources:[],group:null,decisionLabels:null}}));
 return {documentSchemaVersion:version,original,content:c};
}
