import type {FinalExportCommand,FinalExportManifest,FinalExportPart,FinalExportResult,FinalExportRpcCall,CollectedFinalExport} from './PortalFinalExport.ts';
import {readObject,requireValue,exactKeys,readInteger} from './ConciergePortalValidation.ts';
import {assertFinalExportBasis,assertFinalExportRecord,detachFinalExportInput,freezeFinalExport,finalExportBytes,readFinalExportCommand,sameFinalExportValue} from './PortalFinalExportValidation.ts';
import {finalExportPartMaxBytes,finalExportPartCharacters,finalExportReasons} from './PortalFinalExportValues.ts';

export function buildFinalExportRpc(value:unknown):FinalExportRpcCall{return {name:'concierge_final_export_command_v1',args:{p_command:readFinalExportCommand(value)}};}
function isManifest(value:unknown):value is FinalExportManifest{
 const v=readObject(value);requireValue(v.schemaVersion===1);
 if(v.status==='unavailable'){exactKeys(v,['schemaVersion','status','reason']);requireValue(finalExportReasons.some(r=>r===v.reason));}
 else {exactKeys(v,['schemaVersion','status','basis']);requireValue(v.status==='available');assertFinalExportBasis(v.basis);}
 return true;
}
function isPart(value:unknown):value is FinalExportPart{
 const v=readObject(value);exactKeys(v,['schemaVersion','basis','partIndex','text']);requireValue(v.schemaVersion===1);assertFinalExportBasis(v.basis);readInteger(v.partIndex,0,v.basis.partCount-1);requireValue(typeof v.text==='string');
 const expected=v.partIndex===v.basis.partCount-1?v.basis.recordCharacters-v.partIndex*finalExportPartCharacters:finalExportPartCharacters;
 requireValue(Array.from(v.text).length===expected);return true;
}
export function mapFinalExportResult(value:unknown,command:FinalExportCommand):FinalExportResult{
 const detached=detachFinalExportInput(value);requireValue(finalExportBytes(JSON.stringify(detached))<=finalExportPartMaxBytes);
 if(command.action==='read_final_export_manifest_v1'){requireValue(isManifest(detached));freezeFinalExport(detached);return detached;}
 requireValue(isPart(detached)&&detached.partIndex===command.partIndex&&sameFinalExportValue(detached.basis,command.basis));freezeFinalExport(detached);return detached;
}
export async function finalExportSha256(text:string):Promise<string>{const bytes=new TextEncoder().encode(text);return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');}
/** Inputs and function references detach before awaits; the returned frozen record is exactly the parsed hashed text. */
export async function collectFinalExport(read:(command:FinalExportCommand)=>Promise<unknown>,hash:(text:string)=>Promise<string>=finalExportSha256):Promise<CollectedFinalExport>{
 const request=read,digest=hash,manifestCommand:FinalExportCommand={schemaVersion:1,action:'read_final_export_manifest_v1'};
 const manifest=mapFinalExportResult(await request(manifestCommand),manifestCommand);requireValue('status'in manifest);
 if(manifest.status==='unavailable')throw Error(manifest.reason);
 const parts:string[]=[];
 for(let partIndex=0;partIndex<manifest.basis.partCount;partIndex++){
  const command=readFinalExportCommand({schemaVersion:1,action:'read_final_export_part_v1',basis:manifest.basis,partIndex});freezeFinalExport(command);
  const part=mapFinalExportResult(await request(command),command);requireValue('text'in part);parts.push(part.text);
 }
 const recordText=parts.join('');requireValue(finalExportBytes(recordText)===manifest.basis.recordBytes&&Array.from(recordText).length===manifest.basis.recordCharacters);
 const record:unknown=JSON.parse(recordText);assertFinalExportRecord(record);freezeFinalExport(record);
 const {recordHash:_h,recordBytes:_b,recordCharacters:_c,partCount:_p,instructionCount,...care}=manifest.basis;
 requireValue(sameFinalExportValue(record.careBasis,care)&&record.instructions.length===instructionCount);
 requireValue(await digest(recordText)===manifest.basis.recordHash);
 // This final current-authority read also detects a basis changed during hashing/collection.
 const finalManifest=mapFinalExportResult(await request(manifestCommand),manifestCommand);requireValue(sameFinalExportValue(finalManifest,manifest));
 return Object.freeze({manifest,record,recordText});
}
