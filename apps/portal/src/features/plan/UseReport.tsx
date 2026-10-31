import {useEffect,useRef,useState} from 'react';
import type {CareCommand,CareWriteResult,ClientPlanViewV2,EventReceipt,ProductRef,ReportedProductRef,ReportedProductBody} from '../../../../../src/contracts/PortalCare.ts';
import type {PlanProduct} from '../../../../../src/contracts/PortalRebuild.ts';
import {mapCareResult} from '../../../../../src/contracts/PortalCareMapping.ts';
import {readCareCommand} from '../../../../../src/contracts/PortalCareValidation.ts';
import {Button,Field,Input,Textarea,Select,Icon,StatusNotice} from '../../ui/index.ts';
import {Panel} from '../../shell/PortalShell.tsx';
import type {ClientPlanProps,ClientCareCommand} from './types.ts';
import {ProductPhoto} from './content.tsx';
import {captureUse,chicagoToday,isStopping,knownText,needsReportedDescriptor,canIncludeUseNotes,captureHasUnsentNotes} from './useModel.ts';
import type {CapturedUse,UseForm} from './useModel.ts';
import {readCurrentPlan} from './care.ts';
type Write=Extract<ClientCareCommand,{requestId:string;expectedUseRevision:number}>;
type Phase='editing'|'saving'|'uncertain'|'conflict'|'saved'|'notes_unsent';
interface Flow {capture:CapturedUse;steps:('identity'|'create'|'reported_identity'|'use')[];index:number;subject:ProductRef|null;identityId:string|null;receipts:EventReceipt[];pending:Write|null;phase:Phase;review?:{view:ClientPlanViewV2;token:object;epoch:number};}
interface Intent {form:UseForm;flow:Flow|null}
const receiptOf=(result:CareWriteResult)=>'receipt'in result?result.receipt:result;
const initialForm=(product:PlanProduct|null,reported:ReportedProductRef|null):UseForm=>({match:null,action:product||reported?'paused':'unreviewed_added',when:'today',date:'',acquisition:'unknown',details:'',frequency:'',amount:'',name:'',brand:'',variant:'',strength:'',sizeLabel:'',differentProduct:false});
export function UseReport({props,product,reported,descriptor:reportedDescriptor,back,backLabel,proposed}:{props:ClientPlanProps;product:PlanProduct|null;reported:ReportedProductRef|null;descriptor:ReportedProductBody|null;back:()=>void;backLabel:string;proposed:boolean}){
 const v=props.view,original:ProductRef|null=product&&v.plan?{kind:'plan_product',publication:{version:v.plan.version,documentSchemaVersion:v.plan.documentSchemaVersion},productId:product.id,slotId:null}:reported;
 const key=`care-use:${props.session.key}:${product?.id??reported?.reportedProductId??'new'}`;
 const canWrite=props.mode==='client'&&v.schemaVersion===2&&v.access==='active'&&!!props.ports?.care&&!!props.onViewChange;
 const [intent,setIntent]=useState<Intent>(()=>{const prior=props.mode==='client'?props.session.memory.get<Intent>(key):undefined;return prior?{...prior,flow:prior.flow?{...prior.flow,phase:prior.flow.phase==='saving'?'uncertain':prior.flow.phase==='saved'&&captureHasUnsentNotes(prior.flow.capture)?'notes_unsent':prior.flow.phase}:null}:{form:{...initialForm(product,reported),...(proposed?{action:'started_today' as const}:{})},flow:null};});
 const [notice,setNotice]=useState(''),[loading,setLoading]=useState(false);
 const dateInput=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(notice.startsWith('enter a real date'))dateInput.current?.focus();},[notice]);
 const alive=useRef(true),owner=useRef<object|null>(null),context=useRef({view:v,mode:props.mode,session:props.session,epoch:0,token:{}});
 if(context.current.view!==v||context.current.mode!==props.mode||context.current.session!==props.session){context.current={...context.current,view:v,mode:props.mode,session:props.session,epoch:context.current.epoch+1};owner.current=null;}
 const epoch=context.current.epoch,current=()=>alive.current&&props.session.isCurrent()&&context.current.epoch===epoch&&props.mode==='client';
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;owner.current=null;};},[]);
 useEffect(()=>{setLoading(false);setIntent(i=>i.flow?.phase==='saving'?{...i,flow:{...i.flow,phase:'uncertain'}}:i);},[v,props.mode,props.session]);
 const save=(next:Intent)=>{if(current()){props.session.memory.set(key,next);setIntent(next);}};
 const flow=intent.flow,locked=loading||!!flow&&flow.phase!=='editing'&&flow.phase!=='saved';
 const inputLocked=locked||!!flow&&flow.phase==='editing'&&flow.receipts.length>0;
 const notesSupported=canIncludeUseNotes(intent.form,original),capturedUnsent=!!flow&&captureHasUnsentNotes(flow.capture);
 const unsentNotes=capturedUnsent?flow!.capture.form.details:!notesSupported?intent.form.details:'';
 const notesBlocked=!!unsentNotes.trim(),canRemoveNotes=!loading&&!flow?.pending&&(!flow||['editing','saved','notes_unsent'].includes(flow.phase));
 const edit=(patch:Partial<UseForm>)=>{if(inputLocked||owner.current||!current())return;const form={...intent.form,...patch};save({form,flow:null});setNotice('');};
 function removeUnsentNotes(){
  if(!canRemoveNotes||owner.current||!current())return;
  const capture=flow?{...flow.capture,form:{...flow.capture.form,details:''},change:flow.capture.change.kind==='unreviewed_added'&&flow.capture.descriptor?{...flow.capture.change,details:null}:flow.capture.change}:null;
  save({form:{...intent.form,details:''},flow:flow&&capture?{...flow,capture,phase:flow.phase==='notes_unsent'?'saved':flow.phase}:null});setNotice('');
 }
 function makeCommand(f:Flow,head:number):Write{
  const c=f.capture,common={schemaVersion:1 as const,requestId:crypto.randomUUID(),expectedUseRevision:head},occurrence={occurredOn:c.occurredOn,channel:'portal' as const,sourcePublication:c.sourcePublication};
  const step=f.steps[f.index];let command:CareCommand;
  if(step==='create')command={...common,...occurrence,action:'report_unreviewed_product_v1',product:c.descriptor!,acquisition:c.form.acquisition};
  else if(step==='identity'||step==='reported_identity')command={...common,...occurrence,action:'report_identity_v1',target:{subject:step==='identity'?c.original!:f.subject!,comparedWith:step==='reported_identity'&&c.original?.kind==='plan_product'?c.original:null},answer:{match:c.form.match!,reportedName:c.descriptor?.name??null,variant:knownText(c.form.variant),strength:knownText(c.form.strength),labelPhotoIds:[]}};
  else command={...common,...occurrence,action:'report_product_use_v1',product:f.subject!,change:c.change,acquisition:c.form.acquisition,identityEventId:f.identityId};
  return readCareCommand(command) as Write;
 }
 async function run(next:Flow,statusOnly=false){
  if(!canWrite||owner.current||!current()||v.schemaVersion!==2)return;
  const operation={},owns=()=>current()&&owner.current===operation;owner.current=operation;setLoading(true);setNotice('');
  let f={...next},latest=v,awaitingWrite=false;
  const persist=()=>save({form:intent.form,flow:f});
  try{
   while(f.index<f.steps.length){
    if(!owns())return;
    const command=f.pending??makeCommand(f,latest.use.revision);f={...f,pending:command,phase:'saving'};persist();
    let result:CareWriteResult;
    if(statusOnly){const query={schemaVersion:1,action:'request_status_v1',requestId:command.requestId} as const;const status=mapCareResult(await props.ports!.care!.execute(query),query);if(!owns())return;if(!('status'in status)||status.status!=='committed'){f={...f,phase:'uncertain'};setNotice('no committed receipt was found. the original report is still uncertain; retry the same report.');persist();return;}result=mapCareResult(status.receipt,command) as CareWriteResult;}
    else {awaitingWrite=true;result=mapCareResult(await props.ports!.care!.execute(command),command) as CareWriteResult;awaitingWrite=false;}
    if(!owns())return;
    const receipt=receiptOf(result),reread=await readCurrentPlan(props);
    if(!owns())return;
    if(reread.schemaVersion!==2||reread.use.revision<receipt.revision)throw new Error('current report not confirmed');
    latest=reread;
    const subject='product'in result?result.product:f.subject;
    f={...f,subject,identityId:command.action==='report_identity_v1'?receipt.event.id:command.action==='report_unreviewed_product_v1'?null:f.identityId,receipts:[...f.receipts,receipt],pending:null,index:f.index+1};
    if(latest.access!=='active'||latest.plan?.version!==f.capture.sourcePublication.version){f={...f,phase:'conflict'};persist();props.onViewChange?.(latest);return;}
    f={...f,phase:f.index===f.steps.length?captureHasUnsentNotes(f.capture)?'notes_unsent':'saved':'saving'};persist();statusOnly=false;
   }
   f={...f,phase:captureHasUnsentNotes(f.capture)?'notes_unsent':'saved'};persist();props.onViewChange?.(latest);
  }catch(error){if(!owns())return;const status=(error as {status?:number}).status;f={...f,phase:awaitingWrite&&status===409?'conflict':'uncertain'};persist();setNotice(status===403?'this request is unavailable. your original report is retained.':awaitingWrite&&status===409?'the current plan or use record changed. review it before continuing.':status===409?'report status is unavailable. your original report is still uncertain.':'the result could not be confirmed. keep this report and retry the same report.');}
  finally{if(owner.current===operation){owner.current=null;if(current())setLoading(false);}}
 }
 async function review(){
  if(!canWrite||!flow||owner.current||!current())return;
  const operation={},owns=()=>current()&&owner.current===operation;owner.current=operation;setLoading(true);setNotice('');
  try{const next=await readCurrentPlan(props);if(!owns()||next.schemaVersion!==2)return;
   const b=flow.review,ack=next.access==='active'&&!!b&&b.token===context.current.token&&b.epoch===epoch&&b.view===v&&next.plan?.version===v.plan?.version&&next.use.revision===(v.schemaVersion===2?v.use.revision:-1)&&next.decisionRevision===v.decisionRevision;
   save({...intent,flow:{...flow,pending:ack?null:flow.pending,phase:ack?'editing':'conflict',review:{view:next,token:context.current.token,epoch:epoch+Number(next!==v)}}});props.onViewChange?.(next);
  }catch{if(owns())setNotice('latest plan unavailable. your report is retained.');}finally{if(owner.current===operation){owner.current=null;if(current())setLoading(false);}}
 }
 function submit(){
  if(!canWrite||locked||v.schemaVersion!==2||!v.plan)return;
  if(notesBlocked){setNotice('these notes are still unsent. choose a different action or remove them before continuing.');return;}
  try{if(flow?.phase==='editing'){void run(flow);return;}
   const capture=captureUse(intent.form,original,{version:v.plan.version,documentSchemaVersion:v.plan.documentSchemaVersion},chicagoToday());
   const steps:Flow['steps']=[];if(original&&capture.form.match)steps.push('identity');if(capture.descriptor)steps.push('create');if(capture.descriptor&&original&&capture.form.match)steps.push('reported_identity');if(capture.change.kind!=='unreviewed_added'||!capture.descriptor)steps.push('use');
   void run({capture,steps,index:0,subject:original,identityId:null,receipts:[],pending:null,phase:'editing'});
  }catch(e){setNotice((e as Error).message);}
 }
 if(!canWrite)return <StatusNotice title={v.access==='read_only'?'read-only plan':'use reporting unavailable'}>this view cannot record care changes.</StatusNotice>;
 const b=flow?.review,reviewable=!!b&&b.token===context.current.token&&b.epoch===epoch&&b.view===v;
 const descriptor=flow&&flow.phase!=='saved'?flow.capture.descriptor!==null:needsReportedDescriptor(intent.form,original);
 return <div className="plan-columns plan-use-columns"><Panel className="plan-use-form"><form noValidate className="plan-stack" onSubmit={e=>{e.preventDefault();submit();}}>
  {product?<div className="plan-use-identity"><ProductPhoto product={product}/><div><h2>{product.name}</h2><p className="plan-meta">{[product.variant&&!product.name.includes(product.variant)?product.variant:null,product.sizeLabel,product.strength.state==='known'?product.strength.value:null].filter(Boolean).join(' · ')}</p></div></div>:reported?<div><h2>{reportedDescriptor?.name??'reported product'}</h2><p className="plan-meta">{[reportedDescriptor?.brand,reportedDescriptor?.variant,reportedDescriptor?.strength,reportedDescriptor?.sizeLabel].map(k=>k?.state==='known'?k.value:null).filter(Boolean).join(' · ')}</p><p>unreviewed client-reported product</p></div>:<h2>report another product</h2>}
  {original?<fieldset disabled={inputLocked} className="plan-use-match"><legend>is this your product?</legend><div>{(['yes','no','not_sure'] as const).map(match=><Button key={match} variant="secondary" aria-pressed={intent.form.match===match} onClick={()=>edit({match})}>{match==='yes'?<Icon name="check"/>:match==='no'?<Icon name="close"/>:null}{match.replace('_',' ')}</Button>)}</div></fieldset>:null}
  <Field label="what changed?"><Select disabled={inputLocked} value={intent.form.action} onValueChange={action=>edit({action:action as UseForm['action'],when:action==='started_earlier'?'earlier':intent.form.when})} options={[{value:'started_today',label:'started today'},{value:'started_earlier',label:'started earlier'},{value:'paused',label:'paused'},{value:'stopped',label:'stopped'},{value:'different',label:'using differently'},{value:'unreviewed_added',label:'added an unreviewed product'}]}/></Field>
  <div className="plan-use-fields"><Field label="when did this happen?"><Select disabled={inputLocked||intent.form.action==='started_today'} value={intent.form.action==='started_today'?'today':intent.form.when} onValueChange={when=>edit({when:when as UseForm['when']})} options={[{value:'today',label:'today'},{value:'earlier',label:'earlier'},{value:'unknown',label:'date not known'}]}/></Field>
  {!isStopping(intent.form)?<Field label="how did you get it?"><Select disabled={inputLocked} value={intent.form.acquisition} onValueChange={acquisition=>edit({acquisition:acquisition as UseForm['acquisition']})} options={[{value:'unknown',label:'not recorded'},{value:'shelv',label:'through shelv'},{value:'self',label:'i bought it myself'},{value:'already_owned',label:'i already owned it'}]}/></Field>:null}</div>
  {intent.form.when==='earlier'&&intent.form.action!=='started_today'?<Field label="actual date" error={notice.startsWith('enter a real date')?notice:undefined}><Input ref={dateInput} disabled={inputLocked} type="date" min="1900-01-01" max={chicagoToday()} value={intent.form.date} onChange={e=>edit({date:e.target.value})}/></Field>:null}
  {original?<Button variant="ghost" disabled={inputLocked} aria-pressed={intent.form.differentProduct} onClick={()=>edit({differentProduct:!intent.form.differentProduct})}>report a different product</Button>:null}
  {descriptor?<div className="plan-stack"><h3>the product you used</h3>{(['name','brand','variant','strength','sizeLabel'] as const).map(field=><Field key={field} label={field==='sizeLabel'?'size (if known)':field==='name'?'product name':`${field} (if known)`}><Input disabled={inputLocked} maxLength={200} value={intent.form[field]} onChange={e=>edit({[field]:e.target.value})}/></Field>)}<p className="plan-meta">this product stays unreviewed. it does not replace an advised product.</p></div>:null}
  {intent.form.action==='different'?<div className="plan-use-fields"><Field label="frequency (if known)"><Input disabled={inputLocked} maxLength={4000} value={intent.form.frequency} onChange={e=>edit({frequency:e.target.value})}/></Field><Field label="amount (if known)"><Input disabled={inputLocked} maxLength={4000} value={intent.form.amount} onChange={e=>edit({amount:e.target.value})}/></Field></div>:null}
  {notesSupported&&!capturedUnsent?<Field label={intent.form.action==='different'?'how are you using it differently?':'anything we should know? (optional)'}><Textarea disabled={inputLocked} maxLength={4000} value={intent.form.details} onChange={e=>edit({details:e.target.value})}/></Field>:null}
  {notesBlocked?<><Field label="unsent notes"><Textarea readOnly value={unsentNotes}/></Field><StatusNotice tone="warning" title={flow?.phase==='notes_unsent'?'notes not recorded':'notes are still unsent'} action={<Button variant="ghost" disabled={!canRemoveNotes} onClick={removeUnsentNotes}>remove unsent notes</Button>}>{flow?.phase==='notes_unsent'?'the supported part of your report is recorded. these notes were not sent.':'this action cannot include these notes. they are kept here and have not been sent.'}{flow?.pending?<p>confirm the original report before changing the retained notes.</p>:flow?.phase==='notes_unsent'?<p>keep or copy the notes before removing them.</p>:<p>choose a different action or remove the unsent notes before continuing.</p>}</StatusNotice></>:null}
  {notice?<StatusNotice tone="warning" title="report needs attention">{notice}</StatusNotice>:null}
  {flow?.receipts.length&&flow.phase!=='saved'&&flow.phase!=='notes_unsent'?<StatusNotice title="part of your report is recorded">{flow.receipts.some(r=>r.event.kind==='identity')?'product identity is recorded. ':''}{flow.receipts.some(r=>r.event.kind==='reported_product')?'the unreviewed product is recorded. ':''}the remaining use report is not confirmed.</StatusNotice>:null}
  {flow?.phase==='uncertain'?<StatusNotice tone="uncertain" title="report result uncertain" action={<div className="plan-stack"><Button variant="secondary" disabled={loading} onClick={()=>void run(flow,true)}>check report status</Button><Button variant="secondary" disabled={loading} onClick={()=>void run(flow)}>retry same report</Button></div>}>your original answers and request are retained.</StatusNotice>:flow?.phase==='conflict'?<StatusNotice tone="warning" title="plan or use changed" action={<Button variant="secondary" disabled={loading} onClick={()=>void review()}>{reviewable?'i’ve reviewed this plan':'review latest plan'}</Button>}>your attempted report is retained. review current guidance and use before continuing.</StatusNotice>:flow?.phase==='notes_unsent'?null:flow?.phase==='saved'?<StatusNotice tone="success" title="use report recorded">your report is recorded separately from published advice.</StatusNotice>:<Button type="submit" busy={loading} disabled={locked||notesBlocked}>{flow?.phase==='editing'?'continue reviewed report':intent.form.action.startsWith('started_')?'record start':'record change'}</Button>}
 </form></Panel><aside><Panel className="plan-use-context"><h2>your experience stays visible</h2><p>start, pause, stop or report a different frequency. we keep the date and who reported it, and notify your advisor when review is needed.</p><p className="plan-muted">you do not need approval to report that you stopped using a product.</p><Button variant="secondary" onClick={back}>{backLabel}</Button></Panel></aside></div>;
}
