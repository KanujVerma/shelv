import type {ApplicationSession} from './session.ts';
import {clientCookieRequest} from './retained.ts';
import {TransportError} from '../transport/session.ts';
import type {OperationOptions} from '../transport/session.ts';
import type {CheckinPhotoInventoryPage} from '../../../../supabase/functions/concierge-checkins/types.ts';
import type {CheckinPhotoInventory} from '../../../../supabase/functions/concierge-checkins/projection.ts';
import {mapCheckinPhotoInventory} from '../../../../supabase/functions/concierge-checkins/projection.ts';
import {buildCheckinCall} from '../../../../supabase/functions/concierge-checkins/commands.ts';
import {exactKeys,readObject} from '../../../../src/contracts/ConciergePortalValidation.ts';

export type PhotoInventoryRequest={
  isCurrent():boolean;
  readPage(page:CheckinPhotoInventoryPage,options?:OperationOptions):Promise<CheckinPhotoInventory>;
  dispose():void;
};
/** One authenticated page only. Completeness and raw-photo access are separate. */
export function createPhotoInventoryRequest(runtime:ApplicationSession):PhotoInventoryRequest{
  const cookie=runtime.cookie,boundary=runtime.getSnapshot().boundary,owner=cookie.identity?.ownerId;
  if(cookie.audience!=='client'||cookie.identity?.role!=='client')throw new TransportError(403);
  const epoch=cookie._epoch,generation=cookie.generation,serverGeneration=cookie._view?.generation,lifetime=new AbortController();
  let disposed=false;
  const same=()=>!disposed&&!!boundary&&runtime.getSnapshot().boundary===boundary&&cookie.audience==='client'&&
    cookie.identity?.role==='client'&&cookie.identity.ownerId===owner&&cookie._epoch===epoch&&cookie.generation===generation&&cookie._view?.generation===serverGeneration;
  const current=()=>{
    if(!same()||!boundary!.isCurrent()||!same())throw new TransportError(401);
    if(cookie._view?.capabilities.view!==true)throw new TransportError(403);
  };
  const privateCurrent=()=>{current();if(cookie.status!=='ready')throw new TransportError(503);current();};
  current();const request=clientCookieRequest('checkins',cookie);
  return {
    isCurrent(){try{current();return true;}catch{return false;}},
    dispose(){disposed=true;lifetime.abort();},
    async readPage(input,options={}){
      current();const callerSignal=options.signal,local=options.isApplicable;
      const signal=callerSignal?AbortSignal.any([callerSignal,lifetime.signal]):lifetime.signal;
      const applicable=()=>{
        current();if(signal.aborted)return false;let applies=true;
        try{applies=local===undefined||typeof local==='function'&&local()===true;}catch{applies=false;}
        current();return applies&&!signal.aborted;
      };
      let page:CheckinPhotoInventoryPage;
      try{
        const wire=JSON.stringify(input);current();if(typeof wire!=='string')throw new TransportError(400);
        if(new TextEncoder().encode(wire).byteLength>100000)throw new TransportError(413);
        const detached=readObject(JSON.parse(wire));exactKeys(detached,['cursor','limit','expectedRevision']);
        const call=buildCheckinCall({action:'read_photo_inventory_v1',...detached},owner!);
        if(call.name!=='concierge_checkin_photo_inventory_v1')throw new TransportError(400);
        page=Object.freeze({cursor:call.args.p_cursor,limit:call.args.p_limit,expectedRevision:call.args.p_expected_revision});
      }catch(error){current();if(error instanceof TransportError)throw error;throw new TransportError(400);}
      current();if(!applicable())throw new TransportError(503);
      const command=Object.freeze({action:'read_photo_inventory_v1',...page});
      try{
        const result=await runtime.transport.bind({kind:'read',invoke:request,decode(value){
          privateCurrent();const mapped=mapCheckinPhotoInventory(value,page);if(!mapped.ok)throw new TransportError(503);
          privateCurrent();return mapped.value;
        }}).execute(command,{signal,isApplicable:applicable});
        privateCurrent();if(!applicable()||signal.aborted)throw new TransportError(503);privateCurrent();return result;
      }catch(error){current();throw error;}
    },
  };
}
