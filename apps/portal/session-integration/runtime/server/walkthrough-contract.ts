import { readPresentation } from '../../../../../src/contracts/ConciergePresentationValidation.ts';
import type { Presentation } from '../../../../../src/contracts/ConciergePresentation.ts';

export const WALKTHROUGH_MAX_BYTES = 1_500_000;
export class WalkthroughError extends Error {
    constructor(public status: number, public code: string) { super(code); }
}
export function requireWalkthrough(value: unknown, status = 400, code = 'invalid_request'): asserts value {
    if (!value) throw new WalkthroughError(status, code);
}
export function record(value: unknown): Record<string, unknown> {
    requireWalkthrough(value !== null && typeof value === 'object' && !Array.isArray(value));
    return value as Record<string, unknown>;
}
export function keys(value: Record<string, unknown>, required: string[], optional: string[] = []) {
    requireWalkthrough(required.every(k => Object.hasOwn(value, k)) && Object.keys(value).every(k => required.includes(k) || optional.includes(k)));
}
export function text(value: unknown, max: number, empty = false): string {
    requireWalkthrough(typeof value === 'string' && value.length <= max && (empty || value.trim().length > 0) && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]|<[^>]*>/u.test(value));
    return value;
}
export function opaqueId(value: unknown): string {
    requireWalkthrough(typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
    return value.toLowerCase();
}
function stableId(value: unknown): string { const id = text(value, 100); requireWalkthrough(/^[a-z0-9][a-z0-9-]*$/.test(id)); return id; }
export function instant(value: unknown): string {
    const input = text(value, 30); requireWalkthrough(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(input) && Number.isFinite(Date.parse(input)));
    return new Date(input).toISOString();
}
function day(value: unknown): string {
    const input = text(value, 10); requireWalkthrough(/^\d{4}-\d\d-\d\d$/.test(input) && new Date(input).toISOString().slice(0, 10) === input); return input;
}
function list<T>(value: unknown, max: number, read: (v: unknown) => T, min = 0): T[] {
    requireWalkthrough(Array.isArray(value) && value.length >= min && value.length <= max); return value.map(read);
}
export type StoryEvent = {action: 'decide'; recommendationId: string; choice: 'approved'|'declined'} | {action:'receive';recommendationId:string} | {action:'start';recommendationId:string;startedOn:string};
export type StoryReview = {channel:'text'|'phone'|'video'|'in_person';occurredOn:string;summary:string;reportedUse:string;decision:string;nextReviewOn:string};
export type StoryStage = {id:string;title:string;section:'plan'|'routine'|'checkins'|'payments'|'profile'|'service';day:string;body:string;messages:{speaker:string;text:string}[];events?:StoryEvent[];review?:StoryReview;instructionUpdates?:{productKey:string;reason:string;instructions:{morning?:string;evening?:string;notes?:string}}[]};
export type WalkthroughSnapshot = {schemaVersion:1;caseId:string;versionId:string;presentation:Presentation;stages:StoryStage[]};
function stage(value: unknown): StoryStage {
    const v = record(value); keys(v, ['id','title','section','day','body','messages'], ['events','review','instructionUpdates']);
    requireWalkthrough(['plan','routine','checkins','payments','profile','service'].includes(String(v.section)));
    const result: StoryStage = {id:stableId(v.id),title:text(v.title,200),section:v.section as StoryStage['section'],day:day(v.day),body:text(v.body,4000,true),messages:list(v.messages,20,m => {const x=record(m);keys(x,['speaker','text']);return {speaker:text(x.speaker,120),text:text(x.text,2000)};})};
    if (v.events !== undefined) result.events = list(v.events,20,e => {
        const x=record(e);requireWalkthrough(['decide','receive','start'].includes(String(x.action)));
        keys(x,['action','recommendationId',...(x.action==='decide'?['choice']:x.action==='start'?['startedOn']:[])]);
        const recommendationId=stableId(x.recommendationId);
        if(x.action==='decide'){requireWalkthrough(x.choice==='approved'||x.choice==='declined');return {action:'decide',recommendationId,choice:x.choice};}
        return x.action==='start'?{action:'start',recommendationId,startedOn:day(x.startedOn)}:{action:'receive',recommendationId};
    });
    if (v.review !== undefined) {
        const x=record(v.review);keys(x,['channel','occurredOn','summary','reportedUse','decision','nextReviewOn']);requireWalkthrough(['text','phone','video','in_person'].includes(String(x.channel)));
        result.review={channel:x.channel as StoryReview['channel'],occurredOn:day(x.occurredOn),summary:text(x.summary,4000),reportedUse:text(x.reportedUse,4000),decision:text(x.decision,4000),nextReviewOn:day(x.nextReviewOn)};
        requireWalkthrough(result.review.occurredOn<=result.day&&result.review.nextReviewOn>=result.review.occurredOn);
    }
    if (v.instructionUpdates !== undefined) result.instructionUpdates=list(v.instructionUpdates,20,u=>{
        const x=record(u);keys(x,['productKey','reason','instructions']);const i=record(x.instructions);keys(i,[],['morning','evening','notes']);requireWalkthrough(Object.keys(i).length>0);
        return {productKey:stableId(x.productKey),reason:text(x.reason,2000),instructions:Object.fromEntries(Object.entries(i).map(([k,value])=>[k,text(value,2000)]))};
    });
    return result;
}
/** Reconstruct every shared root and nested field. Never spread authoring or provider records. */
export function projectWalkthrough(value: unknown): WalkthroughSnapshot {
    const v=record(value);keys(v,['schemaVersion','caseId','versionId','presentation','stages']);requireWalkthrough(v.schemaVersion===1);
    const presentation=readPresentation(v.presentation),stages=list(v.stages,30,stage,1);
    requireWalkthrough(new Set(stages.map(x=>x.id)).size===stages.length && stages.every((x,i)=>i===0||stages[i-1].day<=x.day));
    // Private photographs, remote tracking images and private Storage URLs never enter this namespace.
    for(const step of presentation.baselineRoutine)requireWalkthrough(!step.product?.imageUrl||/^assets\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/.test(step.product.imageUrl));
    for(const card of presentation.categoryCards)for(const product of [card.currentProduct,card.proposedProduct])requireWalkthrough(!product?.imageUrl||/^assets\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/.test(product.imageUrl));
    const recs=new Set(presentation.categoryCards.flatMap(x=>x.recommendationId?[x.recommendationId]:[]));
    const products=new Set([...presentation.baselineRoutine.flatMap(x=>x.productId?[x.productId]:[]),...presentation.categoryCards.flatMap(x=>[x.currentProduct?.id,x.proposedProduct?.id].filter((id):id is string=>!!id))]);
    for(const s of stages){for(const event of s.events??[])requireWalkthrough(recs.has(event.recommendationId)&&(!('startedOn' in event)||event.startedOn<=s.day));for(const update of s.instructionUpdates??[])requireWalkthrough(products.has(update.productKey));}
    const result:WalkthroughSnapshot={schemaVersion:1,caseId:opaqueId(v.caseId),versionId:opaqueId(v.versionId),presentation,stages};
    requireWalkthrough(new TextEncoder().encode(JSON.stringify(result)).byteLength<=WALKTHROUGH_MAX_BYTES,413,'payload_too_large');
    return result;
}
export type PrivateWalkthroughInput = {schemaVersion:1;case:{id:string;title:string;status:'draft'|'ready';sourceReference:string};version:{id:string;createdAt:string;presentation:Presentation;stages:StoryStage[];provenance:Record<string,unknown>}};
export function validatePrivateInput(value:unknown): {input:PrivateWalkthroughInput;snapshot:WalkthroughSnapshot} {
    const root=record(value);keys(root,['schemaVersion','case','version']);requireWalkthrough(root.schemaVersion===1);
    const c=record(root.case),v=record(root.version);keys(c,['id','title','status','sourceReference']);keys(v,['id','createdAt','presentation','stages','provenance']);requireWalkthrough(c.status==='draft'||c.status==='ready');
    const snapshot=projectWalkthrough({schemaVersion:1,caseId:c.id,versionId:v.id,presentation:v.presentation,stages:v.stages});
    const provenance=record(v.provenance);requireWalkthrough(new TextEncoder().encode(JSON.stringify(provenance)).byteLength<=100_000,413,'payload_too_large');
    return {snapshot,input:{schemaVersion:1,case:{id:snapshot.caseId,title:text(c.title,200),status:c.status,sourceReference:text(c.sourceReference,2048)},version:{id:snapshot.versionId,createdAt:instant(v.createdAt),presentation:snapshot.presentation,stages:snapshot.stages,provenance:JSON.parse(JSON.stringify(provenance))}}};
}
