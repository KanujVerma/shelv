import type {FinalExportRecord,FinalExportUse,FinalExportSink,FinalExportInstruction,FinalExportPlanUnit,AvailableFinalExport} from '../../../src/contracts/PortalFinalExport.ts';
import type {ClientPlanContent,Schedule,Known} from '../../../src/contracts/PortalRebuild.ts';
import type {Product,Guide,Source,Usage,Fact,Comparison,Presentation} from '../../../src/contracts/ConciergePresentation.ts';
import {assertFinalExportRecord,assertFinalExportPlanUnit,assertFinalExportInstructionUnit,detachFinalExportInput,freezeFinalExport,finalExportScopes,sameFinalExportValue} from '../../../src/contracts/PortalFinalExportValidation.ts';
import {requireValue} from '../../../src/contracts/ConciergePortalValidation.ts';
import {mapFinalExportResult} from '../../../src/contracts/PortalFinalExportMapping.ts';

type Lines=string[];
const known=(value:Known<string>):string=>value.state==='known'?value.value:'unknown';
function add(lines:Lines,...values:(string|null|undefined)[]):void{for(const value of values)if(value!==null&&value!==undefined&&value!=='')lines.push(value);}
function sources(lines:Lines,items:readonly Source[]):void{for(const s of items)add(lines,'public source: '+s.label,s.url);}
function guideApplicability(plan:FinalExportRecord['plan'],productId:string|null):string{
 if(productId===null)return 'guide applicability: general guidance for all published routine items';
 const refs:string[]=[];
 if(plan.documentSchemaVersion===3){
  const c=plan.content,index=c.products.findIndex(p=>p.id===productId);
  if(index<0)return 'guide applicability: public product target unavailable';
  refs.push('product listing item '+(index+1));
  for(const [index,s] of c.routine.entries())if(s.productId===productId)refs.push('published routine item '+(index+1));
  for(const [index,d] of c.decisions.entries()){
   const roles=[...(d.currentProductIds.includes(productId)?['current product']:[]),...(d.primaryProductId===productId?['primary product']:[]),...(d.alternativeProductIds.includes(productId)?['optional alternative']:[])];
   if(roles.length)refs.push('published decision item '+(index+1)+' ('+roles.join(', ')+')');
  }
 }else {
  const p=plan.legacyOriginal.presentation;requireValue(p);
  for(const [index,s] of p.baselineRoutine.entries())if(s.productId===productId&&s.product?.id===productId)refs.push('original published routine item '+(index+1));
  for(const [index,c] of p.categoryCards.entries()){
   if(c.currentProduct?.id===productId)refs.push('original published decision item '+(index+1)+' (current product)');
   if(c.proposedProduct?.id===productId)refs.push('original published decision item '+(index+1)+' (proposed product)');
  }
  requireValue(refs.length>0);
 }
 return 'guide applicability: '+refs.join('; ');
}
function guide(lines:Lines,g:Guide,applicability:string):void{add(lines,'',applicability,g.title,g.intro);for(const step of g.steps)add(lines,step.title,step.body);add(lines,g.careNote);sources(lines,g.sources);}
function facts(lines:Lines,items:readonly Fact[]):void{for(const fact of items){add(lines,fact.title,fact.body);sources(lines,fact.sources);}}
function comparisons(lines:Lines,items:readonly Comparison[]):void{for(const c of items){add(lines,c.label,'current: '+c.currentText,'proposed: '+c.proposedText,c.significance,c.guideNote);sources(lines,c.sources);}}
function product(lines:Lines,p:Product):void{
 add(lines,'',p.name||'product name unknown',p.brand,p.variant,p.sizeLabel,p.sourceLabel,p.reference,p.productUrl,p.imageUrl?'recognition image: '+p.imageUrl:null);
 if(p.displayPrice){const price=p.displayPrice;add(lines,`recorded display price: ${price.cents} cents ${price.currency}${price.illustrative?' (illustrative)':''}`,price.checkedOn?'price checked: '+price.checkedOn:'price check date unknown',price.sourceUrl);}
}
function usage(lines:Lines,u:Usage):void{add(lines,'periods: '+u.periods.join(', '),'authored order: '+u.order);add(lines,u.short.morning?'morning: '+u.short.morning:null,u.short.evening?'evening: '+u.short.evening:null);for(const instruction of u.instructions)add(lines,instruction);}
function schedule(lines:Lines,s:Schedule):void{
 add(lines,'periods: '+(s.periods.join(', ')||'not specified'),s.days.kind==='daily'?'days: daily':'selected weekdays (1=monday): '+s.days.weekdays.join(', '),s.condition?'condition: '+s.condition:null,s.asNeeded?'as needed':null);
 for(const stage of s.stages)add(lines,stage.directions,stage.minimumDaysFromActualStart===null?'minimum days from actual Start: unknown':`minimum days from actual Start: ${stage.minimumDaysFromActualStart}`,'proceed only when: '+stage.proceedOnlyWhen);
 if(s.stages.length)add(lines,'stages are anchored to actual Start; advancement is not automatic');
}
function reportedUse(lines:Lines,u:FinalExportUse):void{
 add(lines,'reported use at support end: '+u.state.replaceAll('_',' '),'original Start: '+known(u.originalStart),'latest reported date: '+known(u.occurredOn),u.details,u.frequency?'reported frequency: '+known(u.frequency):null,u.amount?'reported amount: '+known(u.amount):null,u.contradiction?'recorded use reports contain a contradiction':null);
}
function richPlan(lines:Lines,c:ClientPlanContent,record:Pick<FinalExportRecord,'use'>):void{
 const name=(id:string)=>{const index=c.products.findIndex(p=>p.id===id),p=c.products[index];requireValue(p);return [p.name||'product name unknown',p.brand||'brand unknown',p.variant?'variant: '+p.variant:'variant unknown',p.sizeLabel||'size unknown','product listing item '+(index+1)].join(' · ');};
 const contextFact=(id:string)=>{const index=c.context.facts.findIndex(f=>f.id===id);requireValue(index>=0);return 'public context item '+(index+1);};
 const contextLinks=(owner:string,ids:readonly string[])=>{for(const id of ids)add(lines,'public context for this '+owner+': '+contextFact(id));};
 const linkedGuide=(g:Guide)=>{add(lines,g.productId===null?'general guidance':c.products.some(p=>p.id===g.productId)?'guide product: '+name(g.productId):'guide product identity unavailable');guide(lines,g,guideApplicability({documentSchemaVersion:3,content:c},g.productId));};
 add(lines,c.title,c.summary,c.preparation.by?'prepared by: '+c.preparation.by:null,c.preparation.on?'prepared on: '+c.preparation.on:'preparation date unknown');
 add(lines,'','goals');for(const [index,goal] of c.goals.entries()){add(lines,'goal listing item '+(index+1)+': '+goal.text);contextLinks('goal',goal.factIds);}
 add(lines,'','reported context','current products: '+c.context.products.state);
 if(c.context.products.state==='recorded'){
  if(c.context.products.productIds.length===0)add(lines,'recorded current-product list is empty; no claim of no current products');
  for(const id of c.context.products.productIds)add(lines,'recorded current product: '+name(id));
 }else if(c.context.products.state==='none')add(lines,'basis for no current products: '+contextFact(c.context.products.factId));
 for(const s of c.consultationSections)add(lines,s.title,s.body);for(const [index,fact] of c.context.facts.entries())add(lines,'public context item '+(index+1)+': '+fact.kind.replaceAll('_',' ')+': '+fact.text);
 add(lines,'','products');for(const [index,p] of c.products.entries()){add(lines,'product listing item '+(index+1));product(lines,p);add(lines,'strength: '+known(p.strength),'category: '+known(p.category),'identity: '+p.identity.replaceAll('_',' '),'formula: '+p.formula.replaceAll('_',' '));contextLinks('product',p.factIds);const use=record.use.find(u=>u.productId===p.id);if(use)reportedUse(lines,use);for(const g of p.guides)linkedGuide(g);facts(lines,p.evidence);}
 add(lines,'','published routine');for(const step of c.routine){add(lines,'',step.title,step.productId?name(step.productId):null);for(const d of step.directions)add(lines,d);for(const caution of step.cautions)add(lines,'caution: '+caution);schedule(lines,step.schedule);if(step.usage)usage(lines,step.usage);if(step.productId){const use=record.use.find(u=>u.productId===step.productId);if(use)reportedUse(lines,use);}}
 add(lines,'','published decisions (separate from actual use)');for(const d of c.decisions){add(lines,'',d.kind.replaceAll('_',' '),...d.currentProductIds.map(id=>'current: '+name(id)),d.primaryProductId?'primary: '+name(d.primaryProductId):null,...d.alternativeProductIds.map(id=>'optional alternative: '+name(id)));for(const id of d.goalIds){const index=c.goals.findIndex(g=>g.id===id);requireValue(index>=0);add(lines,'related goal: goal listing item '+(index+1));}contextLinks('decision',d.factIds);add(lines,d.reason,...d.directions,...d.cautions.map(t=>'caution: '+t),...d.limitations.map(t=>'limitation: '+t));if(d.schedule)schedule(lines,d.schedule);if(d.usage)usage(lines,d.usage);const g=d.guidance;add(lines,g.title,g.subtitle,g.rationaleTitle);for(const r of g.reasons)add(lines,r.title,r.body);add(lines,...g.actions,g.factsTitle);comparisons(lines,g.comparisons);facts(lines,g.facts);if(g.how)linkedGuide(g.how);sources(lines,g.sources);if(g.decisionLabels)add(lines,g.decisionLabels.current,g.decisionLabels.proposed);}
 for(const g of c.routineGuides)linkedGuide(g);sources(lines,c.sources);
 add(lines,'','published follow-up criteria',...c.followUp.criteria,...c.followUp.authoredNotes);
}
function legacyPresentation(lines:Lines,p:Presentation,record:Pick<FinalExportRecord,'use'|'plan'>):void{
 const renderedUse=new Set<string>();
 const productWithUse=(item:Product)=>{product(lines,item);if(renderedUse.has(item.id))return;const use=record.use.find(u=>u.productId===item.id);if(use){reportedUse(lines,use);renderedUse.add(item.id);}};
 add(lines,p.title,p.summary,'prepared by: '+p.preparedBy,p.preparedOn?'prepared on: '+p.preparedOn:'preparation date unknown');
 for(const s of p.consultationSections)add(lines,s.title,s.body);
 add(lines,'','original published routine');for(const s of p.baselineRoutine){add(lines,'',s.title);if(s.product)productWithUse(s.product);usage(lines,s.usage);}
 add(lines,'','original published decisions (separate from actual use)');for(const c of p.categoryCards){add(lines,'',c.kind.replaceAll('_',' '),c.title,c.subtitle,c.rationaleTitle);if(c.currentProduct){add(lines,'current product');productWithUse(c.currentProduct);}if(c.proposedProduct){add(lines,'proposed product');productWithUse(c.proposedProduct);}for(const r of c.reasons)add(lines,r.title,r.body);add(lines,...c.actions);if(c.usage)usage(lines,c.usage);comparisons(lines,c.comparisons);add(lines,c.factsTitle);facts(lines,c.facts);guide(lines,c.how,guideApplicability(record.plan,c.how.productId));sources(lines,c.sources);if(c.decisionLabels)add(lines,c.decisionLabels.current,c.decisionLabels.proposed);}
 for(const g of p.routineGuides)guide(lines,g,guideApplicability(record.plan,g.productId));sources(lines,p.sources);add(lines,p.currentProductsStatus?'recorded current-products status: '+p.currentProductsStatus:'current-products status not specified');
}
function instructionLabel(record:Pick<FinalExportRecord,'plan'>,slotId:string,productId:string|null):string{
 const identity=(p:Product)=>[p.name||'product name unknown',p.brand||'brand unknown',p.variant?'variant: '+p.variant:'variant unknown',p.sizeLabel||'size unknown'].join(' · ');
 const bindings:string[]=[];
 if(record.plan.documentSchemaVersion===3){
  const c=record.plan.content;
  for(const [index,s] of c.routine.entries())if(s.slotId===slotId&&s.productId===productId)bindings.push('published routine item '+(index+1)+': '+(s.title||'title not specified'));
  for(const [index,d] of c.decisions.entries())if(d.slotId===slotId&&productId!==null){
   const roles=[...(d.currentProductIds.includes(productId)?['current product']:[]),...(d.primaryProductId===productId?['primary product']:[]),...(d.alternativeProductIds.includes(productId)?['optional alternative']:[])];
   if(roles.length)bindings.push('published decision item '+(index+1)+': '+d.kind.replaceAll('_',' ')+' · '+(d.guidance.title||'title not specified')+' · '+roles.join(', '));
  }
  requireValue(bindings.length>0);
  if(productId===null)return 'nonproduct instruction; '+bindings.join('; ');
  const index=c.products.findIndex(p=>p.id===productId),p=c.products[index];requireValue(p);
  return identity(p)+' · product listing item '+(index+1)+'; '+bindings.join('; ');
 }
 const p=record.plan.legacyOriginal.presentation;requireValue(p);
 for(const [index,s] of p.baselineRoutine.entries())if(s.slot===slotId&&s.productId===productId){requireValue(productId===null||s.product);bindings.push('original published routine item '+(index+1)+': '+s.title+' · '+(s.product?identity(s.product):'nonproduct instruction'));}
 for(const [index,c] of p.categoryCards.entries())if(c.slot===slotId&&productId!==null){
  const scope='original published decision item '+(index+1)+': '+c.kind.replaceAll('_',' ')+' · '+c.title;
  if(c.currentProduct?.id===productId)bindings.push(scope+' · current product: '+identity(c.currentProduct));
  if(c.proposedProduct?.id===productId)bindings.push(scope+' · proposed product: '+identity(c.proposedProduct));
 }
 requireValue(bindings.length>0);return bindings.join('; ');
}
const escape=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const htmlStart='<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><title>shelv final plan</title><style>body{max-width:76ch;margin:2rem auto;padding:0 1rem;color:#17392b;background:#fffdf5;font:16px/1.6 system-ui}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}@media print{body{margin:0;max-width:none}}</style></head><body><main><h1>shelv final plan</h1><pre>';
const htmlEnd='</pre></main></body></html>\n';
function planLines(unit:FinalExportPlanUnit):Lines{
 const b=unit.careBasis,lines:Lines=[];
 add(lines,'shelv final plan',`plan version: ${b.publication.version}`,`document version: ${b.publication.documentSchemaVersion}`,'published at: '+b.publishedAt,'support ended on: '+b.supportEndsOn,'exclusive support-end instant: '+b.supportEndsAt,'interactive read-only end: '+b.readOnlyEndsOn,'exclusive read-only end instant: '+b.readOnlyEndsAt,'dates use America/Chicago','static final care record; this copy does not extend support or interactive care access','applicable instructions below supersede the corresponding published directions; reported use remains separate','');
 if(unit.plan.documentSchemaVersion===3)richPlan(lines,unit.plan.content,unit);
 else {const p=unit.plan.legacyOriginal.presentation;requireValue(p);add(lines,'goal: '+unit.plan.goal);legacyPresentation(lines,p,unit);for(const rec of unit.plan.legacyOriginal.recommendations)add(lines,'original recommendation: '+rec.slot,rec.rationale,`original recorded display price: ${rec.priceCents} cents ${rec.currency}`);}
 add(lines,'','applicable instructions at support end');return lines;
}
function instructionLines(i:FinalExportInstruction,label:string):Lines{
 const lines:Lines=[];add(lines,'',`instruction: ${i.instructionId} · version ${i.version}`,'applies to: '+label,'effective on: '+i.effectiveOn,'published at: '+i.publishedAt,i.originalStart?'original Start: '+known(i.originalStart):null,i.content.reason);
 if(i.content.format==='authored_schedule'){add(lines,...i.content.directions,...i.content.cautions.map(t=>'caution: '+t));schedule(lines,i.content.schedule);}else usage(lines,i.content.usage);return lines;
}
export type FinalExportStagingPorts<T>={write(chunk:{html:string;text:string}):Promise<void>;commit(metadata:{filename:string;contentType:string;rootHash:string}):Promise<T>;abort():Promise<void>};
/** Private staging only. No complete document/result exists before the collector's final verified commit. */
export function createFinalExportHtmlSink<T>(ports:FinalExportStagingPorts<T>):FinalExportSink<T>{
 const write=ports.write.bind(ports),finish=ports.commit.bind(ports),cancel=ports.abort.bind(ports);let next=0,busy=false,terminal=false,expected:AvailableFinalExport|undefined;const labels=new Map<string,string>();
 return {
  async stage(input,index,manifest){
   requireValue(!terminal&&!busy&&index===next);busy=true;
   try{
    const unit=detachFinalExportInput(input);let text:string,html:string;
    if(index===0){assertFinalExportPlanUnit(unit);const m=detachFinalExportInput(manifest);requireValue(m!==null&&typeof m==='object'&&'status'in m&&m.status==='available');assertAvailableManifest(m);expected=m;freezeFinalExport(expected);
     for(const s of finalExportScopes(unit.plan))labels.set(JSON.stringify([s.slotId,s.productId]),instructionLabel(unit,s.slotId,s.productId));
     const lines=planLines(unit);if(manifest.basis.instructionCount===0)add(lines,'no separately published applicable instruction revisions');text=lines.join('\n');html=htmlStart+escape(text);
    }else {assertFinalExportInstructionUnit(unit);requireValue(expected&&sameFinalExportValue(expected,manifest));const label=labels.get(JSON.stringify([unit.instruction.slotId,unit.instruction.productId]));requireValue(label);text='\n'+instructionLines(unit.instruction,label).join('\n');html=escape(text);}
    freezeFinalExport(unit);await write({html,text});next++;
   }finally{busy=false;}
  },
  async commit(manifest){requireValue(!terminal&&!busy&&expected&&sameFinalExportValue(expected,manifest)&&next===manifest.basis.unitCount);busy=true;try{await write({html:htmlEnd,text:''});const result=await finish({filename:`shelv-final-plan-v${manifest.basis.publication.version}.html`,contentType:'text/html; charset=utf-8',rootHash:manifest.rootHash});terminal=true;labels.clear();return result;}finally{busy=false;}},
  async abort(){terminal=true;labels.clear();expected=undefined;await cancel();}
 };
}
function assertAvailableManifest(value:unknown):asserts value is AvailableFinalExport{
 // Reuse the actual closed Root response decoder; no substitute manifest or success port.
 const result=mapFinalExportResult(value,{schemaVersion:1,action:'read_final_export_manifest_v1'});requireValue('status'in result&&result.status==='available');
}
/** Positive traversal only, never object/JSON dumping, generated advice, remote fetch or executable markup. */
export function serializeFinalExport(input:unknown):{filename:string;contentType:string;text:string;html:string}{
 const record=detachFinalExportInput(input);assertFinalExportRecord(record);freezeFinalExport(record);const b=record.careBasis,lines:Lines=[];
 add(lines,'shelv final plan',`plan version: ${b.publication.version}`,`document version: ${b.publication.documentSchemaVersion}`,'published at: '+b.publishedAt,'support ended on: '+b.supportEndsOn,'exclusive support-end instant: '+b.supportEndsAt,'interactive read-only end: '+b.readOnlyEndsOn,'exclusive read-only end instant: '+b.readOnlyEndsAt,'dates use America/Chicago','static final care record; this copy does not extend support or interactive care access','current applicable instructions below supersede the corresponding published directions; reported use remains separate','');
 if(record.plan.documentSchemaVersion===3)richPlan(lines,record.plan.content,record);
 else {const p=record.plan.legacyOriginal.presentation;requireValue(p);add(lines,'goal: '+record.plan.goal);legacyPresentation(lines,p,record);for(const rec of record.plan.legacyOriginal.recommendations)add(lines,'original recommendation: '+rec.slot,rec.rationale,`original recorded display price: ${rec.priceCents} cents ${rec.currency}`);}
 add(lines,'','applicable instructions at support end');if(record.instructions.length===0)add(lines,'no separately published applicable instruction revisions');
 for(const i of record.instructions){add(lines,'',`instruction: ${i.instructionId} · version ${i.version}`,'applies to: '+instructionLabel(record,i.slotId,i.productId),'effective on: '+i.effectiveOn,'published at: '+i.publishedAt,i.originalStart?'original Start: '+known(i.originalStart):null,i.content.reason);if(i.content.format==='authored_schedule'){add(lines,...i.content.directions,...i.content.cautions.map(t=>'caution: '+t));schedule(lines,i.content.schedule);}else usage(lines,i.content.usage);}
 const text=lines.join('\n'),html='<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><title>shelv final plan</title><style>body{max-width:76ch;margin:2rem auto;padding:0 1rem;color:#17392b;background:#fffdf5;font:16px/1.6 system-ui}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}@media print{body{margin:0;max-width:none}}</style></head><body><main><h1>shelv final plan</h1><pre>'+escape(text)+'</pre></main></body></html>\n';
 return {filename:`shelv-final-plan-v${b.publication.version}.html`,contentType:'text/html; charset=utf-8',text,html};
}
