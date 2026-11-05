// Test-only, opt-in synthetic telemetry. No requests, routing or application authority.
import fs from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const budget2550TestName = '2550 actual declared scopes paginate completely without any unbounded detail preload and retain all50 paused facts';
const origin='https://shelv-v3-guidance.invalid',maxEvents=1024,maxRequests=256,maxBody=120000,maxResponse=1800000;
const actions=new Set(['read_client_plan_v3','read_client_instruction_manifest_v1','read_client_instruction_v1','record_decision_v2','request_status_v1','report_unreviewed_product_v1','amend_reported_product_v1','report_identity_v1','report_product_use_v1','amend_use_v1','read_client_plan_v2','read_reported_products_v1','read_use_history_v1']);
const hash=value=>createHash('sha256').update(value).digest('hex');
const outputName=name=>/^(rebuild-plan-guidance-browser-entry\.(js|css)|fonts\/[a-zA-Z0-9._-]+\.(woff2?|ttf))$/.test(name);
const sensitive=/authorization|cookie|apikey|api[_-]?key|bearer|csrf|token|secret|password|credential|\.env\b/i;
const safeText=value=>{const text=String(value??'');return sensitive.test(text)?'[redacted sensitive message]':text.replace(/https?:\/\/\S+/g,'[url]').slice(0,1000);};
const boundedError=error=>({name:safeText(error?.name??'Error'),message:safeText(error?.message??error)});
function fixedRequest(request){
 try{const url=new URL(request.url()),method=request.method();if(url.origin!==origin||url.search||url.hash||url.username||url.password)return null;
  if(url.pathname==='/api/client/session'&&method==='GET')return{route:url.pathname,action:'session',bytes:0,wireHash:null};
  if(!['/api/client/reviews','/api/client/care'].includes(url.pathname)||method!=='POST')return null;
  const wire=request.postData();if(typeof wire!=='string')return null;const bytes=Buffer.byteLength(wire);if(bytes>500000)return null;
  const action=JSON.parse(wire)?.action;if(!actions.has(action))return null;return{route:url.pathname,action,bytes,wireHash:hash(wire)};
 }catch{return null;}
}
async function trustedDirectory(directory){
 let current=path.parse(directory).root;
 for(const part of directory.slice(current.length).split(path.sep).filter(Boolean)){
  current=path.join(current,part);try{await fs.mkdir(current,{mode:0o700});}catch(e){if(e.code!=='EEXIST')throw e;}
  const stat=await fs.lstat(current);if(stat.isSymbolicLink())throw Error('diagnostics destination symlink rejected');if(!stat.isDirectory())throw Error('diagnostics destination is not a directory');
 }
 if(await fs.realpath(directory)!==directory)throw Error('diagnostics destination must be canonical');
 return fs.mkdtemp(path.join(directory,'budget2550-'));
}
export function createBudgetDiagnostics({testName,directory,now=()=>performance.now()}={}){
 if(!directory||testName!==budget2550TestName)return null;
 if(typeof directory!=='string'||!path.isAbsolute(directory))throw Error('diagnostics directory must be absolute');
 if(path.normalize(directory)!==directory)throw Error('diagnostics directory must be normalized');
 if(directory===path.parse(directory).root)throw Error('diagnostics directory must be a dedicated absolute subdirectory');
 const events=[],pending=new Set(),listeners=[],requestIds=new WeakMap(),prepared=new Map(),start=now();let nextId=0,dropped=0,pageRef=null,png=null,closed=false,persisted=null;
 const state={schemaVersion:1,purpose:'finite synthetic budget2550 diagnostics; no backend authority',testName,outcome:'unknown',pageAvailable:false,body:null,counts:null,errors:[],captureErrors:[]};
 const source={schemaVersion:1,sourceHead:null,platform:process.platform,architecture:process.arch,nodeVersion:process.version,browserVersion:null,inputs:[],outputs:[],served:[],errors:[],rejectedInputs:0};
 const emit=value=>{if(events.length<maxEvents)events.push({sequence:events.length+1,atMs:Math.max(0,now()-start),...value});else dropped++;};
 const error=(kind,e)=>{if(state.errors.length<32)state.errors.push({kind,...boundedError(e)});emit({event:'error',kind,...boundedError(e)});};
 const branch=run=>{const work=Promise.resolve().then(run).catch(e=>error('observer',e));pending.add(work);void work.finally(()=>pending.delete(work));};
 const on=(page,event,fn)=>{page.on(event,fn);listeners.push(()=>page.off(event,fn));};
 function attach(page,{browserVersion}={}){
  if(pageRef)return;pageRef=page;source.browserVersion=safeText(browserVersion).slice(0,160);
  on(page,'request',request=>{const record=fixedRequest(request);if(!record)return;if(nextId>=maxRequests){dropped++;return;}const id=++nextId;requestIds.set(request,id);emit({event:'request',id,...record});});
  on(page,'response',response=>{const id=requestIds.get(response.request());if(!id)return;const status=response.status();emit({event:'response',id,status});branch(async()=>{const bytes=await response.body();emit(bytes.length<=maxResponse?{event:'response-bytes',id,bytes:bytes.length,sha256:hash(bytes)}:{event:'response-bytes',id,bytes:bytes.length,oversize:true});});});
  on(page,'requestfinished',request=>{const id=requestIds.get(request);if(id)emit({event:'finished',id});});
  on(page,'requestfailed',request=>{const id=requestIds.get(request);if(id)emit({event:'cancelled',id,message:safeText(request.failure()?.errorText)});});
  on(page,'pageerror',e=>error('page',e));
  on(page,'console',message=>{const text=message.text();if(text.startsWith('W3_MANIFEST_OBSERVATION ')||text.startsWith('W3_MANIFEST_CLICK ')){try{const data=JSON.parse(text.slice(text.indexOf(' ')+1)),summary={};for(const key of ['lifecycle','commitId','instanceId','viewId','sessionId','snapshotId','scopeId','currentViewId','currentSessionId','currentSnapshotId','currentScopeId','mode','phase','manifestCount','instructionCount','detailCount','error','revision','observedAtMs','observationKind','eventAtMs'])if(typeof data[key]==='number'||typeof data[key]==='string'||data[key]===null)summary[key]=typeof data[key]==='string'?safeText(data[key]).slice(0,100):data[key];emit({event:text.startsWith('W3_MANIFEST_CLICK ')?'manifest-click':'manifest-observation',summary});}catch(e){error('manifest-observation',e);}}else if(message.type()==='error')error('console',text);});
  on(page,'close',()=>emit({event:'page-closed'}));
  emit({event:'observer-attached'});
 }
 function preparedSource({files,inputs={},workingDirectory,testInstrumentation={enabled:false}}){
  source.testInstrumentation=JSON.parse(JSON.stringify(testInstrumentation));
  for(const [name,bytes] of files){if(!outputName(name)||source.outputs.length>=32||bytes.length>12000000)continue;const row={name,bytes:bytes.length,sha256:hash(bytes)};source.outputs.push(row);prepared.set(name,{...row,reference:bytes});}
  source.preparedHash=hash(JSON.stringify(source.outputs));
  branch(async()=>{
   const workspace=path.resolve(workingDirectory,'../..');source.sourceHead=execFileSync('git',['rev-parse','HEAD'],{cwd:workspace,encoding:'utf8'}).trim();
   const entries=Object.keys(inputs);if(entries.length>2500)throw Error('diagnostics input count exceeds bound');let index=0,total=0;
   async function worker(){while(index<entries.length){const input=entries[index++],absolute=path.resolve(workingDirectory,input),relative=path.relative(workspace,absolute).split(path.sep).join('/');
    if(!/^(apps\/portal\/(src\/|site\/auth\/|site\/advisor\/maya-sample\.js$|node_modules\/|tests\/rebuild-plan-guidance-manifest-(observation\.ts|observer\.tsx)$)|src\/contracts\/)/.test(relative)){source.rejectedInputs++;continue;}
    const real=await fs.realpath(absolute);if(real!==absolute||!real.startsWith(workspace+path.sep)){source.rejectedInputs++;continue;}
    const stat=await fs.stat(real);if(!stat.isFile()||stat.size>12000000||total+stat.size>60000000){source.rejectedInputs++;continue;}total+=stat.size;
    const bytes=await fs.readFile(real),transform=testInstrumentation.transforms?.find(t=>t.path===relative),added=testInstrumentation.addedModules?.find(t=>t.path===relative);
    if(transform){if(hash(bytes)!==transform.beforeSha256||bytes.length!==transform.beforeBytes||inputs[input]?.bytes!==transform.afterBytes)throw Error('transformed input provenance mismatch');source.inputs.push({path:relative,bytes:transform.afterBytes,compilerBytes:inputs[input].bytes,sha256:transform.afterSha256,onDiskSha256:transform.beforeSha256,onDiskBytes:bytes.length,testTransformed:true});}
    else{if(added&&(hash(bytes)!==added.sha256||bytes.length!==added.bytes))throw Error('added observer module provenance mismatch');source.inputs.push({path:relative,bytes:bytes.length,compilerBytes:inputs[input]?.bytes??null,sha256:hash(bytes)});}
   }}
   await Promise.all(Array.from({length:8},worker));source.inputs.sort((a,b)=>a.path.localeCompare(b.path));source.inputHash=hash(JSON.stringify(source.inputs));
  });
 }
 async function captureTerminal(page,{outcome,error:failure}={}){
  emit({event:'terminal-capture-start'});state.outcome=outcome==='pass'?'pass':'fail';if(failure)error('test',failure);
  if(!page){state.captureErrors.push({name:'PageUnavailable',message:'no page was returned'});return;}
  try{const url=new URL(page.url());if(url.origin!==origin||!url.pathname.startsWith('/plan'))throw Error('terminal page outside synthetic scope');
   const value=await page.evaluate(()=>({body:(document.body?.innerText??'').slice(0,120000),counts:{loading:document.querySelectorAll('[data-tone="loading"]').length,paused:document.querySelectorAll('[data-care-state="paused"]').length,notice:[...document.querySelectorAll('[data-tone]')].filter(e=>e.textContent?.includes('instructions and reported use need review')).length,dialogs:document.querySelectorAll('[role="dialog"]').length}}));
   state.pageAvailable=true;const body=String(value.body??'').slice(0,maxBody),redacted=sensitive.test(body);state.body=body.split('\n').map(line=>sensitive.test(line)?'[redacted sensitive line]':line).join('\n');state.counts=Object.fromEntries(['loading','paused','notice','dialogs'].map(key=>[key,Number.isSafeInteger(value.counts?.[key])?Math.max(0,Math.min(value.counts[key],10000)):null]));
   emit({event:'terminal-dom',counts:state.counts,bodyCharacters:state.body.length});
   if(redacted){state.captureErrors.push({name:'SensitiveBodyRedacted',message:'PNG omitted because visible text needed redaction'});return;}
   const bytes=await page.screenshot({type:'png',fullPage:false});if(bytes.length<=2000000&&bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))){png=bytes;emit({event:'terminal-png',bytes:bytes.length,sha256:hash(bytes)});}else throw Error('diagnostics screenshot rejected by format/size bound');
  }catch(e){state.captureErrors.push(boundedError(e));}
 }
 function routeCall(call){if(!['/api/client/reviews','/api/client/care'].includes(call.path)||!actions.has(call.command?.action)||typeof call.wire!=='string'||Buffer.byteLength(call.wire)>500000)return;try{if(JSON.parse(call.wire)?.action!==call.command.action)return;}catch{return;}emit({event:'route-call',route:call.path,action:call.command.action,bytes:Buffer.byteLength(call.wire),wireHash:hash(call.wire)});}
 function served(name,bytes){if(!outputName(name)||source.served.length>=32)return;const expected=prepared.get(name);if(!expected||bytes.length>12000000)return;const sha256=hash(bytes);source.served.push({name,bytes:bytes.length,sha256,matchesPrepared:expected.reference===bytes&&expected.sha256===sha256});}
 function normalClose(failure){closed=true;if(failure){state.outcome='fail';error('teardown',failure);}}
 async function persist(){
  if(persisted)return persisted;
  persisted=(async()=>{await Promise.allSettled([...pending]);if(closed)emit({event:'normal-closure'});listeners.splice(0).forEach(stop=>stop());
   const target=await trustedDirectory(directory),members={'state.json':JSON.stringify(state,null,2)+'\n','trace.json':JSON.stringify({schemaVersion:1,dropped,events},null,2)+'\n','source.json':JSON.stringify(source,null,2)+'\n'};
   if(png)members['page.png']=png;
   for(const [name,value] of Object.entries(members)){const bytes=Buffer.isBuffer(value)?value:Buffer.from(value);if(bytes.length>2000000)throw Error('diagnostic artifact exceeds readable limit');if(await fs.realpath(target)!==target)throw Error('diagnostics case symlink rejected');const handle=await fs.open(path.join(target,name),constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);try{await handle.writeFile(bytes);}finally{await handle.close();}}
   return{directory:target,files:Object.keys(members)};
  })();return persisted;
 }
 return{attach,prepared:preparedSource,served,routeCall,captureTerminal,closed:normalClose,persist,error};
}
