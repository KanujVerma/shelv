import type {FinalExportRecord,FinalExportManifest,FinalExportCommand,FinalExportUnit,FinalCareBasis,FinalExportSelectionBasis,FinalExportPart,FinalExportInstruction} from '../src/contracts/PortalFinalExport.ts';
import {createHash} from 'node:crypto';
import {finalExportPartCharacters} from '../src/contracts/PortalFinalExportValues.ts';
import type {Product,Guide,Usage,Presentation} from '../src/contracts/ConciergePresentation.ts';

export function finalExportFixture():FinalExportRecord{return {
 schemaVersion:1,careBasis:{supportEndsOn:'2026-11-01',supportEndsAt:'2026-11-01T05:00:00.000000Z',readOnlyEndsOn:'2026-12-01',readOnlyEndsAt:'2026-12-01T06:00:00.000000Z',publication:{version:7,documentSchemaVersion:3},publishedAt:'2026-10-01T05:00:00.000000Z'},
 plan:{documentSchemaVersion:3,content:{schemaVersion:1,title:'A & B’s plan',summary:'preserve measured limits',preparation:{by:'Kanuj',on:null},consultationSections:[{title:'reported context',body:'public context'}],routineGuides:[],sources:[],context:{products:{state:'recorded',productIds:['product-1']},facts:[]},goals:[{id:'goal-1',text:'comfort',factIds:[]}],products:[{id:'product-1',name:'CeraVe PM',brand:'CeraVe',variant:'lotion',sizeLabel:'89 ml',productUrl:null,imageUrl:null,reference:null,displayPrice:null,strength:{state:'unknown'},category:{state:'known',value:'moisturizer'},identity:'client_confirmed',formula:'unknown',factIds:[],guides:[],evidence:[]}],decisions:[],routine:[{id:'step-1',slotId:'slot-1',kind:'product',productId:'product-1',title:'moisturize',directions:['thin layer'],cautions:['avoid eyes'],schedule:{periods:['evening'],days:{kind:'daily'},condition:'when comfortable',asNeeded:false,stages:[],anchor:'actual_start',automaticAdvance:false}}],followUp:{criteria:['persistent discomfort'],authoredNotes:['recorded before support ended']}}},
 use:[{productId:'product-1',state:'paused',originalStart:{state:'unknown'},occurredOn:{state:'known',value:'2026-10-31'},details:'felt uncomfortable',frequency:null,amount:null,contradiction:false}],
 instructions:[{instructionId:'00000001-0000-4000-8000-000000000001',version:2,slotId:'slot-1',productId:'product-1',effectiveOn:'2026-10-30',publishedAt:'2026-10-30T12:00:00.000000Z',originalStart:{state:'unknown'},content:{format:'authored_schedule',directions:['use only as reviewed'],cautions:['stop if uncomfortable'],schedule:{periods:['evening'],days:{kind:'selected',weekdays:[1,3]},condition:'only when comfortable',asNeeded:true,stages:[{id:'stage-1',directions:'review comfort first',minimumDaysFromActualStart:null,proceedOnlyWhen:'comfortable'}],anchor:'actual_start',automaticAdvance:false},reason:'comfort review'}}]
};}

