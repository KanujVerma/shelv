import {mayaPlan} from './plan-fixture.mjs';
import {mapCareResult} from '../../../../src/contracts/PortalCareMapping.ts';
export const owner='11111111-1111-4111-8111-111111111111';
export const uid=n=>`33333333-3333-4333-8333-${String(n).padStart(12,'0')}`;
export const read={schemaVersion:1,action:'read_client_plan_v2',version:null};
export function carePlan(){const v=mayaPlan();const result={...v,schemaVersion:2,use:{revision:0,planProducts:v.plan.content.products.map(p=>({product:{kind:'plan_product',publication:{version:1,documentSchemaVersion:3},productId:p.id,slotId:null},state:'not_reported',originalStart:{state:'unknown'},latestEvent:null,identity:null,contradiction:false})),reportedProducts:{items:[],nextCursor:null}},latestPublicReview:null};return mapCareResult(result,read);}
export function summary(product,kind='stopped',n=1){return{eventId:uid(n),product,changeKind:kind,occurredOn:{state:'unknown'},channel:'portal',reportedBy:owner,recordedBy:owner,recordedAt:'2026-10-30T12:00:00Z',sourcePublication:product.kind==='plan_product'?product.publication:null,acquisition:'unknown',identityEventId:null,originalActivationId:null,amendment:null};}
