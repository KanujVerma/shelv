import {reportCommand,nextDateCommand,noteCommand,replyCommand,publicView} from './model.js';
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const reportId='ae000000-0000-4000-8000-000000000002',photoId='ae000000-0000-4000-8000-000000000003';
/** Explicit synthetic in-memory preview only. No fetch, credential, persistent storage or network fallback. */
export function createCheckinPreviewStore(){
 return {kind:'synthetic-checkin-preview',revision:3,nextCheckinOn:'2026-11-01',
  reports:[{id:reportId,submittedAt:'2026-10-18T12:00:00Z',comfort:'Comfortable most days',consistency:'Most mornings and evenings',
   changes:'A little dryness after travel; I would like to discuss it.',photos:[{id:photoId,angle:'front'}]}],
  notes:[{id:'ae000000-0000-4000-8000-000000000004',checkinId:reportId,note:'Sample meeting note: discuss the client’s comfort report during the call.',createdAt:'2026-10-18T14:00:00Z'}],
  uploads:new Map(),receipts:new Map()};
}
export function createCheckinPreviewRequest({mode,store=createCheckinPreviewStore()}){
 if(!['client','advisor'].includes(mode)||store?.kind!=='synthetic-checkin-preview')throw Error('Invalid synthetic mode/store');
 const {reports,notes,uploads,receipts}=store;
 const fail=(status,code)=>{throw {status,code};};
 const clone=value=>structuredClone(value),client=()=>clone(publicView({revision:store.revision,nextCheckinOn:store.nextCheckinOn,reports}));
 const request=async(body,{signal}={})=>{
  if(signal?.aborted)throw new DOMException('Aborted','AbortError');
  let command=body,file;
  if(body instanceof FormData){try{command=JSON.parse(body.get('metadata'));file=body.get('file');}catch{fail(400,'invalid_input');}}
  if(command?.action==='client_read')return client();
  if(command?.action==='advisor_read'){if(mode!=='advisor')fail(403,'forbidden');return {client:client(),meetingNotes:clone(notes)};}
  if(['photo_view','advisor_photo_view'].includes(command?.action)){
   if(command.action==='advisor_photo_view'&&mode!=='advisor')fail(403,'forbidden');
   if(!reports.some(report=>report.photos.some(photo=>photo.id===command.photoId)))fail(404,'photo_unavailable');
   return {photoId:command.photoId,signedUrl:png,expiresIn:60,synthetic:true};
  }
  const requestId=command?.requestId;if(typeof requestId!=='string')fail(400,'invalid_input');const receiptKey=mode+':'+requestId;
  const fingerprint=JSON.stringify(command)+(file?`:${file.size}:${file.type}`:'');
  if(receipts.has(receiptKey)){const previous=receipts.get(receiptKey);if(previous.fingerprint!==fingerprint)fail(409,'request_conflict');return clone(previous.result);}
  if(command.expectedRevision!==store.revision)fail(409,'revision_conflict');
  let result;
  if(command.action==='upload_photo'){
   if(mode!=='client')fail(403,'forbidden');
   if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size<1||file.size>5*1024*1024||!['front','left','right'].includes(command.angle)||command.completionRequestId===requestId)fail(400,'invalid_input');
   const photo={id:crypto.randomUUID(),angle:command.angle};uploads.set(photo.id,photo);store.revision+=2;result={revision:store.revision,photo};
  }else if(command.action==='submit_report'){
   if(mode!=='client')fail(403,'forbidden');
   let parsed;try{parsed=reportCommand(command,command.photoIds.map(id=>uploads.get(id)),store.revision,requestId);}catch{fail(400,'invalid_input');}
   const report={id:crypto.randomUUID(),submittedAt:new Date().toISOString(),comfort:parsed.comfort,consistency:parsed.consistency,changes:parsed.changes,
    photos:parsed.photoIds.map(id=>uploads.get(id))};for(const id of parsed.photoIds)uploads.delete(id);reports.push(report);store.revision++;result={revision:store.revision,operation:command.action,reportId:report.id};
  }else if(command.action==='set_next_checkin'){
   if(mode!=='advisor')fail(403,'forbidden');try{store.nextCheckinOn=nextDateCommand(command.clientId,command.nextCheckinOn,store.revision,requestId).nextCheckinOn;}catch{fail(400,'invalid_input');}
   store.revision++;result={revision:store.revision,operation:command.action,reportId:null};
  }else if(command.action==='send_advisor_reply'){
   if(mode!=='advisor')fail(403,'forbidden');const keys=['action','clientId','checkinId','reply','requestId','expectedRevision'];if(Object.keys(command).length!==keys.length||!keys.every(key=>Object.hasOwn(command,key)))fail(400,'invalid_input');let parsed;try{parsed=replyCommand(command.clientId,command.checkinId,command.reply,store.revision,requestId);}catch{fail(400,'invalid_input');}
   const report=reports.find(report=>report.id===parsed.checkinId);if(!report)fail(404,'not_found');
   (report.advisorReplies??=[]).push({id:crypto.randomUUID(),reply:parsed.reply,authorId:'ae000000-0000-4000-8000-000000000099',createdAt:new Date().toISOString()});store.revision++;result={revision:store.revision,operation:command.action,reportId:parsed.checkinId};
  }else if(command.action==='add_meeting_note'){
   if(mode!=='advisor')fail(403,'forbidden');let parsed;try{parsed=noteCommand(command.clientId,command.checkinId,command.note,store.revision,requestId);}catch{fail(400,'invalid_input');}
   if(!reports.some(report=>report.id===parsed.checkinId))fail(404,'not_found');notes.push({id:crypto.randomUUID(),checkinId:parsed.checkinId,note:parsed.note,createdAt:new Date().toISOString()});store.revision++;result={revision:store.revision,operation:command.action,reportId:parsed.checkinId};
  }else fail(400,'invalid_input');
  receipts.set(receiptKey,{fingerprint,result:clone(result)});return result;
 };
 request.syntheticPreview=true;return request;
}
