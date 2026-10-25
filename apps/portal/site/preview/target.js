const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KEY='shelv:portal:pending-preview:v1',MAX_AGE=30*60*1000;
const fail=()=>{throw new Error('invalid_preview_target');};
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
function validate(target){
 if(exact(target,['kind','sampleId'])&&target.kind==='sample'&&['alex','maya'].includes(target.sampleId))return {kind:'sample',sampleId:target.sampleId};
 if(!exact(target,['kind','mode','clientId','expectedRevision'])||target.kind!=='client'||typeof target.clientId!=='string'||!UUID.test(target.clientId))return fail();
 const {mode,expectedRevision}=target;
 if(mode==='draft'&&!Number.isSafeInteger(expectedRevision)||mode==='draft'&&expectedRevision<0||mode==='published'&&expectedRevision!==null||!['draft','published'].includes(mode))return fail();
 return {kind:'client',mode,clientId:target.clientId.toLowerCase(),expectedRevision};
}
export function parsePreviewTarget(search){
 const params=new URLSearchParams(search);
 if(!params.has('advisorPreview'))return null;
 for(const key of ['advisorPreview','clientId','revision','sample'])if(params.getAll(key).length>1)return fail();
 const mode=params.get('advisorPreview');
 if(mode==='sample'){
  if(!['alex','maya'].includes(params.get('sample'))||params.has('clientId')||params.has('revision'))return fail();
  return {kind:'sample',sampleId:params.get('sample')};
 }
 if(!['draft','published'].includes(mode)||params.has('sample'))return fail();
 const text=params.get('revision');
 if(mode==='draft'&&(text===null||!/^(0|[1-9][0-9]*)$/.test(text))||mode==='published'&&params.has('revision'))return fail();
 return validate({kind:'client',mode,clientId:params.get('clientId'),expectedRevision:mode==='draft'?Number(text):null});
}
export function previewHref(input,base,{freshSignIn=false}={}){
 const target=validate(input),url=new URL(base);
 if(url.username||url.password||!['https:','http:'].includes(url.protocol))return fail();
 url.search='';url.hash='#/client';if(freshSignIn)url.searchParams.set('signin','1');
 if(target.kind==='sample'){url.searchParams.set('advisorPreview','sample');url.searchParams.set('sample',target.sampleId);}
 else {url.searchParams.set('advisorPreview',target.mode);url.searchParams.set('clientId',target.clientId);if(target.mode==='draft')url.searchParams.set('revision',String(target.expectedRevision));}
 return url.href;
}
export function createPreviewTargetStore(storage,now=()=>Date.now()){
 const clear=()=>{try{storage?.removeItem(KEY);}catch{}};
 return {
  put(input){const target=validate(input),createdAt=now();if(!Number.isFinite(createdAt))return false;try{storage?.setItem(KEY,JSON.stringify({version:1,createdAt,target}));return !!storage;}catch{return false;}},
  get({strict=false}={}){
   let raw;try{raw=storage?.getItem(KEY);}catch{return null;}
   if(raw===null||raw===undefined)return null;
   try{
   if(raw.length>1024)throw Error();
   const record=JSON.parse(raw),time=now();
   if(!exact(record,['version','createdAt','target'])||record.version!==1||!Number.isFinite(time)||!Number.isFinite(record.createdAt)||record.createdAt>time||time-record.createdAt>=MAX_AGE)throw Error();
   return validate(record.target);
  }catch{clear();if(strict)return fail();return null;}},
  clear,
 };
}
export function savedPreviewTarget(state,mode){
 if(state.revoked||!UUID.test(state.clientId??'')||!Number.isSafeInteger(state.revision)||state.revision<0)return null;
 if(mode==='published')return {kind:'client',mode,clientId:state.clientId,expectedRevision:null};
 if(mode!=='draft'||state.dirty||state.pending||['saving','uncertain','conflict'].includes(state.status)||state.hasUnsavedNotes||state.hasPendingPrivate||!state.draft?.presentation||state.draft.intakeVersion!==state.intakeVersion)return null;
 return {kind:'client',mode,clientId:state.clientId,expectedRevision:state.revision};
}
