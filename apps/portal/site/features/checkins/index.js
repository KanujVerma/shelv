import {reportCommand,publicView,publicError,nextDateCommand,noteCommand,replyCommand,displayDay} from './model.js';
import {createCheckinDraftState} from './draft-state.js';

/** Buildless feature boundary. The host supplies verified transport and authoritative capabilities. */
export function mountCheckinsPanel(element,options){
 const {clientId,mode,request,uploadPhoto,readOnly=false,planContext=null}=options;
 const canWrite=!readOnly&&(options.canWrite??false);
 if(!element||!['client','advisor'].includes(mode)||typeof request!=='function')throw Error('Invalid check-in integration');
 const ownedDraft=!options.draftState,draftState=options.draftState||createCheckinDraftState();
 if(draftState.closed)throw Error('Check-in draft scope has ended');
 const doc=element.ownerDocument,controller=new AbortController(),timers=new Set(),images=new Set(),photos=draftState.photos,notesDraft=draftState.advisorNotes,replyDraft=draftState.advisorReplies;
 let disposed=false,busy=false,view=null,meetingNotes=[],generation=0;
 const draft=draftState.draft;
 const authoredQuestions=planContext?.questions&&typeof planContext.questions==='object'?planContext.questions:{};
 const question=(name,fallback)=>typeof authoredQuestions[name]==='string'&&authoredQuestions[name].trim()?authoredQuestions[name].trim():fallback;
 const startedProducts=Array.isArray(planContext?.startedProducts)?planContext.startedProducts.filter(product=>typeof product?.name==='string'&&product.name.trim()):[];
 const pendingProducts=Array.isArray(planContext?.pendingProducts)?planContext.pendingProducts.filter(product=>typeof product?.name==='string'&&product.name.trim()):[];
 if(!doc.querySelector('link[data-shelv-checkins]')){const link=doc.createElement('link');link.rel='stylesheet';link.href=new URL('./checkins.css',import.meta.url).href;link.dataset.shelvCheckins='';doc.head.append(link);}
 const node=(tag,text,className)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
 const append=(parent,...children)=>{parent.append(...children);return parent;};
 const root=node('section',undefined,'shelv-checkins');root.setAttribute('aria-label','Pre-meeting check-ins');element.replaceChildren(root);
 const uid=()=>globalThis.crypto.randomUUID();
 const status=node('p','','checkin-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const content=node('div'),retryBox=node('div','','checkin-retry');
 const feedback=(text,error=false)=>{status.setAttribute('role',error?'alert':'status');status.textContent=text;};
 function button(label,fn,write=false,primary=false){const b=node('button',label,primary?'checkin-button primary':'checkin-button');b.type='button';if(write)b.dataset.write='true';b.addEventListener('click',fn);return b;}
 const reload=button('Reload latest',()=>load('',true));
 append(root,append(node('header',undefined,'checkin-header'),append(node('div'),node('h2','Check-ins')),reload),status,retryBox,content);
 if(request.syntheticPreview===true&&options.showSampleDisclosure!==false)root.insertBefore(node('p','Synthetic preview · sample check-ins and dates.','checkin-muted'),status);
 function controls(){root.setAttribute('aria-busy',String(busy));root.querySelectorAll('button,input,textarea').forEach(control=>{
  control.disabled=busy||(control.dataset.write==='true'&&(!canWrite||draftState.writeLocked||draftState.pending!==null))||(control.dataset.discard==='true'&&(!draftState.hasUnsent()||draftState.pending!==null));});}
 function clearImages(){for(const image of images){image.removeAttribute('src');image.remove();}images.clear();for(const timer of timers)clearTimeout(timer);timers.clear();}
 function renderRetry(){retryBox.replaceChildren();if(!draftState.pending)return;retryBox.append(button(draftState.pending.kind==='photo'?'Retry same upload':'Retry same submission',()=>perform(draftState.pending),false,true));}
 function field(label,value,{required=false,max=1000,type='textarea',help=''}={}){
  const wrap=node('label',undefined,'checkin-field'),caption=node('span',label),input=doc.createElement(type==='textarea'?'textarea':'input');
  input.setAttribute('aria-label',label);if(type!=='textarea')input.type=type;input.value=value??'';input.required=required;input.dataset.write='true';
  if(type==='textarea'){input.rows=3;input.maxLength=max*2;}
  const helpNode=node('small',help,'checkin-muted');helpNode.id='checkin-help-'+uid();input.setAttribute('aria-describedby',helpNode.id);
  append(wrap,caption,input,helpNode);return {wrap,input};
 }
 async function load(success='',unlock=false){
  if(disposed||draftState.closed||busy)return;const current=++generation;busy=true;controls();feedback('Loading check-in history…');
  try{const data=await request(mode==='advisor'?{action:'advisor_read',clientId}:{action:'client_read'},{signal:controller.signal});if(disposed||draftState.closed||current!==generation)return;
   view=publicView(mode==='advisor'?data.client:data);meetingNotes=[];
   if(mode==='advisor'){if(!Array.isArray(data.meetingNotes))throw Error('invalid_response');meetingNotes=data.meetingNotes.map(n=>{
    if(typeof n.note!=='string'||Array.from(n.note).length>4000||typeof n.checkinId!=='string')throw Error('invalid_response');
    return {id:n.id,checkinId:n.checkinId,note:n.note,createdAt:n.createdAt};});}
   if(unlock)draftState.writeLocked=false;render();feedback(success||(draftState.pending?publicError({status:503}):''),!success&&Boolean(draftState.pending));
  }catch(error){if(!disposed)feedback(success?success+' Reload latest before making another update.':draftState.writeLocked&&!draftState.pending?'Check-in history could not load. Reload latest before making another update.':publicError(error,!view&&!draftState.pending?'Check-in history could not load. Reload latest to try again.':undefined),true);}finally{if(!disposed){busy=false;controls();}}
 }
 async function perform(intent){
  if(disposed||draftState.closed||busy||!canWrite||draftState.writeLocked)return;draftState.pending=intent;busy=true;renderRetry();controls();feedback(intent.kind==='photo'?'Uploading private photo…':'Saving…');
  try{
   let result;
   if(intent.kind==='photo'){
    if(uploadPhoto)result=await uploadPhoto(intent.upload,{signal:controller.signal});
    else{const form=new FormData();const {file,...metadata}=intent.upload;form.set('metadata',JSON.stringify({action:'upload_photo',...metadata}));form.set('file',file);result=await request(form,{signal:controller.signal});}
    if(disposed||draftState.closed)return;
    if(!Number.isSafeInteger(result?.revision)||result.revision<intent.upload.expectedRevision||result?.photo?.angle!==intent.upload.angle||typeof result.photo.id!=='string')throw Error('invalid_response');
    reportCommand({comfort:'valid',consistency:'valid',changes:''},[result.photo],0,uid());
    const state=photos.get(intent.upload.angle);state.status='uploaded';state.photo={id:result.photo.id,angle:result.photo.angle};state.file=null;
    // Exact replay can return a receipt older than an advisor write or another upload.
    // Preserve the completed photo; a fresh read must succeed before any new write intent.
    view.revision=Math.max(view.revision,result.revision);draftState.pending=null;draftState.writeLocked=true;render();renderRetry();
    busy=false;await load(intent.upload.angle[0].toUpperCase()+intent.upload.angle.slice(1)+' photo attached privately.',true);
   }else{
    result=await request(intent.command,{signal:controller.signal});if(disposed||draftState.closed)return;
    if(result?.operation!==intent.command.action||!Number.isSafeInteger(result.revision)||result.revision<=intent.command.expectedRevision||intent.command.action==='send_advisor_reply'&&result.reportId!==intent.command.checkinId)throw Error('invalid_response');
    view.revision=Math.max(view.revision,result.revision);draftState.pending=null;draftState.writeLocked=true;
    if(intent.command.action==='submit_report')draftState.reset();
    if(intent.command.action==='add_meeting_note')notesDraft.delete(intent.command.checkinId);
    if(intent.command.action==='send_advisor_reply')replyDraft.delete(intent.command.checkinId);
    render();busy=false;await load(intent.command.action==='send_advisor_reply'?'Reply added to this check-in.':intent.command.action==='add_meeting_note'?'Private meeting note saved.':intent.command.action==='set_next_checkin'?'Next check-in date saved.':'Your report is ready for your advisor.',true);
   }
  }catch(error){if(disposed||draftState.closed)return;
   if(intent.kind==='photo'){const state=photos.get(intent.upload.angle);if(state)state.status='failed';}
   feedback(publicError(error),true);
   if([400,401,403,409,413,415].includes(error?.status)){
    draftState.pending=null;
    // A confirmed refusal ends this intent. A later explicit attempt uses new IDs and the reloaded revision.
    if(intent.kind==='photo'){const state=photos.get(intent.upload.angle);if(state){state.requestId=uid();state.completionRequestId=uid();state.status='selected';}}
    if([401,403,409].includes(error.status))draftState.writeLocked=true;
   }
  }finally{if(!disposed){busy=false;renderRetry();controls();}}
 }
 async function showPhoto(photo,parent){
  if(readOnly||disposed||busy)return;busy=true;controls();feedback('Opening private photo…');
  try{const result=await request(mode==='advisor'?{action:'advisor_photo_view',clientId,photoId:photo.id}:{action:'photo_view',photoId:photo.id},{signal:controller.signal});if(disposed||draftState.closed)return;
   const url=new URL(result.signedUrl),synthetic=request.syntheticPreview===true&&result.synthetic===true&&/^data:image\/png;base64,/.test(result.signedUrl);
   if(result.photoId!==photo.id||(!synthetic&&url.protocol!=='https:')||!Number.isSafeInteger(result.expiresIn)||result.expiresIn<1||result.expiresIn>60)throw Error('invalid_response');
   parent.querySelector('.checkin-photo-view')?.remove();const holder=node('div',undefined,'checkin-photo-view'),image=node('img',undefined,'checkin-private-image');
   image.alt='Submitted '+photo.angle+' photo';image.referrerPolicy='no-referrer';image.src=url.href;images.add(image);
   image.addEventListener('error',()=>{image.removeAttribute('src');image.remove();images.delete(image);holder.append(node('p','The photo could not load. Open it again to try a fresh view.','checkin-muted'));});
   append(holder,image,button('Hide photo',()=>{image.removeAttribute('src');images.delete(image);holder.remove();}));parent.append(holder);
   const timer=setTimeout(()=>{image.removeAttribute('src');images.delete(image);holder.replaceChildren(node('p','This photo view has expired. Open the photo again for a fresh view.','checkin-muted'));timers.delete(timer);},result.expiresIn*1000);timers.add(timer);feedback('');
  }catch(error){if(!disposed)feedback(publicError(error),true);}finally{if(!disposed){busy=false;controls();}}
 }
 function uploadFields(){
  const group=node('fieldset',undefined,'checkin-photos');append(group,node('legend','Photos (optional)'),node('p','Use soft, even light, a neutral expression and no filters. Include only your face; skip any angle you prefer. JPEG, PNG or WebP, up to 5 MiB each.','checkin-muted'));
  const grid=node('div',undefined,'checkin-photo-grid');
  for(const angle of ['front','left','right']){
   const title=angle[0].toUpperCase()+angle.slice(1),card=node('div',undefined,'checkin-photo-card'),label=node('label',title+' photo (optional)'),file=node('input');
   file.type='file';file.accept='image/jpeg,image/png,image/webp';file.dataset.write='true';label.append(file);
   file.addEventListener('change',()=>{const selected=file.files?.[0];if(!selected)return;
    if(!['image/jpeg','image/png','image/webp'].includes(selected.type)||selected.size<1||selected.size>5*1024*1024){file.value='';feedback('Choose a JPEG, PNG or WebP photo no larger than 5 MiB.',true);return;}
    photos.set(angle,{file:selected,requestId:uid(),completionRequestId:uid(),status:'selected'});render();controls();});
   card.append(label);const state=photos.get(angle);
   if(state){card.append(node('small',state.status==='uploaded'?title+' photo attached privately.':state.status==='failed'?'Upload was not confirmed. Retry the same upload.':'Photo selected.','checkin-muted'));
    if(state.status!=='uploaded')card.append(button('Upload '+angle+' photo',()=>perform({kind:'photo',upload:Object.freeze({file:state.file,angle,
     requestId:state.requestId,completionRequestId:state.completionRequestId,expectedRevision:view.revision})}),true));
    card.append(button('Remove '+angle+' photo from report',()=>{photos.delete(angle);render();controls();},true));
   }grid.append(card);
  }group.append(grid);return group;
 }
 function reportForm(){
  const form=node('form',undefined,'checkin-card checkin-form');append(form,node('h3','Before your check-in'));
  const startedName=startedProducts[0]?.name.trim(),pendingName=pendingProducts[0]?.name.trim();
  const comfortPrompt=startedName?'How has '+startedName+' felt when you apply it and afterward?':pendingName?'How is your current routine feeling? If you haven’t started '+pendingName+', is anything holding up the proposed change?':'How has your skin felt with the products you are currently using?';
  const consistencyPrompt=startedName?'How have you been using '+startedName+'? Mention any steps that have been difficult to keep up with.':pendingName?'If you’ve started '+pendingName+', how have you been using it? If not, which parts of your current routine have you been following?':'Which parts of the routine have you been able to follow? Mention anything you have not started yet.';
  for(const [name,label,help] of [['comfort','Comfort',question('comfort',comfortPrompt)],['consistency','Consistency',question('consistency',consistencyPrompt)],['changes','Changes',question('changes','What would you like to discuss at your check-in? (Optional)')]]){
   const f=field(label,draft[name],{required:name!=='changes',help:help+' Up to 1,000 characters.'});f.input.addEventListener('input',()=>{draft[name]=f.input.value;f.input.setCustomValidity(Array.from(f.input.value).length>1000?'Use 1,000 characters or fewer.':'');controls();});form.append(f.wrap);
  }
  form.append(uploadFields());const submit=button('Submit before meeting',()=>{},true,true);submit.type='submit';form.append(submit);
  const discard=button('Discard unsent check-in',()=>{if(busy||draftState.pending!==null||!draftState.hasUnsent())return;if(!globalThis.confirm('Discard these unsent answers and photo selections?'))return;draftState.reset();render();feedback('');});discard.dataset.discard='true';form.append(discard);
  form.addEventListener('submit',event=>{event.preventDefault();if(draftState.pending||busy)return;if([...photos.values()].some(photo=>photo.status!=='uploaded')){feedback('Upload the selected photos, or remove them from this report before submitting.',true);return;}
   try{perform({kind:'write',command:reportCommand(draft,[...photos.values()].map(photo=>photo.photo),view.revision,uid())});}catch{feedback('Add short comfort and consistency answers, with no more than 1,000 characters each.',true);}
  });return form;
 }
 function schedule(){
  const card=node('section',undefined,'checkin-card checkin-schedule');append(card,node('span','NEXT CHECK-IN','checkin-eyebrow'),node('h3',view.nextCheckinOn?displayDay(view.nextCheckinOn):'No check-in date yet'),node('p',mode==='advisor'?'Saving a date does not book a meeting.':'Arrange your meeting with your advisor by text or email. Saving a date here does not book the meeting.','checkin-muted'));
  if(mode==='advisor'&&canWrite){const form=node('form'),f=field('Next check-in date',view.nextCheckinOn,{type:'date'});const save=button('Save next date',()=>{},true);save.type='submit';append(form,f.wrap,save);
   form.addEventListener('submit',event=>{event.preventDefault();try{perform({kind:'write',command:nextDateCommand(clientId,f.input.value||null,view.revision,uid())});}catch{feedback('Choose a valid next check-in date.',true);}});card.append(form);
  }return card;
 }
 function history(){
  const section=node('section',undefined,'checkin-history');section.setAttribute('aria-label','Check-in history');append(section,node('h3','Check-in history'));
  if(!view.reports.length)section.append(node('p','No submitted check-ins yet.','checkin-empty'));
  for(const report of [...view.reports].reverse()){
   const card=node('article',undefined,'checkin-card');append(card,node('span',mode==='client'?'YOUR SUBMITTED CHECK-IN':'CLIENT REPORT','checkin-eyebrow'),node('h4',displayDay(report.submittedAt)));
   const list=node('dl');for(const [label,value] of [['Comfort',report.comfort],['Consistency',report.consistency],['Changes',report.changes||'No changes added.']])append(list,node('dt',label),node('dd',value));card.append(list);
   if(!readOnly&&report.photos.length){const row=node('div',undefined,'checkin-photo-actions');for(const photo of report.photos)row.append(button('View private '+photo.angle+' photo',()=>showPhoto(photo,card)));card.append(row);}
   const publicReplies=node('section',undefined,'checkin-advisor-replies');publicReplies.append(node('h4','Advisor replies'));
   for(const reply of report.advisorReplies||[])append(publicReplies,append(node('article',undefined,'checkin-reply'),node('small','Your advisor · '+displayDay(reply.createdAt),'checkin-muted'),node('p',reply.reply,'checkin-reply-body')));
   if(!report.advisorReplies?.length)publicReplies.append(node('p','No advisor reply yet.','checkin-muted'));
   if(mode==='advisor'&&canWrite){
    const form=node('form'),f=field('Reply to client',replyDraft.get(report.id)||'',{max:4000,required:true,help:'Visible to the client. Up to 4,000 characters.'});
    f.input.addEventListener('input',()=>{replyDraft.set(report.id,f.input.value);f.input.setCustomValidity(Array.from(f.input.value).length>4000?'Use 4,000 characters or fewer.':'');});const send=button('Send reply',()=>{},true,true);send.type='submit';append(form,f.wrap,send);
    form.addEventListener('submit',event=>{event.preventDefault();try{perform({kind:'write',command:replyCommand(clientId,report.id,f.input.value,view.revision,uid())});}catch{feedback('Add a reply with no more than 4,000 characters.',true);}});publicReplies.append(form);
   }card.append(publicReplies);
   if(mode==='advisor'){
    const privateSection=node('section',undefined,'checkin-advisor-note');append(privateSection,node('h4','Private advisor meeting notes'));
    const notes=meetingNotes.filter(note=>note.checkinId===report.id);for(const note of notes)append(privateSection,node('small',displayDay(note.createdAt),'checkin-muted'),node('p',note.note));
    if(!notes.length)privateSection.append(node('p','No meeting notes yet.','checkin-muted'));
    if(canWrite){const form=node('form'),f=field('Private meeting note',notesDraft.get(report.id)||'',{max:4000,required:true,help:'Up to 4,000 characters.'});f.input.addEventListener('input',()=>notesDraft.set(report.id,f.input.value));const save=button('Save private note',()=>{},true);save.type='submit';append(form,f.wrap,save);
     form.addEventListener('submit',event=>{event.preventDefault();try{perform({kind:'write',command:noteCommand(clientId,report.id,f.input.value,view.revision,uid())});}catch{feedback('Add a private note with no more than 4,000 characters.',true);}});privateSection.append(form);
    }card.append(privateSection);
   }section.append(card);
  }return section;
 }
 function render(){clearImages();content.replaceChildren();if(!view)return;
  const top=node('div',undefined,'checkin-overview');top.append(schedule());
  if(mode==='client'&&canWrite)top.append(reportForm());else if(mode==='client')top.append(append(node('section',undefined,'checkin-card'),node('h3','Your check-in history'),node('p','You can read your existing reports. New check-ins are unavailable for this account.','checkin-muted')));
  else top.classList.add('checkin-overview-advisor');
  append(content,top,history());renderRetry();controls();
 }
 load('',true);return ()=>{disposed=true;generation++;controller.abort();clearImages();if(ownedDraft)draftState.dispose();root.remove();};
}
