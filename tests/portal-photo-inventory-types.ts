import type {ApplicationSession} from '../apps/portal/src/app/session.ts';
import {createPhotoInventoryRequest} from '../apps/portal/src/app/photo-inventory-request.ts';
import type {CheckinPhotoInventoryPage} from '../supabase/functions/concierge-checkins/types.ts';
import type {CheckinPhotoInventory} from '../supabase/functions/concierge-checkins/projection.ts';
import type {OperationOptions} from '../apps/portal/src/transport/session.ts';

export function photoInventoryConsumer(runtime:ApplicationSession){
  const reader=createPhotoInventoryRequest(runtime);
  const read:(page:CheckinPhotoInventoryPage,options?:OperationOptions)=>Promise<CheckinPhotoInventory>=reader.readPage;
  const current:boolean=reader.isCurrent();reader.dispose();
  // @ts-expect-error a page has no client/owner selector
  void read({cursor:null,limit:50,expectedRevision:0,clientId:'caller'});
  // @ts-expect-error limit is an integer checked at runtime, never a string
  void read({cursor:null,limit:'50',expectedRevision:null});
  // @ts-expect-error no caller authority/currentness option
  void read({cursor:null,limit:1,expectedRevision:null},{current:true});
  // @ts-expect-error metadata cannot submit, upload or return raw bytes
  reader.upload({});
  return {current,read};
}
