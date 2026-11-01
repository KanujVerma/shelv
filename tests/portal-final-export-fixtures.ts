import type {FinalExportRecord,FinalExportManifest,FinalExportCommand} from '../src/contracts/PortalFinalExport.ts';
import {createHash} from 'node:crypto';
import {finalExportPartCharacters} from '../src/contracts/PortalFinalExportValues.ts';

export function finalExportFixture():FinalExportRecord{return {
 schemaVersion:1,careBasis:{supportEndsOn:'2026-11-01',supportEndsAt:'2026-11-01T05:00:00.000000Z',readOnlyEndsOn:'2026-12-01',readOnlyEndsAt:'2026-12-01T06:00:00.000000Z',publication:{version:7,documentSchemaVersion:3},publishedAt:'2026-10-01T05:00:00.000000Z'},
 plan:{documentSchemaVersion:3,content:{schemaVersion:1,title:'A & B’s plan',summary:'preserve measured limits',preparation:{by:'Kanuj',on:null},consultationSections:[{title:'reported context',body:'public context'}],routineGuides:[],sources:[],context:{products:{state:'recorded',productIds:['product-1']},facts:[]},goals:[{id:'goal-1',text:'comfort',factIds:[]}],products:[{id:'product-1',name:'CeraVe PM',brand:'CeraVe',variant:'lotion',sizeLabel:'89 ml',productUrl:null,imageUrl:null,reference:null,displayPrice:null,strength:{state:'unknown'},category:{state:'known',value:'moisturizer'},identity:'client_confirmed',formula:'unknown',factIds:[],guides:[],evidence:[]}],decisions:[],routine:[{id:'step-1',slotId:'slot-1',kind:'product',productId:'product-1',title:'moisturize',directions:['thin layer'],cautions:['avoid eyes'],schedule:{periods:['evening'],days:{kind:'daily'},condition:'when comfortable',asNeeded:false,stages:[],anchor:'actual_start',automaticAdvance:false}}],followUp:{criteria:['persistent discomfort'],authoredNotes:['recorded before support ended']}}},
 use:[{productId:'product-1',state:'paused',originalStart:{state:'unknown'},occurredOn:{state:'known',value:'2026-10-31'},details:'felt uncomfortable',frequency:null,amount:null,contradiction:false}],
 instructions:[{instructionId:'00000001-0000-4000-8000-000000000001',version:2,slotId:'slot-1',productId:'product-1',effectiveOn:'2026-10-30',publishedAt:'2026-10-30T12:00:00.000000Z',originalStart:{state:'unknown'},content:{format:'authored_schedule',directions:['use only as reviewed'],cautions:['stop if uncomfortable'],schedule:{periods:['evening'],days:{kind:'selected',weekdays:[1,3]},condition:'only when comfortable',asNeeded:true,stages:[{id:'stage-1',directions:'review comfort first',minimumDaysFromActualStart:null,proceedOnlyWhen:'comfortable'}],anchor:'actual_start',automaticAdvance:false},reason:'comfort review'}}]
};}

/** Synthetic wire producer; not SQL execution or a replacement for canonical pgTAP. */
export function finalExportWire(record:FinalExportRecord){
 const text=JSON.stringify(record),chars=Array.from(text);
 const manifest:Extract<FinalExportManifest,{status:'available'}>={schemaVersion:1,status:'available',basis:{...record.careBasis,recordHash:createHash('sha256').update(text).digest('hex'),recordBytes:Buffer.byteLength(text),recordCharacters:chars.length,partCount:Math.ceil(chars.length/finalExportPartCharacters),instructionCount:record.instructions.length}};
 const requests:FinalExportCommand[]=[];
 return {manifest,text,requests,read:async(command:FinalExportCommand):Promise<unknown>=>{
  requests.push(command);if(command.action==='read_final_export_manifest_v1')return manifest;
  return {schemaVersion:1,basis:manifest.basis,partIndex:command.partIndex,text:chars.slice(command.partIndex*finalExportPartCharacters,(command.partIndex+1)*finalExportPartCharacters).join('')};
 }};
}
