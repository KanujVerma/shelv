import type {ServicePurchase,ServiceReturn,ReturnEvent,ReturnStatus} from './ConciergeService.ts';
import {readReturnPolicy} from './ConciergeService.ts';
import {exactKeys,readArray,readDate,readIdentifier,readInteger,readObject,readText,readUuid,requireValue} from './ConciergePortalValidation.ts';
import type {ClientOrdersReadCommand,ClientOrdersReadView} from './PortalClientOrders.ts';
import {clientOrdersReadCommandMaxBytes,clientOrdersReadResultMaxBytes} from './PortalClientOrdersValues.ts';

// Exact closed subset of ConciergeService.mapServiceView purchase/return readers
// (Root68 blob 8d2a990b89c35b38e8cf32d9d68fcdb7b28bf649). The private legacy
// row readers are not exported. Reuse their validators and exported policy reader;
// do not fabricate an unrelated ServiceView or change shared exports.
const statuses:readonly ReturnStatus[]=['requested','reviewing','authorized','declined','awaiting_return','in_transit','retailer_reviewing','retailer_funds_received','client_repaid'];
const nullable=<T>(value:unknown,read:(v:unknown)=>T):T|null=>value===null?null:read(value);
const text=(value:unknown,max=4000)=>{const s=readText(value,max);requireValue(!s.includes('\0'));return s;};
const stamp=(value:unknown)=>{const s=text(value,60);requireValue(Number.isFinite(Date.parse(s)));return s;};
const cents=(value:unknown)=>readInteger(value,0,100000000);
const member=<T extends string>(value:unknown,values:readonly T[]):T=>{requireValue(values.includes(value as T));return value as T;};
const bytes=(value:unknown,maximum:number)=>requireValue(new TextEncoder().encode(JSON.stringify(value)).byteLength<=maximum);

export function readClientOrdersReadCommand(value:unknown):ClientOrdersReadCommand{
 const v=readObject(value);exactKeys(v,['schemaVersion','action']);requireValue(v.schemaVersion===1&&v.action==='read_client_orders_v1');
 const command:ClientOrdersReadCommand={schemaVersion:1,action:'read_client_orders_v1'};
 bytes(command,clientOrdersReadCommandMaxBytes);return Object.freeze(command);
}
function purchase(value:unknown):ServicePurchase{
 const p=readObject(value);exactKeys(p,['id','quoteId','recommendationId','retailer','seller','productId','productName','quantity','unitPriceCents','taxCents','shippingCents','purchasedOn','deliveredOn','policy','recordedAt','recordedBy']);
 return Object.freeze({id:readUuid(p.id),quoteId:nullable(p.quoteId,readUuid),recommendationId:nullable(p.recommendationId,readIdentifier),retailer:text(p.retailer,200),seller:text(p.seller,200),productId:readIdentifier(p.productId),productName:text(p.productName,200),quantity:readInteger(p.quantity,1,100),unitPriceCents:cents(p.unitPriceCents),taxCents:cents(p.taxCents),shippingCents:cents(p.shippingCents),purchasedOn:readDate(p.purchasedOn),deliveredOn:nullable(p.deliveredOn,readDate),policy:Object.freeze(readReturnPolicy(p.policy)),recordedAt:stamp(p.recordedAt),recordedBy:readUuid(p.recordedBy)});
}
function event(value:unknown):ReturnEvent{
 const e=readObject(value);exactKeys(e,['id','status','note','expectedRefundCents','retailerRefundCents','clientRepaidCents','policyCheckedOn','actorId','recordedAt']);
 return Object.freeze({id:readUuid(e.id),status:member(e.status,statuses),note:text(e.note),expectedRefundCents:nullable(e.expectedRefundCents,cents),retailerRefundCents:nullable(e.retailerRefundCents,cents),clientRepaidCents:nullable(e.clientRepaidCents,cents),policyCheckedOn:nullable(e.policyCheckedOn,readDate),actorId:readUuid(e.actorId),recordedAt:stamp(e.recordedAt)});
}
function returned(value:unknown):ServiceReturn{
 const r=readObject(value);exactKeys(r,['id','purchaseId','quantity','reason','condition','status','requestedAt','events']);
 const events=readArray(r.events).map(event);Object.freeze(events);
 return Object.freeze({id:readUuid(r.id),purchaseId:readUuid(r.purchaseId),quantity:readInteger(r.quantity,1,100),reason:text(r.reason,2000),condition:member(r.condition,['unopened','opened','used','damaged'] as const),status:member(r.status,statuses),requestedAt:stamp(r.requestedAt),events});
}
export function readClientOrdersReadView(value:unknown):ClientOrdersReadView{
 const v=readObject(value);exactKeys(v,['schemaVersion','revision','purchases','returns']);requireValue(v.schemaVersion===1);
 bytes(v,clientOrdersReadResultMaxBytes);
 const purchases=readArray(v.purchases).map(purchase),returns=readArray(v.returns).map(returned);
 Object.freeze(purchases);Object.freeze(returns);
 return Object.freeze({schemaVersion:1,revision:readInteger(v.revision),purchases,returns});
}
