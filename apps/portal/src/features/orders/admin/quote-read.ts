import type {CommerceCommand,CommercePage,CommerceIndexEntry,CommerceDetailResult,CommerceComponentsPage,ProductQuoteLineDraft,FrozenManualOption} from '../../../../../../src/contracts/PortalCommerce.ts';
import {mapCommerceResult,collectCommerceComponents} from '../../../../../../src/contracts/PortalCommerceMapping.ts';
import {requireValue} from '../../../../../../src/contracts/ConciergePortalValidation.ts';
import type {ProductQuoteAdminRequest,ProductQuoteReadContext,ProductQuoteReadOptions,ProductQuoteIndex,ProductQuoteDraftRead,ProductQuoteDraftSelection} from './types.ts';

function immutable<T>(value:T):T {
 if(value!==null&&typeof value==='object'){for(const item of Object.values(value))immutable(item);Object.freeze(value);}
 return value;
}
function check(options:ProductQuoteReadOptions):void {
 if(options.signal?.aborted)throw new Error('unavailable');
 if(options.isApplicable!==undefined&&options.isApplicable()!==true)throw new Error('unavailable');
 if(options.signal?.aborted)throw new Error('unavailable');
}
/** Complete canonical data reads only. These correlation IDs/options supply no
 * selected-client/finance authority; that stays with the real port and SQL. */
export async function readAdminQuoteIndex(request:ProductQuoteAdminRequest,context:ProductQuoteReadContext,options:ProductQuoteReadOptions={}):Promise<ProductQuoteIndex> {
 const entries:CommerceIndexEntry[]=[],ids=new Set<string>(),cursors=new Set<string>();
 let snapshot:ProductQuoteIndex['snapshot']|null=null,cursor:string|null=null;
 do{
  check(options);
  const command:Extract<CommerceCommand,{action:'read_advisor_commerce_v1'}>={schemaVersion:1,action:'read_advisor_commerce_v1',clientId:context.clientId,snapshot,cursor,limit:100};
  const raw=await request.execute(command,options);check(options);
  const page=mapCommerceResult(command,raw,{actorId:context.actorId,requestHash:null}) as CommercePage<CommerceIndexEntry>;
  check(options);
  for(const entry of page.entries){const key=entry.entity.kind+':'+entry.entity.id;requireValue(!ids.has(key));ids.add(key);entries.push(entry);}
  snapshot=page.snapshot;cursor=page.nextCursor;
  if(cursor){requireValue(!cursors.has(cursor));cursors.add(cursor);}
 }while(cursor!==null);
 check(options);requireValue(snapshot!==null);return immutable({snapshot,entries});
}
export async function loadAdminQuoteDraft(request:ProductQuoteAdminRequest,context:ProductQuoteReadContext,selection:ProductQuoteDraftSelection,options:ProductQuoteReadOptions={}):Promise<ProductQuoteDraftRead> {
 check(options);requireValue(selection.entity.kind==='quote_draft');
 const command:Extract<CommerceCommand,{action:'read_advisor_commerce_detail_v1'}>={schemaVersion:1,action:'read_advisor_commerce_detail_v1',clientId:context.clientId,entity:selection.entity,snapshot:selection.snapshot};
 const raw=await request.execute(command,options);check(options);
 const result=mapCommerceResult(command,raw,{actorId:context.actorId,requestHash:null}) as CommerceDetailResult;
 check(options);const draft=result.detail;requireValue(draft.kind==='quote_draft');
 const collect=async(component:'lines'|'payment_options')=>{
  const pairs:Parameters<typeof collectCommerceComponents>[0]=[],cursors=new Set<string>();let cursor:string|null=null;
  do{
   check(options);
   const read:Extract<CommerceCommand,{action:'read_advisor_quote_components_v1'}>={schemaVersion:1,action:'read_advisor_quote_components_v1',clientId:context.clientId,snapshot:selection.snapshot,cursor,limit:100,quote:{kind:'draft',target:draft.target},component};
   const value=await request.execute(read,options);check(options);
   const page=mapCommerceResult(read,value,{actorId:context.actorId,requestHash:null}) as CommerceComponentsPage;
   check(options);pairs.push({command:read,page});cursor=page.nextCursor;
   if(cursor){requireValue(!cursors.has(cursor));cursors.add(cursor);}
  }while(cursor!==null);
  check(options);return collectCommerceComponents(pairs);
 };
 const lines=await collect('lines');check(options);
 const receiving=await collect('payment_options');check(options);
 return immutable({snapshot:result.snapshot,draft,lines:lines as ProductQuoteLineDraft[],options:receiving as FrozenManualOption[]});
}
