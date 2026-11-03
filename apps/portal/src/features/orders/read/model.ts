import type {ServicePurchase,ServiceView,ReturnStatus,ServiceReturn} from '../../../../../../src/contracts/ConciergeService.ts';

export function selectClientPurchase(view:Pick<ServiceView,'purchases'>, id:string):ServicePurchase|null {
  const matches=view.purchases.filter(purchase=>purchase.id===id);
  return matches.length===1?matches[0]!:null;
}
export function recordedPurchaseTotalCents(purchase:Pick<ServicePurchase,'quantity'|'unitPriceCents'|'taxCents'|'shippingCents'>):number|null {
  const {quantity,unitPriceCents,taxCents,shippingCents}=purchase;
  if(!Number.isSafeInteger(quantity)||quantity<1 ||
    ![unitPriceCents,taxCents,shippingCents].every(value=>Number.isSafeInteger(value)&&value>=0))return null;
  const items=quantity*unitPriceCents,total=items+taxCents+shippingCents;
  return Number.isSafeInteger(items)&&Number.isSafeInteger(total)?total:null;
}
/** The purchase DTO has no currency field. Do not manufacture USD or a symbol. */
export function formatRecordedCents(value:number|null):string {
  if(value===null||!Number.isSafeInteger(value)||value<0)return 'not provided';
  return `${Math.floor(value/100)}.${String(value%100).padStart(2,'0')}`;
}
export function returnStatusLabel(status:ReturnStatus):string {
  const labels:Record<ReturnStatus,string>={
    requested:'return help requested',reviewing:'under review',authorized:'return authorized',
    declined:'return declined',awaiting_return:'awaiting return',in_transit:'return in transit',
    retailer_reviewing:'retailer reviewing',retailer_funds_received:'retailer funds receipt recorded',
    client_repaid:'client repayment recorded',
  };
  return labels[status];
}
export function returnConditionLabel(condition:ServiceReturn['condition']):string {
  return {unopened:'unopened',opened:'opened',used:'used',damaged:'damaged'}[condition];
}
export function dateLabel(value:string|null):string {
  return value??'not recorded';
}
