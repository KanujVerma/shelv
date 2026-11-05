import type {FinalExportCommand,FinalExportManifest,FinalExportPart,FinalExportResult,FinalExportRpcCall,FinalExportSink,FinalExportStreamReceipt,FinalExportSelectionBasis,FinalExportPlanUnit} from './PortalFinalExport.ts';
import {readObject,requireValue,exactKeys,readInteger} from './ConciergePortalValidation.ts';
import {assertFinalExportBasis,assertFinalExportPlanUnit,assertFinalExportInstructionUnit,detachFinalExportInput,freezeFinalExport,finalExportBytes,finalExportCharacters,readFinalExportCommand,sameFinalExportValue,finalExportScopes,assertFinalExportScalars} from './PortalFinalExportValidation.ts';
import {finalExportPartMaxBytes,finalExportPartCharacters,finalExportReasons,finalExportPlanUnitMaxBytes,finalExportInstructionUnitMaxBytes,finalExportTotalMaxBytes} from './PortalFinalExportValues.ts';
import type {Known} from './PortalRebuild.ts';
export function buildFinalExportRpc(value:unknown):FinalExportRpcCall{return {name:'concierge_final_export_command_v1',args:{p_command:readFinalExportCommand(value)}};}
function hashString(value:unknown):void{requireValue(typeof value==='string'&&/^[a-f0-9]{64}$/.test(value));}
function isManifest(value:unknown):value is FinalExportManifest{
 const v=readObject(value);requireValue(v.schemaVersion===1);
 if(v.status==='unavailable'){exactKeys(v,['schemaVersion','status','reason']);requireValue(finalExportReasons.some(r=>r===v.reason));}
 else {exactKeys(v,['schemaVersion','status','basis','rootHash','partCount','totalBytes']);requireValue(v.status==='available');assertFinalExportBasis(v.basis);hashString(v.rootHash);readInteger(v.totalBytes,v.basis.unitCount,finalExportTotalMaxBytes);readInteger(v.partCount,v.basis.unitCount,Math.ceil(finalExportPlanUnitMaxBytes/finalExportPartCharacters)+(v.basis.unitCount-1)*Math.ceil(finalExportInstructionUnitMaxBytes/finalExportPartCharacters));}
 return true;
}
function isPart(value:unknown):value is FinalExportPart{
 const v=readObject(value);exactKeys(v,['schemaVersion','basis','partIndex','kind','segmentCount','unitCharacters','unitBytes','text','leafHash']);requireValue(v.schemaVersion===1);assertFinalExportBasis(v.basis);
 const pair=readObject(v.partIndex);exactKeys(pair,['unitIndex','segmentIndex']);const unitIndex=readInteger(pair.unitIndex,0,v.basis.unitCount-1);requireValue(v.kind===(unitIndex===0?'plan':'instruction'));
 const bound=unitIndex===0?finalExportPlanUnitMaxBytes:finalExportInstructionUnitMaxBytes;
 const chars=readInteger(v.unitCharacters,1,bound),bytes=readInteger(v.unitBytes,1,bound),segments=readInteger(v.segmentCount,1,Math.ceil(bound/finalExportPartCharacters)),segment=readInteger(pair.segmentIndex,0,segments-1);
 requireValue(bytes>=chars&&bytes<=chars*4&&segments===Math.ceil(chars/finalExportPartCharacters)&&typeof v.text==='string');
 requireValue(finalExportCharacters(v.text)===(segment===segments-1?chars-segment*finalExportPartCharacters:finalExportPartCharacters));hashString(v.leafHash);return true;
}
export function mapFinalExportResult(value:unknown,command:FinalExportCommand):FinalExportResult{
 const detached=detachFinalExportInput(value);requireValue(finalExportBytes(JSON.stringify(detached))<=finalExportPartMaxBytes);
 if(command.action==='read_final_export_manifest_v1'){requireValue(isManifest(detached));freezeFinalExport(detached);return detached;}
 requireValue(isPart(detached)&&sameFinalExportValue(detached.partIndex,command.partIndex)&&sameFinalExportValue(detached.basis,command.basis));freezeFinalExport(detached);return detached;
}
export async function finalExportSha256(text:string):Promise<string>{assertFinalExportScalars(text);const bytes=new TextEncoder().encode(text);return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');}
export const finalExportLeafFrame=(p:FinalExportPart):string=>`shelv.final-export.segment.v1\n${p.partIndex.unitIndex}\n${p.kind}\n${p.partIndex.segmentIndex}\n${p.segmentCount}\n${finalExportBytes(p.text)}\n${p.text}`;
export const finalExportRootFrame=(b:FinalExportSelectionBasis):string=>`shelv.final-export.root.v1\n${b.selectionHash}\n${b.unitCount}\n${b.instructionCount}\n`;
export const finalExportFoldFrame=(state:string,ordinal:number,leaf:string):string=>`shelv.final-export.fold.v1\n${state}\n${ordinal}\n${leaf}\n`;
export const finalExportCompleteFrame=(state:string,parts:number,bytes:number,b:FinalExportSelectionBasis):string=>`shelv.final-export.complete.v1\n${state}\n${parts}\n${bytes}\n${b.unitCount}\n${b.instructionCount}\n`;
/** Reject duplicate keys and invalid scalar encoding rather than silently repairing/dropping bytes. */
export function parseFinalExportUnitJson(text:string):unknown{
 assertFinalExportScalars(text);let i=0;
 const space=()=>{while(/[\t\n\r ]/.test(text[i]??'x'))i++;};
 const string=():string=>{const start=i++;while(i<text.length){if(text[i]==='\\'){i+=2;continue;}if(text[i++]==='"'){const value:unknown=JSON.parse(text.slice(start,i));requireValue(typeof value==='string');assertFinalExportScalars(value);return value;}}throw Error('invalid_input');};
 const value=(depth:number):void=>{
  requireValue(depth<=100);space();const first=text[i];
  if(first==='{'){i++;space();const keys=new Set<string>();if(text[i]==='}'){i++;return;}while(true){space();requireValue(text[i]==='"');const key=string();requireValue(!keys.has(key));keys.add(key);space();requireValue(text[i++]===':');value(depth+1);space();const end=text[i++];if(end==='}')return;requireValue(end===',');}}
  if(first==='['){i++;space();if(text[i]===']'){i++;return;}while(true){value(depth+1);space();const end=text[i++];if(end===']')return;requireValue(end===',');}}
  if(first==='"'){string();return;}
  const start=i;while(i<text.length&&!/[\t\n\r ,}\]]/.test(text[i]!))i++;requireValue(i>start);const scalar:unknown=JSON.parse(text.slice(start,i));requireValue(scalar===null||typeof scalar==='boolean'||typeof scalar==='number'&&Number.isFinite(scalar));
 };
 value(0);space();requireValue(i===text.length);const parsed:unknown=JSON.parse(text);return parsed;
}
type Bindings={scopes:Set<string>;starts:Map<string,Known<string>>;schema:2|3;care:FinalExportPlanUnit['careBasis']};
function bindingsFor(p:FinalExportPlanUnit,b:FinalExportSelectionBasis):Bindings{
 const {hashProfile:_p,selectionHash:_h,unitCount:_u,instructionCount:_i,...care}=b;requireValue(sameFinalExportValue(care,p.careBasis));
 return {scopes:new Set(finalExportScopes(p.plan).map(s=>JSON.stringify([s.slotId,s.productId]))),starts:new Map(p.use.map(u=>[u.productId,u.originalStart])),schema:p.plan.documentSchemaVersion,care:p.careBasis};
}
const activeSinks=new WeakSet<object>();
/** Maximum pathway retains one complete bounded unit, compact bindings and hash state, never the bundle. */
export async function collectFinalExport<T>(read:(command:FinalExportCommand)=>Promise<unknown>,sink:FinalExportSink<T>,hash:(text:string)=>Promise<string>=finalExportSha256):Promise<FinalExportStreamReceipt<T>>{
 if(activeSinks.has(sink))throw Error('staging_in_use');
 const request=read,digest=hash,stage=sink.stage.bind(sink),commit=sink.commit.bind(sink),abort=sink.abort.bind(sink);activeSinks.add(sink);
 try{
  const command:FinalExportCommand={schemaVersion:1,action:'read_final_export_manifest_v1'};freezeFinalExport(command);
  const manifest=mapFinalExportResult(await request(command),command);requireValue('status'in manifest);if(manifest.status==='unavailable')throw Error(manifest.reason);
  let state=await digest(finalExportRootFrame(manifest.basis)),parts=0,totalBytes=0,binding:Bindings|undefined,lastInstruction='';const scopes=new Set<string>();
  for(let unitIndex=0;unitIndex<manifest.basis.unitCount;unitIndex++){
   let first:FinalExportPart|undefined;const texts:string[]=[];
   for(let segmentIndex=0;segmentIndex<(first?.segmentCount??1);segmentIndex++){
    const cmd=readFinalExportCommand({schemaVersion:1,action:'read_final_export_part_v1',basis:manifest.basis,partIndex:{unitIndex,segmentIndex}});freezeFinalExport(cmd);
    const part=mapFinalExportResult(await request(cmd),cmd);requireValue('text'in part);
    if(!first)first=part;else requireValue(first.segmentCount===part.segmentCount&&first.unitCharacters===part.unitCharacters&&first.unitBytes===part.unitBytes&&first.kind===part.kind);
    requireValue(await digest(finalExportLeafFrame(part))===part.leafHash);state=await digest(finalExportFoldFrame(state,parts,part.leafHash));texts.push(part.text);parts++;
   }
   requireValue(first);const text=texts.join('');requireValue(finalExportBytes(text)===first.unitBytes&&finalExportCharacters(text)===first.unitCharacters);totalBytes+=first.unitBytes;requireValue(totalBytes<=manifest.totalBytes&&parts<=manifest.partCount);
   const unit=detachFinalExportInput(parseFinalExportUnitJson(text));
   if(unitIndex===0){assertFinalExportPlanUnit(unit);binding=bindingsFor(unit,manifest.basis);freezeFinalExport(unit);await stage(unit,unitIndex,manifest);}
   else {
    assertFinalExportInstructionUnit(unit);requireValue(binding);const i=unit.instruction,key=JSON.stringify([i.slotId,i.productId]);
    requireValue(i.instructionId===i.instructionId.toLowerCase()&&i.instructionId>lastInstruction&&!scopes.has(key)&&binding.scopes.has(key));lastInstruction=i.instructionId;scopes.add(key);
    requireValue(i.effectiveOn<binding.care.supportEndsOn&&Date.parse(i.publishedAt)<Date.parse(binding.care.supportEndsAt)&&(i.content.format==='authored_schedule')===(binding.schema===3)&&(i.productId===null)===(i.originalStart===null));
    if(i.productId!==null)requireValue(sameFinalExportValue(i.originalStart,binding.starts.get(i.productId)));
    freezeFinalExport(unit);await stage(unit,unitIndex,manifest);
   }
  }
  requireValue(parts===manifest.partCount&&totalBytes===manifest.totalBytes&&scopes.size===manifest.basis.instructionCount);
  requireValue(await digest(finalExportCompleteFrame(state,parts,totalBytes,manifest.basis))===manifest.rootHash);
  const finalManifest=mapFinalExportResult(await request(command),command);requireValue(sameFinalExportValue(finalManifest,manifest));
  const commitResult=await commit(manifest);return Object.freeze({manifest,commitResult});
 }catch(error){try{await abort();}catch{/* Original failure remains authoritative; no success receipt. */}throw error;}
 finally{activeSinks.delete(sink);}
}
