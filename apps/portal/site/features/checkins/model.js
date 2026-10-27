const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const requireValue=value=>{if(!value)throw Error('invalid_input');};
const text=(value,max,empty=false)=>{requireValue(typeof value==='string'&&!value.includes('\u0000')&&Array.from(value).length<=max&&(empty||value.trim()));return value;};
const revision=value=>{requireValue(Number.isSafeInteger(value)&&value>=0&&value<Number.MAX_SAFE_INTEGER);return value;};
const id=value=>{requireValue(uuid(value));return value.toLowerCase();};
const angle=value=>{requireValue(['front','left','right'].includes(value));return value;};
const replyText=value=>{const result=text(value,4000);requireValue(!/[\uD800-\uDFFF]/u.test(result));return result;};
export function validDate(value){if(value===null)return null;requireValue(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&value>='1900-01-01');const date=new Date(value+'T00:00:00Z');requireValue(Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value);return value;}
export function reportCommand(fields,photos,expectedRevision,requestId){
 requireValue(Array.isArray(photos)&&photos.length<=3);const refs=photos.map(p=>({id:id(p.id),angle:angle(p.angle)}));
 requireValue(new Set(refs.map(p=>p.id)).size===refs.length&&new Set(refs.map(p=>p.angle)).size===refs.length);
 return Object.freeze({action:'submit_report',requestId:id(requestId),expectedRevision:revision(expectedRevision),comfort:text(fields.comfort,1000),
  consistency:text(fields.consistency,1000),changes:text(fields.changes,1000,true),photoIds:Object.freeze(refs.map(p=>p.id).sort())});
}
export function publicView(raw){
 requireValue(raw&&Array.isArray(raw.reports));const reports=raw.reports.map(r=>{
  requireValue(r&&Array.isArray(r.photos)&&typeof r.submittedAt==='string'&&Number.isFinite(Date.parse(r.submittedAt)));
  const parsed=reportCommand(r,r.photos,0,r.id);
  const replies=r.advisorReplies===undefined?[]:r.advisorReplies;requireValue(Array.isArray(replies));
  const advisorReplies=replies.map(reply=>{requireValue(reply&&typeof reply.createdAt==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(reply.createdAt)&&Number.isFinite(Date.parse(reply.createdAt)));return {id:id(reply.id),reply:replyText(reply.reply),authorId:id(reply.authorId),createdAt:reply.createdAt};});
  requireValue(new Set(advisorReplies.map(reply=>reply.id)).size===advisorReplies.length);
  return {id:id(r.id),submittedAt:r.submittedAt,comfort:parsed.comfort,consistency:parsed.consistency,changes:parsed.changes,
   photos:r.photos.map(p=>({id:id(p.id),angle:angle(p.angle)})),advisorReplies};
 });return {revision:revision(raw.revision),nextCheckinOn:validDate(raw.nextCheckinOn),reports};
}
export function nextDateCommand(clientId,nextCheckinOn,expectedRevision,requestId){return Object.freeze({action:'set_next_checkin',clientId:id(clientId),
 nextCheckinOn:validDate(nextCheckinOn),expectedRevision:revision(expectedRevision),requestId:id(requestId)});}
export function noteCommand(clientId,checkinId,note,expectedRevision,requestId){return Object.freeze({action:'add_meeting_note',clientId:id(clientId),checkinId:id(checkinId),
 note:text(note,4000),expectedRevision:revision(expectedRevision),requestId:id(requestId)});}
export function replyCommand(clientId,checkinId,reply,expectedRevision,requestId){return Object.freeze({action:'send_advisor_reply',clientId:id(clientId),checkinId:id(checkinId),
 reply:replyText(reply),expectedRevision:revision(expectedRevision),requestId:id(requestId)});}
export function publicError(error,fallback='We could not confirm this action. Retry the same request to avoid a duplicate.'){
 if(error?.code==='service_inactive')return 'New check-ins are unavailable for this service period. Your existing plan remains readable.';
 if(error?.status===401)return 'Your session ended. Sign in again to continue.';
 if(error?.status===403||error?.code==='forbidden')return 'This action is unavailable for your account. Reload your access or contact your advisor.';
 if(error?.status===409)return 'The record changed. Reload the latest history and review it before saving again.';
 if(error?.status===413||error?.code==='photo_too_large')return 'Choose a photo no larger than 5 MiB.';
 if(error?.status===415||error?.code==='unsupported_photo')return 'Choose a JPEG, PNG or WebP photo.';
 if(error?.status===400||error?.code==='invalid_input')return 'Review the answers and photo format, then try again.';
 return fallback;
}
export function displayDay(value){if(!value)return 'To be arranged';const date=new Date(value.slice(0,10)+'T12:00:00Z');return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('en',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(date):'To be arranged';}
