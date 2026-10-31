import {uid} from './care-fixture.mjs';
export const note='CU1_LEGACY_UNSENT_NOTES';
export const descriptor={name:'Legacy new bottle',brand:{state:'unknown'},variant:{state:'unknown'},strength:{state:'unknown'},sizeLabel:{state:'unknown'},labelPhotoIds:[]};
export const form={match:null,action:'unreviewed_added',when:'unknown',date:'',acquisition:'unknown',details:note,frequency:'',amount:'',name:descriptor.name,brand:'',variant:'',strength:'',sizeLabel:'',differentProduct:false};
export const command={schemaVersion:1,action:'report_unreviewed_product_v1',requestId:uid(401),expectedUseRevision:0,product:descriptor,sourcePublication:{version:1,documentSchemaVersion:3},occurredOn:{state:'unknown'},channel:'portal',acquisition:'unknown'};
// A previously accepted 6b capture: its old request did not have a notes field.
export function legacyCreationIntent(){return{form:structuredClone(form),flow:{capture:{form:structuredClone(form),sourcePublication:command.sourcePublication,original:null,descriptor:structuredClone(descriptor),occurredOn:{state:'unknown'},change:{kind:'unreviewed_added',details:note}},steps:['create'],index:0,subject:null,identityId:null,receipts:[],pending:structuredClone(command),phase:'uncertain'}};}
