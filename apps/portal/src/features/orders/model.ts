import type {CommerceCommand,CommerceComponentsPage,CommerceHistoryEntry,CommercePage,CommerceIndexEntry,CommerceSnapshot,CommerceEntityRef,CommerceDetailResult} from '../../../../../src/contracts/PortalCommerce.ts';
import {mapCommerceResult,checkFrozenCommerceComposition,collectCommerceComponents} from '../../../../../src/contracts/PortalCommerceMapping.ts';
import {CommerceError} from './port.ts';
import type {CommercePort,OrdersIndex,OrdersSelection,CompleteQuote,ClientCommerceCommand} from './types.ts';
/** Revalidates even a typed port. No private/advisor or service policy projection
 * is accepted into the owned product UI. Transport still owns raw byte limits. */
export async function readOrdersIndex(port:CommercePort,actorId:string,snapshot:CommerceSnapshot|null=null,cursor:string|null=null,signal?:AbortSignal):Promise<OrdersIndex>{
 const command={schemaVersion:1,action:'read_commerce_v1',snapshot,cursor,limit:100} as const;
 const result=mapCommerceResult(command,await port.execute(command,{signal}),{actorId,requestHash:null}) as CommercePage<CommerceIndexEntry>;
 return {snapshot:result.snapshot,entries:result.entries.filter(e=>!['refund_request','obligation'].includes(e.entity.kind)),nextCursor:result.nextCursor};
}
/** Complete quote and history collection. No N-line/N-option shortcut and no
 * client draft reads. Each response is validated with the actual Root mapper. */
export async function loadOrdersSelection(port:CommercePort,entity:CommerceEntityRef,snapshot:CommerceSnapshot,actorId:string,signal?:AbortSignal):Promise<OrdersSelection>{
 const command={schemaVersion:1,action:'read_commerce_detail_v1',entity,snapshot} as const;
 const raw=await port.execute(command,{signal});
 if(!('clientId'in raw))throw new CommerceError(503);
 const result=mapCommerceResult(command,raw,{actorId,requestHash:null}) as CommerceDetailResult;
 const detail=result.detail;
 if(detail.kind==='quote_draft'||detail.kind==='refund_request'||detail.kind==='obligation')throw new CommerceError(503);
 let quote:CompleteQuote|null=null;
 if(detail.kind==='quote'){
  const header=detail;
  const collect=async(component:'lines'|'payment_options')=>{
   const pairs:Parameters<typeof collectCommerceComponents>[0]=[],seen=new Set<string>();let cursor:string|null=null;
   do{
    if(signal?.aborted)throw new CommerceError(503);
    const c:Extract<CommerceCommand,{action:'read_quote_components_v1'}>={schemaVersion:1,action:'read_quote_components_v1',snapshot,cursor,limit:100,quote:{kind:'issued',target:header.target},component};
    const page=mapCommerceResult(c,await port.execute(c,{signal}),{actorId,requestHash:null}) as CommerceComponentsPage;
    pairs.push({command:c,page});cursor=page.nextCursor;
    if(cursor){if(seen.has(cursor))throw new CommerceError(503);seen.add(cursor);}
   }while(cursor!==null);
   return pairs;
  };
  const lines=await collect('lines'),options=await collect('payment_options');
  await checkFrozenCommerceComposition(header,lines,options);
  if(signal?.aborted)throw new CommerceError(503);
  quote={header,lines:collectCommerceComponents(lines) as CompleteQuote['lines'],options:collectCommerceComponents(options) as CompleteQuote['options'],verified:true};
 }
 const history:CommerceHistoryEntry[]=[],seen=new Set<string>(),ids=new Set<string>();let cursor:string|null=null;
 do{
  if(signal?.aborted)throw new CommerceError(503);
  const c:ClientCommerceCommand={schemaVersion:1,action:'read_commerce_history_v1',snapshot,cursor,limit:100,entity};
  const page=mapCommerceResult(c,await port.execute(c,{signal}),{actorId,requestHash:null}) as CommercePage<CommerceHistoryEntry>;
  for(const entry of page.entries){if(ids.has(entry.id))throw new CommerceError(503);ids.add(entry.id);history.push(entry);}
  cursor=page.nextCursor;if(cursor){if(seen.has(cursor))throw new CommerceError(503);seen.add(cursor);}
 }while(cursor!==null);
 return {entity,snapshot,detail,quote,history};
}
