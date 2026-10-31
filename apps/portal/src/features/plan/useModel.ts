import type {Acquisition,ClientPublicationRef,IdentityAnswer,ProductRef,ReportedProductBody,UseChange} from '../../../../../src/contracts/PortalCare.ts';
import type {Known} from '../../../../../src/contracts/PortalRebuild.ts';
export type UseAction='started_today'|'started_earlier'|'paused'|'stopped'|'different'|'unreviewed_added';
export interface UseForm {match:IdentityAnswer['match']|null;action:UseAction;when:'today'|'earlier'|'unknown';date:string;acquisition:Acquisition;details:string;frequency:string;amount:string;name:string;brand:string;variant:string;strength:string;sizeLabel:string;differentProduct:boolean}
export interface CapturedUse {form:UseForm;sourcePublication:ClientPublicationRef;original:ProductRef|null;descriptor:ReportedProductBody|null;occurredOn:Known<string>;change:UseChange}
export const knownText=(value:string):Known<string>=>value.trim()?{state:'known',value:value.trim()}:{state:'unknown'};
export function chicagoToday():string{return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function occurrenceFor(form:UseForm,today:string):Known<string>{
 if(form.action==='started_today'||form.when==='today')return{state:'known',value:today};
 if(form.when==='unknown')return{state:'unknown'};
 const day=form.date,parsed=new Date(day+'T12:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||day<'1900-01-01'||day>today||Number.isNaN(parsed.valueOf())||parsed.toISOString().slice(0,10)!==day)throw new Error('enter a real date on or before today, or choose date not known.');
 return{state:'known',value:day};
}
export const isStopping=(form:UseForm)=>form.action==='paused'||form.action==='stopped';
export const needsReportedDescriptor=(form:UseForm,original:ProductRef|null)=>!original||form.differentProduct||form.action==='unreviewed_added'&&original.kind==='plan_product'||!isStopping(form)&&(form.match==='no'||form.match==='not_sure');
export const canIncludeUseNotes=(form:UseForm,original:ProductRef|null)=>!form.action.startsWith('started_')&&!(form.action==='unreviewed_added'&&needsReportedDescriptor(form,original));
/** Existing captures are judged by their actual recorded pipeline, not new form defaults. */
export const captureHasUnsentNotes=(capture:CapturedUse)=>!!capture.form.details.trim()&&(capture.change.kind==='started'||capture.change.kind==='unreviewed_added'&&capture.descriptor!==null);
export function captureUse(form:UseForm,original:ProductRef|null,publication:ClientPublicationRef,today:string):CapturedUse{
 const needsDescriptor=needsReportedDescriptor(form,original);
 if(form.details.trim()&&!canIncludeUseNotes(form,original))throw new Error('these notes cannot be included with this action. choose a different action or remove the unsent notes.');
 if(original&&!form.match&&!isStopping(form))throw new Error('choose yes, no or not sure for the selected product.');
 if(needsDescriptor&&!form.name.trim())throw new Error('enter the name of the product you used. unknown variant and strength can stay blank.');
 if(form.action==='different'&&!form.details.trim())throw new Error('describe how you are using it differently.');
 const descriptor=needsDescriptor?{name:form.name.trim(),brand:knownText(form.brand),variant:knownText(form.variant),strength:knownText(form.strength),sizeLabel:knownText(form.sizeLabel),labelPhotoIds:[]}:null;
 const change:UseChange=form.action.startsWith('started_')?{kind:'started'}:form.action==='different'?{kind:'different',frequency:knownText(form.frequency),amount:knownText(form.amount),details:form.details.trim()}:form.action==='paused'||form.action==='stopped'?{kind:form.action,details:form.details.trim()||null}:{kind:'unreviewed_added',details:form.details.trim()||null};
 return{form:structuredClone(form),original,descriptor,sourcePublication:publication,occurredOn:occurrenceFor(form,today),change};
}
