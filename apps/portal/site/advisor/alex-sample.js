import {createApprovedAlexPresentation} from './presentation-fixtures.js';
import {deriveRecommendations} from './presentation-model.js';

/** Original approved Alex only. No auth identity, live fallback, or writable fixture store. */
export function createAlexSample() {
  const presentation=createApprovedAlexPresentation(),recommendations=deriveRecommendations(presentation);
  const plan={version:1,presentation,recommendations,itemStates:recommendations.map(item=>({recommendationId:item.id,choice:null,reason:null,received:false,startedOn:null}))};
  const activeRoutine=presentation.baselineRoutine.map(step=>({...structuredClone(step),source:{kind:'baseline',publicationVersion:1,recommendationId:null},guides:presentation.routineGuides.filter(guide=>guide.productId===null||guide.productId===step.productId).map(guide=>structuredClone(guide))}));
  return {schemaVersion:1,mode:'published',sample:true,clientId:'sample:alex',revision:0,draft:null,
    clientView:{schemaVersion:2,revision:0,plan,history:[],routine:presentation.baselineRoutine.filter(step=>step.kind==='product').map(step=>({slot:step.slot,productId:step.productId})),routineHistory:[],activeRoutine,orderProposal:{kind:'proposal',currency:'USD',items:[],subtotalCents:0,payable:false,shippingAndTaxConfirmed:false}},
    payments:{revision:0,quotes:[],claims:[],shippingAddress:null,shippingAddresses:[],service:{status:'unpaid',period:null},nextServicePeriod:null},
    checkins:{revision:0,nextCheckinOn:null,reports:[]}};
}
