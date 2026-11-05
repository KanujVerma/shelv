/** TEST ADAPTER ONLY. A filesystem acceptance receipt is not external email delivery. */
import {constants} from 'node:fs';
import {open,lstat,realpath} from 'node:fs/promises';
import {isAbsolute,dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import type {NotificationAdapter,AdapterResult} from './worker.ts';
import {readNeutralNotificationEmail} from './neutralPayload.ts';
import {requireValue} from '../../../src/contracts/ConciergePortalValidation.ts';
export async function createLocalNotificationSink(directory:string):Promise<NotificationAdapter>{
 requireValue(isAbsolute(directory));let parent=directory;
 while(true){const s=await lstat(parent);requireValue(s.isDirectory()&&!s.isSymbolicLink());const next=dirname(parent);if(next===parent)break;parent=next;}
 const root=await realpath(directory),identity=await lstat(root);requireValue((identity.mode&0o777)===0o700);
 const current=async()=>{const s=await lstat(directory);requireValue(s.isDirectory()&&!s.isSymbolicLink()&&s.dev===identity.dev&&s.ino===identity.ino&&(s.mode&0o777)===0o700&&await realpath(directory)===root);};
 return {kind:'local_synthetic_filesystem',send:async(value):Promise<AdapterResult>=>{
  const message=readNeutralNotificationEmail(value);requireValue(/^[a-z0-9][a-z0-9._+-]{0,63}@synthetic\.invalid$/i.test(message.to));
  const payloadHash=createHash('sha256').update(JSON.stringify(message)).digest('hex'),path=join(root,message.deliveryId+'.json');await current();
  let handle;
  try{handle=await open(path,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);}
  catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')return {status:'uncertain',errorCode:'local_receipt_unavailable'};
   try{await current();const h=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);try{const s=await h.stat();requireValue(s.isFile()&&(s.mode&0o777)===0o600&&s.nlink===1&&s.size<=8192);const r=JSON.parse(await h.readFile('utf8')) as Record<string,unknown>;requireValue(Object.keys(r).sort().join(',')==='deliveryId,message,payloadHash,schemaVersion,status'&&r.schemaVersion===1&&r.status==='accepted'&&r.deliveryId===message.deliveryId&&r.payloadHash===payloadHash&&JSON.stringify(r.message)===JSON.stringify(message));await current();return {status:'accepted',providerMessageId:`local-synthetic:${message.deliveryId}`};}finally{await h.close();}}
   catch{return {status:'uncertain',errorCode:'local_receipt_uncertain'};}
  }
  try{await current();await handle.writeFile(JSON.stringify({schemaVersion:1,deliveryId:message.deliveryId,status:'accepted',payloadHash,message})+'\n','utf8');await handle.sync();await current();return {status:'accepted',providerMessageId:`local-synthetic:${message.deliveryId}`};}
  catch{return {status:'uncertain',errorCode:'local_receipt_uncertain'};}finally{await handle.close();}
 }};
}