export function finalExportLegacyFixture():FinalExportRecord{
 const r=finalExportFixture();
 const product:Product={id:'product-1',name:'Legacy Product',brand:'Brand',variant:'Original variant',sizeLabel:'Original size',productUrl:'https://example.com/product',imageUrl:'assets/product.webp',reference:'original public reference',displayPrice:{cents:1234,currency:'USD',sourceUrl:'https://example.com/price',checkedOn:null,illustrative:true},sourceLabel:'original label'};
 const usage:Usage={periods:['evening'],order:3,short:{morning:null,evening:'legacy short directions'},instructions:['legacy original directions']};
 const guide:Guide={id:'guide-1',productId:'product-1',title:'legacy guide',intro:'legacy intro',steps:[{title:'legacy guide step',body:'legacy step body'}],careNote:'legacy care note',sources:[{label:'legacy public source',url:'https://example.com/guide'}]};
 const presentation:Presentation={schemaVersion:2,title:'original legacy title',summary:'original legacy summary',preparedBy:'Kanuj',preparedOn:null,sources:[{label:'legacy source',url:'https://example.com/source'}],consultationSections:[{title:'original consultation title',body:'original consultation body'}],categoryCards:[{id:'card-1',slot:'slot-1',kind:'keep',recommendationId:'recommendation-1',title:'legacy card',subtitle:'legacy subtitle',rationaleTitle:'legacy rationale',reasons:[{title:'legacy reason title',body:'legacy reason body'}],actions:['legacy action'],currentProduct:product,proposedProduct:product,usage,comparisons:[{label:'legacy comparison',currentText:'legacy current comparison',proposedText:'legacy proposed comparison',significance:'legacy significance',ingredientGuideKey:null,guideNote:'legacy comparison limit',sources:[]}],factsTitle:'legacy facts',facts:[{title:'legacy evidence',body:'legacy evidence limit',ingredientGuideKey:null,sources:[]}],how:guide,sources:[],decisionLabels:{current:'original current label',proposed:'original proposed label'}}],baselineRoutine:[{id:'routine-1',kind:'product',slot:'slot-1',productId:'product-1',product,title:'legacy routine title',usage}],routineGuides:[guide],currentProductsStatus:'recorded'};
 r.careBasis.publication.documentSchemaVersion=2;
 r.plan={documentSchemaVersion:2,legacyOriginal:{version:7,recommendations:[{id:'recommendation-1',slot:'slot-1',currentProductId:'product-1',proposedProductId:'product-1',priceCents:1234,currency:'USD',rationale:'original recommendation rationale'}],presentation},goal:'original public goal'};
 r.instructions=[{instructionId:'00000001-0000-4000-8000-000000000001',version:2,slotId:'slot-1',productId:'product-1',effectiveOn:'2026-10-31',publishedAt:'2026-10-31T12:00:00.000000Z',originalStart:{state:'unknown'},content:{format:'legacy_usage',usage:{...usage,instructions:['actual latest legacy instruction']},reason:'actual legacy instruction reason'}}];
 return r;
}

/** Synthetic per-unit wire producer. It is never SQL or authenticated persistence evidence. */
export function finalExportWire(record:FinalExportRecord){
 const {schemaVersion,careBasis,plan,use}=record;
 const units:FinalExportUnit[]=[{schemaVersion,kind:'plan',careBasis,plan,use},...record.instructions.map(instruction=>({schemaVersion:1 as const,kind:'instruction' as const,instruction})).sort((a,b)=>a.instruction.instructionId.localeCompare(b.instruction.instructionId))];
 return finalExportUnitWire(units.length,record.careBasis,i=>{const unit=units[i];if(!unit)throw Error('fixture unit');return unit;});
}
export function finalExportUnitWire(unitCount:number,care:FinalCareBasis,unit:(i:number)=>FinalExportUnit,recordRequests=true){
 const H=(s:string)=>createHash('sha256').update(s).digest('hex');
 const basis:FinalExportSelectionBasis={...care,hashProfile:'shelv.final-export.folded-sha256.v1',selectionHash:H('synthetic immutable selection'),unitCount,instructionCount:unitCount-1};
 const make=(unitIndex:number)=>{const value=unit(unitIndex),text=JSON.stringify(value),chars=Array.from(text),segmentCount=Math.ceil(chars.length/32768);return {value,text,chars,segmentCount,unitBytes:Buffer.byteLength(text)};};
 let root=H('shelv.final-export.root.v1\n'+basis.selectionHash+'\n'+unitCount+'\n'+(unitCount-1)+'\n'),partCount=0,totalBytes=0;
 const piece=(unitIndex:number,segmentIndex:number,data:ReturnType<typeof make>):FinalExportPart=>{
  const text=data.chars.slice(segmentIndex*32768,(segmentIndex+1)*32768).join(''),leafHash=H('shelv.final-export.segment.v1\n'+unitIndex+'\n'+data.value.kind+'\n'+segmentIndex+'\n'+data.segmentCount+'\n'+Buffer.byteLength(text)+'\n'+text);
  return {schemaVersion:1,basis,partIndex:{unitIndex,segmentIndex},kind:data.value.kind,segmentCount:data.segmentCount,unitCharacters:data.chars.length,unitBytes:data.unitBytes,text,leafHash};
 };
 for(let i=0;i<unitCount;i++){const data=make(i);totalBytes+=data.unitBytes;for(let j=0;j<data.segmentCount;j++){const p=piece(i,j,data);root=H('shelv.final-export.fold.v1\n'+root+'\n'+partCount+'\n'+p.leafHash+'\n');partCount++;}}
 root=H('shelv.final-export.complete.v1\n'+root+'\n'+partCount+'\n'+totalBytes+'\n'+unitCount+'\n'+(unitCount-1)+'\n');
 const manifest:Extract<FinalExportManifest,{status:'available'}>={schemaVersion:1,status:'available',basis,rootHash:root,partCount,totalBytes};
 const requests:FinalExportCommand[]=[];const metrics={partReads:0,maxUnitBytes:0};let cachedIndex=-1,cached:ReturnType<typeof make>|undefined;
 return {manifest,requests,metrics,read:async(command:FinalExportCommand):Promise<unknown>=>{if(recordRequests)requests.push(command);if(command.action==='read_final_export_manifest_v1')return manifest;const {unitIndex,segmentIndex}=command.partIndex;if(cachedIndex!==unitIndex){cached=make(unitIndex);cachedIndex=unitIndex;}if(!cached)throw Error('fixture');metrics.partReads++;metrics.maxUnitBytes=Math.max(metrics.maxUnitBytes,cached.unitBytes);return piece(unitIndex,segmentIndex,cached);}};
}

