import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from '../node_modules/typescript/lib/typescript.js';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const options={target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,noEmit:true,allowImportingTsExtensions:true,strict:true,noUncheckedIndexedAccess:true,verbatimModuleSyntax:true,skipLibCheck:false,lib:['lib.es2022.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts'],types:[]};
test('inventory Root program and selector-free immutable ABI compile under full strong flags',()=>{
 const file=path.join(root,'apps/portal/tests/.inventory-abi.ts');
 const source=`import type {CheckinRpcCall,CheckinPhotoInventoryPage} from '../../../supabase/functions/concierge-checkins/types.ts';
import type {CheckinPhotoInventory} from '../../../supabase/functions/concierge-checkins/projection.ts';
import {mapCheckinPhotoInventory} from '../../../supabase/functions/concierge-checkins/projection.ts';
const request:CheckinPhotoInventoryPage={cursor:null,limit:50,expectedRevision:null};
const fixed:CheckinRpcCall={name:'concierge_checkin_photo_inventory_v1',args:{p_cursor:null,p_limit:50,p_expected_revision:null}};
// @ts-expect-error no client selector
const owner:CheckinRpcCall={name:'concierge_checkin_photo_inventory_v1',args:{p_cursor:null,p_limit:50,p_expected_revision:null,p_client_id:'caller'}};
// @ts-expect-error every fixed argument is required
const omitted:CheckinRpcCall={name:'concierge_checkin_photo_inventory_v1',args:{p_limit:50}};
const result=mapCheckinPhotoInventory({},request);
if(result.ok){
 const value:CheckinPhotoInventory=result.value;
 const id:string|undefined=value.photos[0]?.id;
 // @ts-expect-error readonly snapshot
 value.revision=18;
 // @ts-expect-error readonly collection
 value.photos.push({id:'caller',angle:'front'});
 // @ts-expect-error canonical existing angle set
 const angle:CheckinPhotoInventory['photos'][number]['angle']='back';
 // @ts-expect-error no private URL
 value.photos[0]?.signedUrl;
 // @ts-expect-error no clinical history
 value.reports;
 // @ts-expect-error no invented total
 value.total;
 void [id,angle];
}
void [fixed,owner,omitted];`;
 const host=ts.createCompilerHost(options),get=host.getSourceFile;
 host.getSourceFile=(name,version,onError,create)=>name===file?ts.createSourceFile(name,source,version,true):get(name,version,onError,create);
 const program=ts.createProgram([file,path.join(root,'supabase/functions/concierge-checkins/index.ts')],options,host);
 const diagnostics=ts.getPreEmitDiagnostics(program);
 console.log('INVENTORY_STRONG '+JSON.stringify({compiler:ts.version,options,diagnostics:diagnostics.map(d=>({code:d.code,file:d.file?.fileName,message:ts.flattenDiagnosticMessageText(d.messageText,'\n')})),files:program.getSourceFiles().map(f=>({path:path.relative(root,f.fileName),sha256:createHash('sha256').update(f.fileName===file?source:readFileSync(f.fileName)).digest('hex')}))}));
 assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>root,getCanonicalFileName:f=>f,getNewLine:()=> '\n'}));
});