export function finalExportMaximumScopeFixture(){
 const record=finalExportFixture();if(record.plan.documentSchemaVersion!==3)throw Error('fixture');const c=record.plan.content,base=c.products[0]!,step=c.routine[0]!;
 c.products=Array.from({length:50},(_,i)=>({...structuredClone(base),id:`product-${i}`,name:`Product ${i}`}));c.context.products={state:'recorded',productIds:c.products.map(p=>p.id)};
 c.routine=Array.from({length:50},(_,i)=>({...structuredClone(step),id:`step-${i}`,slotId:`routine-${i}`,productId:'product-0'}));
 c.decisions=Array.from({length:50},(_,i)=>({id:`decision-${i}`,slotId:`decision-slot-${i}`,recommendationId:null,kind:'keep',goalIds:['goal-1'],currentProductIds:c.products.map(p=>p.id),primaryProductId:null,alternativeProductIds:[],reason:'retained reason',directions:[],cautions:[],limitations:[],schedule:null,factIds:[],guidance:{title:'reviewed',subtitle:'',rationaleTitle:'reason',reasons:[],actions:[],comparisons:[],factsTitle:'evidence',facts:[],how:null,sources:[],group:null,decisionLabels:null}}));
 record.use=c.products.map(p=>({productId:p.id,state:'not_reported',originalStart:{state:'unknown'},occurredOn:{state:'unknown'},details:null,frequency:null,amount:null,contradiction:false}));
 let index=0;const instruction=(slotId:string,productId:string):FinalExportInstruction=>({instructionId:(++index).toString(16).padStart(8,'0')+'-0000-4000-8000-000000000001',version:1,slotId,productId,effectiveOn:'2026-10-31',publishedAt:'2026-10-31T12:00:00.000000Z',originalStart:{state:'unknown'},content:{format:'authored_schedule',directions:[`instruction ${index} complete 🧴`],cautions:['retained caution'],reason:'reviewed reason',schedule:structuredClone(step.schedule)}});
 record.instructions=c.routine.map(s=>instruction(s.slotId,'product-0'));for(let d=0;d<50;d++)for(let p=0;p<50;p++)record.instructions.push(instruction(`decision-slot-${d}`,`product-${p}`));
 return record;
}
