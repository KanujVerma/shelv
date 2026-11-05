import {createHash,randomUUID} from 'node:crypto';
import {readFile,realpath,lstat,open} from 'node:fs/promises';
import {resolve,join,sep,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {NativeLifetime} from './native-lifetime.mjs';
import {pageObserver} from './page-observer.mjs';

const ROOT='/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030';
const ROOT_ABI='apps/portal/tests/genuine/client-history.browser.mjs';
const ROOT_HASH='f1c9fd837d1388cf33525cf5fe4798dd0fa79de27cac1959285386689ffd5599';
const ENCODING='PostgreSQL jsonb::text / UTF-8';
const LABELS=['baseline','retired','released','cleaned'];
const COUNTS=['cases','publications','planDocuments','publicationReceipts','planEvents','entitlements','planRequests','reviewRequests','legacyRequests','careRequests','careEvents'];
const SCHEDULES=['b-positive','wrong-owner','extra-selector','ended-read','leave-late-bytes','logout-late-bytes','leave-late-consumer','logout-late-consumer'];
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const HASH=/^[0-9a-f]{64}$/;
const result=()=>({kind:'OBSERVATIONS_ONLY',observations:[],errors:[],pending:[]});
const digest=value=>createHash('sha256').update(value).digest('hex');
const need=(ok,message)=>{if(!ok)throw new TypeError(message);};
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const safeInt=v=>Number.isSafeInteger(v)&&v>=0;
function keys(v,names,label){need(record(v)&&Object.keys(v).sort().join('|')===[...names].sort().join('|'),label+': exact schema required');}
function failure(out,phase,error){out.errors.push({phase,name:error?.name??'Error',message:String(error?.message??error)});}
function stable(v){return Array.isArray(v)?'['+v.map(stable).join(',')+']':record(v)?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}':JSON.stringify(v);}
function requireLink(p,r,actor,originalSessions=[]){need(p.requestLinks.some(q=>q.actor===actor&&q.requestBodySha256===r.bodySha256&&q.csrfSha256===r.csrfSha256&&q.sessionCookieSha256===r.sessionCookieSha256&&[...p.authSessions,...originalSessions].some(s=>s.actor===actor&&s.sessionId===q.authSessionId)),'actual request/issued Auth session proof missing');}
function envelope(value,label){keys(value,['observations','errors'],label);need(Array.isArray(value.observations)&&value.observations.length>0&&Array.isArray(value.errors),label+': nonempty observations/errors required');const inspect=v=>{if(!v||typeof v!=='object')return;for(const [k,x]of Object.entries(v)){need(!/^(csrf|cookie|authorization|password|accessToken|refreshToken)$/i.test(k),label+': raw credential field refused');inspect(x);}};inspect(value);return value;}
const headerDigest=headers=>digest(JSON.stringify(headers.map(h=>[h.name.toLowerCase(),h.value]).sort((a,b)=>a[0].localeCompare(b[0]))));
async function deadline(promise,label,ms,out){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>{out.pending.push('unjoined caller/native operation: '+label);reject(new Error(label+': deadline exceeded'));},ms);})]);}finally{clearTimeout(timer);}}
async function rootAbi(){const path=join(ROOT,ROOT_ABI);need(digest(await readFile(path))===ROOT_HASH,'frozen Root M05 ABI bytes changed');return import(pathToFileURL(path).href);}
async function inputs(input){
  need(record(input),'input/descriptor required');
  const {validateHistoryInputs}=await rootAbi();const {descriptor,historyScenario}=validateHistoryInputs(input);
  keys(input,['page','descriptor','historyScenario','actor','schedule','outputDirectory','helpers',...(Object.hasOwn(input,'timeoutMs')?['timeoutMs']:[])],'negative input');
  need(['a','b'].includes(input.actor)&&SCHEDULES.includes(input.schedule),'actor/schedule required');
  need(input.schedule!=='b-positive'||input.actor==='b','B positive control requires actor b');
  if(input.schedule!=='b-positive')need(historyScenario.publications[input.actor]!==null,'actual actor publication pending M04');
  const timeoutMs=input.timeoutMs??15000;need(Number.isSafeInteger(timeoutMs)&&timeoutMs>0&&timeoutMs<=60000,'bounded timeout required');
  for(const name of ['on','off','goto','url','getByRole','getByText','locator','waitForURL','waitForFunction','evaluate','route','unroute'])need(typeof input.page?.[name]==='function','caller page.'+name+' required');
  keys(input.helpers,['captureCanonical','privateScan','capture','relogin'],'helpers');need(Object.values(input.helpers).every(v=>typeof v==='function'),'actual observation helpers required');
  const out=input.outputDirectory,priv=descriptor.privateDirectory;
  need(typeof out==='string'&&isAbsolute(out)&&resolve(out)===out&&out.startsWith(priv+sep),'private output directory required');
  // Descriptor validation above must precede all filesystem writes or acquisitions.
  for(const p of [descriptor.fixtureDirectory,priv,out])need(await realpath(p)===p,'canonical private output path required');
  const privateStat=await lstat(priv),outStat=await lstat(out);
  need(privateStat.isDirectory()&&outStat.isDirectory()&&!privateStat.isSymbolicLink()&&!outStat.isSymbolicLink()&&(privateStat.mode&0o077)===0&&(outStat.mode&0o077)===0,'private directories must be real mode0700');
  return {...input,descriptor,historyScenario,timeoutMs};
}
export async function validateNegativeInputs(input){
  const out=result();try{const x=await inputs(input);out.observations.push({actor:x.actor,schedule:x.schedule,sourcePin:ROOT_HASH,descriptorShapeOnly:true});}
  catch(error){failure(out,'validation',error);out.pending.push('actual M04 identities, caller Page/helpers, private output and Parent execution packet');}return out;
}
function packet(text,label){
  need(typeof text==='string'&&Buffer.byteLength(text,'utf8')<=1048576,'canonical callback must return raw JSON TEXT <=1MiB');
  need(LABELS.includes(label),'unknown checkpoint label');const p=JSON.parse(text);
  keys(p,['schemaVersion','label','actors','history','noEffects','authSessions','probeRequests','requestLinks'],'checkpoint');
  need(p.schemaVersion===1&&p.label===label,'checkpoint schema/label mismatch');keys(p.actors,['a','b'],'checkpoint actors');need(UUID.test(p.actors.a)&&UUID.test(p.actors.b)&&p.actors.a!==p.actors.b,'distinct actual actor IDs required');
  keys(p.noEffects,['encoding','counts','sha256'],'noEffects');need(p.noEffects.encoding===ENCODING&&HASH.test(p.noEffects.sha256),'server no-effects hash/encoding required');keys(p.noEffects.counts,COUNTS,'noEffects counts');need(Object.values(p.noEffects.counts).every(safeInt),'actual no-effects row counts required');
  keys(p.history,['schemaVersion','encoding','actors','heads','rows'],'history');need(p.history.schemaVersion===1&&p.history.encoding===ENCODING,'actual history encoding required');keys(p.history.actors,['a','b'],'history actors');keys(p.history.heads,['a','b'],'history heads');
  for(const a of ['a','b'])need(p.history.actors[a]===p.actors[a]&&safeInt(p.history.heads[a]),'history actor/head binding');need(Array.isArray(p.history.rows),'history rows required');const seen=new Set();
  for(const r of p.history.rows){
    keys(r,['actor','clientId','version','present','documentSchemaVersion','publicationReceiptId','notificationEventId','snapshotText','snapshotSha256','documentText','documentSha256'],'history row');need(['a','b'].includes(r.actor)&&r.clientId===p.actors[r.actor]&&Number.isSafeInteger(r.version)&&r.version>0&&typeof r.present==='boolean','history identity required');
    const k=r.actor+':'+r.version;need(!seen.has(k),'duplicate history row');seen.add(k);
    if(r.present){need(r.documentSchemaVersion===3&&UUID.test(r.publicationReceiptId)&&UUID.test(r.notificationEventId),'actual M04 history identity required');for(const prefix of ['snapshot','document'])need(typeof r[prefix+'Text']==='string'&&digest(r[prefix+'Text'])===r[prefix+'Sha256'],'actual server '+prefix+' UTF8 hash mismatch');}
    else need(['documentSchemaVersion','publicationReceiptId','notificationEventId','snapshotText','snapshotSha256','documentText','documentSha256'].every(k=>r[k]===null),'absent history row contains data');
  }
  need(Array.isArray(p.authSessions)&&Array.isArray(p.probeRequests)&&Array.isArray(p.requestLinks),'actual session/probe/link observations required');
  for(const s of p.authSessions){keys(s,['actor','userId','sessionId','notAfter'],'auth session');need(['a','b'].includes(s.actor)&&s.userId===p.actors[s.actor]&&UUID.test(s.sessionId)&&(s.notAfter===null||typeof s.notAfter==='string'&&Number.isFinite(Date.parse(s.notAfter))),'actual Auth session binding required');}
  need(p.probeRequests.length===1,'one actual rejected-probe UUID observation required');
  for(const q of p.probeRequests){keys(q,['requestId','count'],'probe request');need(UUID.test(q.requestId)&&safeInt(q.count),'actual probe count required');}
  for(const q of p.requestLinks){keys(q,['actor','authSessionId','requestBodySha256','csrfSha256','sessionCookieSha256','proofSha256'],'request link');need(['a','b'].includes(q.actor)&&UUID.test(q.authSessionId)&&['requestBodySha256','csrfSha256','sessionCookieSha256','proofSha256'].every(k=>HASH.test(q[k])),'actual request/session digest link required');}
  return p;
}
export function parseCheckpointText(text,label){const out=result();try{out.observations.push({label,rawText:text,rawSha256:digest(text),value:packet(text,label)});}catch(error){failure(out,'checkpoint:'+label,error);out.pending.push('actual raw canonical checkpoint');}return out;}
export function checkNoEffects(checkpoints){
  const out=result();try{
    need(Array.isArray(checkpoints)&&checkpoints.length===4,'four exact raw checkpoints required');const parsed=checkpoints.map((text,i)=>packet(text,LABELS[i])),first=parsed[0];
  for(const p of parsed){need(p.actors.a===first.actors.a&&p.actors.b===first.actors.b,'checkpoint actors changed');need(COUNTS.every(k=>p.noEffects.counts[k]===first.noEffects.counts[k])&&p.noEffects.sha256===first.noEffects.sha256,'canonical no-effects counts/hash changed');need(p.history.heads.a===first.history.heads.a&&p.history.heads.b===first.history.heads.b,'history heads changed');for(const q of p.probeRequests)need(q.requestId===first.probeRequests[0].requestId&&q.count===0,'rejected probe has a changed UUID/durable request row');
      for(const row of first.history.rows){const now=p.history.rows.find(r=>r.actor===row.actor&&r.version===row.version);need(now&&now.present===row.present&&now.snapshotText===row.snapshotText&&now.snapshotSha256===row.snapshotSha256&&now.documentText===row.documentText&&now.documentSha256===row.documentSha256,'immutable history bytes changed');}
    }out.observations.push({labels:LABELS,domainSha256:first.noEffects.sha256,scope:'observed history/domain counts and hashes only; Auth logout effects separate'});
  }catch(error){failure(out,'no-effects',error);out.pending.push('four actual consistent read-only SQL checkpoints');}return out;
}
export async function runHistoryNegativeSchedule(input){
  const out=result();out.pending.push('independent source/resource/genuine review; no acceptance from these observations');
  let x,browser,files,trace,checkpointHandles={},checkpoints=[],key,nonce,routeHeld=false,releaseBytes=()=>{},wrapperOwned=false,stage='validation',snap=null,routeWork=null,routeCapture=null,selectedRouteRequest=null,routeFulfilled=false,harnessAbort=false,eventOrder=0,nodeOrdinal=0,retiredOrder=null;
  const requests=new WeakMap(),requestTasks=new WeakMap(),wire=[],bodies=[],sessions=[],callbacks=[],probeId=randomUUID(),scheduleId=randomUUID();
  const pushError=(phase,error)=>failure(out,phase,error);
  try{
    x=await deadline(inputs(input),'input validation',15000,out);const {page,descriptor,historyScenario,actor,schedule,timeoutMs,helpers}=x,origin=new URL(descriptor.endpoints.portal).origin;
    out.scheduleId=scheduleId;out.actor=actor;out.schedule=schedule;out.rootSourceSha256=ROOT_HASH;
    browser=new NativeLifetime(timeoutMs);files=new NativeLifetime(timeoutMs);key='__m05_'+scheduleId.replaceAll('-','');nonce=randomUUID();
    trace=await deadline(files.acquire('digest trace',()=>open(join(x.outputDirectory,scheduleId+'.ndjson'),'wx',0o600),h=>h.close()),'digest trace acquisition',timeoutMs,out);files.assertLive();
    for(const label of LABELS){checkpointHandles[label]=await deadline(files.acquire('checkpoint file '+label,()=>open(join(x.outputDirectory,scheduleId+'-'+label+'.json'),'wx',0o600),h=>h.close()),'checkpoint file '+label,timeoutMs,out);files.assertLive();}
    let traceTail=Promise.resolve();
    const event=value=>{if(files.retired){out.pending.push('late event after trace lifetime');return;}traceTail=traceTail.then(()=>trace.write(JSON.stringify(value)+'\n'));files.watch('trace write',traceTail).catch(()=>{});};
    const follow=(label,p)=>{const w=browser.watch(label,p);callbacks.push(w);w.catch(()=>{});return w;};
    const ownListener=async(name,fn)=>{await deadline(browser.acquire('listener '+name,()=>{try{page.on(name,fn);return fn;}catch(error){try{page.off(name,fn);}catch(cleanup){pushError('partial listener cleanup',cleanup);}throw error;}},f=>page.off(name,f)),'listener '+name,timeoutMs,out);browser.assertLive();};
    const exactRequest=request=>new URL(request.url()).href===origin+'/api/client/reviews'&&request.method()==='POST';
    const sessionRequest=request=>new URL(request.url()).href===origin+'/api/client/session'&&request.method()==='GET';
    const requestListener=request=>{
      if(browser.retired)return;
      const atStage=stage;const task=follow('request observation',(async()=>{
        const isSession=sessionRequest(request);if(!exactRequest(request)&&!isSession)return;const bytes=isSession?null:request.postDataBuffer();need(isSession||bytes,'actual request bytes missing');const command=isSession?null:JSON.parse(bytes.toString('utf8'));
        const r={nativeRequest:request,nodeOccurrence:'node-request:'+String(++nodeOrdinal),requestOrder:++eventOrder,method:request.method(),path:new URL(request.url()).pathname,stage:atStage,body:bytes?.toString('utf8')??null,bodySha256:bytes?digest(bytes):null,command,isSession,csrfSha256:null,sessionCookieSha256:null,status:null,finished:false,failed:null,failedOrder:null};requests.set(request,r);if(!isSession)wire.push(r);
        const headers=await request.allHeaders();
        const matches=(headers.cookie??'').split(';').map(v=>v.trim()).filter(v=>v.startsWith('__Host-shelv_client='));need(matches.length<=1,'ambiguous actual session cookie');const cookie=matches[0]?.slice('__Host-shelv_client='.length)??null;
        r.csrfSha256=headers['x-shelv-csrf']?digest(headers['x-shelv-csrf']):null;r.sessionCookieSha256=cookie?digest(cookie):null;
        event({type:'request',nodeOccurrence:r.nodeOccurrence,requestOrder:r.requestOrder,method:r.method,path:r.path,stage:r.stage,body:r.body,bodySha256:r.bodySha256,csrfSha256:r.csrfSha256,sessionCookieSha256:r.sessionCookieSha256});
      })());requestTasks.set(request,task);
    };
    await ownListener('request',requestListener);
    await ownListener('response',response=>{
      if(browser.retired)return;follow('response body observation',(async()=>{
        const request=response.request();if(!exactRequest(request)&&!sessionRequest(request))return;need(requestTasks.has(request),'early request observation missing');await requestTasks.get(request);
        const r=requests.get(request);need(r,'original request observation missing');r.status=response.status();const bytes=await response.body();
        const headers=await response.headersArray();const observation={nodeOccurrence:r.nodeOccurrence,requestBodySha256:r.bodySha256,status:r.status,responseSha256:digest(bytes),headersSha256:headerDigest(headers),byteLength:bytes.length};
        if(r.isSession){const data=JSON.parse(bytes.toString('utf8'));const s={status:r.status,signedIn:data.signedIn,ownerId:data.ownerId??null,csrfSha256:typeof data.csrf==='string'?digest(data.csrf):null,sessionCookieSha256:r.sessionCookieSha256};sessions.push(s);event({type:'ordinary-session-observation',...s});return;}
        bodies.push({...observation,text:bytes.toString('utf8')});event({type:'response',...observation});
      })());
    });
    await ownListener('requestfinished',request=>{const r=requests.get(request);if(r){r.finished=true;event({type:'requestfinished',nodeOccurrence:r.nodeOccurrence,order:++eventOrder,requestBodySha256:r.bodySha256});}});
    await ownListener('requestfailed',request=>{const r=requests.get(request);if(r){r.failed=request.failure()?.errorText??'request failed';r.failedOrder=++eventOrder;event({type:'requestfailed',nodeOccurrence:r.nodeOccurrence,order:r.failedOrder,stage,requestBodySha256:r.bodySha256,error:r.failed});}});
    const control=op=>deadline(follow('page observer '+op.op,page.evaluate(pageObserver,{...op,key,nonce})),'page observer '+op.op,timeoutMs,out);
    const checkpoint=async label=>{
      const raw=await deadline(files.watch('canonical '+label,helpers.captureCanonical(label,{scheduleId,probeIds:[probeId],requests:wire.map(r=>({actor,nodeOccurrence:r.nodeOccurrence,method:r.method,path:r.path,requestOrder:r.requestOrder,requestBodySha256:r.bodySha256,csrfSha256:r.csrfSha256,sessionCookieSha256:r.sessionCookieSha256,status:r.status}))})),'canonical '+label,timeoutMs,out);files.assertLive();
      const parsed=parseCheckpointText(raw,label);need(parsed.errors.length===0,'canonical '+label+' refused: '+parsed.errors.map(e=>e.message).join(';'));
      const p=parsed.observations[0].value;need(p.actors.a===descriptor.actors.a.id&&p.actors.b===descriptor.actors.b.id,'checkpoint wrong actual actors');
      await files.watch('checkpoint write '+label,checkpointHandles[label].writeFile(raw,'utf8'));checkpoints.push(raw);out.observations.push({type:'checkpoint',label,rawSha256:digest(raw),value:p});return p;
    };
    // Retained on the local state solely so failure cleanup can still collect the
    // exact raw cleaned checkpoint, without borrowing another native lifetime.
    x.checkpoint=checkpoint;x.event=event;
    const scanCapture=async label=>{
      for(const helper of ['privateScan','capture']){const v=envelope(await deadline(files.watch(helper+' '+label,helpers[helper]({phase:label,page,descriptor,outputDirectory:x.outputDirectory})),helper+' '+label,timeoutMs,out),helper);out.observations.push({type:helper,phase:label,...v});need(v.errors.length===0,helper+' refused '+label);}
    };x.scanCapture=scanCapture;
    const refs=historyScenario.publications[actor],selected=refs?.older??null,current=refs?.current??null;
    stage='positive-history';await page.goto(origin+'/history',{waitUntil:'domcontentloaded',timeout:timeoutMs});
    if(refs){
      const older=page.getByRole('button',{name:`open plan version ${selected.version}`,exact:true}),latest=page.getByRole('button',{name:`open plan version ${current.version}`,exact:true});
      await page.locator('.history-timeline').waitFor({state:'visible',timeout:timeoutMs});
      for(let n=0;!await older.isVisible()||!await latest.isVisible();n++){
        need(n<100,'both-version pagination bound');const more=page.locator('#history-load-more');need(await more.isVisible(),'actual selected/current versions missing');await more.click({timeout:timeoutMs});await page.waitForFunction(()=>{const b=document.getElementById('history-load-more');return !b||!b.disabled;},undefined,{timeout:timeoutMs});
      }
    }else{
      need(actor==='b'&&schedule==='b-positive','missing actor publication');
      await page.waitForFunction(()=>{const t=document.querySelector('[data-history-screen="history"]')?.textContent??'';return t.includes('your plan is being prepared')||t.includes('record access denied');},undefined,{timeout:timeoutMs});
    }
    await browser.join('initial-read-join',[...callbacks]);need(browser.errors.length===0&&browser.pending.length===0,'initial actual read observations failed');
    const baseline=await checkpoint('baseline');
    const ownSession=sessions.findLast(s=>s.status===200&&s.signedIn===true&&s.ownerId===descriptor.actors[actor].id&&wire.some(r=>r.csrfSha256===s.csrfSha256&&r.sessionCookieSha256===s.sessionCookieSha256));need(ownSession,'actual ordinary session/issued own read digest correlation missing');out.observations.push({type:'ordinary-session-binding',...ownSession});
    const initialOwn=wire.findLast(r=>r.csrfSha256===ownSession.csrfSha256&&r.sessionCookieSha256===ownSession.sessionCookieSha256);requireLink(baseline,initialOwn,actor);
    if(refs){for(const ref of [selected,current])need(baseline.history.rows.some(r=>r.actor===actor&&r.version===ref.version&&r.present&&r.publicationReceiptId===ref.publicationReceiptId&&r.notificationEventId===ref.notificationEventId),'M04 canonical publication binding missing');}
    else{
      need(baseline.history.heads.b===0&&!baseline.history.rows.some(r=>r.actor==='b'&&r.present)&&baseline.history.rows.some(r=>r.actor==='b'&&!r.present&&r.version===historyScenario.publications.a.current.version),'B actual no-publication/selected-version absence control missing');
      const plan=bodies.find(b=>wire.some(r=>r.bodySha256===b.requestBodySha256&&r.command.action==='read_client_plan_v3'&&r.command.version===null)),history=bodies.find(b=>wire.some(r=>r.bodySha256===b.requestBodySha256&&r.command.action==='read_care_history_v1'&&r.command.version===null));need(plan,'actual B V3 read missing');
      if(plan.status===200&&history?.status===200){const v=JSON.parse(plan.text),h=JSON.parse(history.text);need(v.access==='preparation'&&v.plan===null&&h.audience==='client'&&!h.entries.some(e=>e.kind==='publication'),'B preparation/history read mismatch');await page.getByText('your plan is being prepared',{exact:true}).waitFor({state:'visible',timeout:timeoutMs});}
      else{need(plan.status===403||history?.status===403,'B unavailable control is neither canonical preparation nor genuine denial');await page.getByText('record access denied',{exact:true}).waitFor({state:'visible',timeout:timeoutMs});}
      const own=wire.findLast(r=>r.csrfSha256&&r.sessionCookieSha256&&r.command.action==='read_client_plan_v3');need(own,'B actual issued own request missing');requireLink(baseline,own,'b');
    }
    await scanCapture('baseline');
    if(schedule==='b-positive'){
      if(refs){await page.getByRole('button',{name:`open plan version ${current.version}`,exact:true}).click({timeout:timeoutMs});await page.locator('.plan-view').waitFor({state:'visible',timeout:timeoutMs});for(const m of current.markers)need(await page.getByText(m,{exact:true}).isVisible(),'B own published marker missing');await browser.join('B own read join',[...callbacks]);const row=baseline.history.rows.find(r=>r.actor==='b'&&r.version===current.version&&r.present),actual=bodies.findLast(b=>b.status===200&&wire.some(r=>r.bodySha256===b.requestBodySha256&&r.command.action==='read_client_plan_v3'&&r.command.version===current.version));need(actual&&row&&stable(JSON.parse(actual.text).plan?.content)===stable(JSON.parse(row.documentText)),'actual B wire/canonical immutable document mismatch');}
      for(const ref of Object.values(historyScenario.publications.a??{}))for(const m of ref.markers)need(!await page.getByText(m,{exact:true}).isVisible(),'A marker visible to B');
      const retired=await checkpoint('retired');const own=wire.findLast(r=>r.csrfSha256&&r.sessionCookieSha256&&r.command.action==='read_client_plan_v3');need(own,'B actual issued request missing');requireLink(retired,own,'b');await scanCapture('B-positive');await checkpoint('released');
    }else{
      const mode=schedule.includes('consumer')?'consumer':'bytes';
      await deadline(browser.acquire('page observer binding',()=>page.evaluate(pageObserver,{op:'install',key,nonce,origin,version:selected.version,mode}),async()=>{const v=await control({op:'restore'});out.observations.push({type:'page-observer-cleanup',...v});need(v.errors.length===0,'page observer restore refused');}),'page observer acquisition',timeoutMs,out);browser.assertLive();wrapperOwned=true;
      let held=null;
      if(schedule.includes('late')&&mode==='bytes'){
        let heldResolve,heldReject;held=new Promise((resolve,reject)=>{heldResolve=resolve;heldReject=reject;});held.catch(()=>{});
        const gate=new Promise(resolve=>{releaseBytes=resolve;});
        const handler=route=>{
          const request=route.request();let selectedRead=false;
          try{const c=JSON.parse(request.postDataBuffer()?.toString('utf8')??'null');selectedRead=c?.schemaVersion===1&&c.action==='read_client_plan_v3'&&c.version===selected.version;}catch{}
          if(!selectedRead||browser.retired)return follow('route fallback',route.fallback());
          routeWork=follow('held byte route',(async()=>{
            selectedRouteRequest=request;
            const upstream=await deadline(browser.acquire('raw upstream response',()=>route.fetch({maxRedirects:0,maxRetries:0,timeout:timeoutMs}),response=>response.dispose()),'raw upstream acquisition',timeoutMs,out);browser.assertLive();
            const body=await follow('upstream original body',upstream.body()),headers=await upstream.headersArray();
            routeCapture={requestBodySha256:digest(request.postDataBuffer()),status:upstream.status(),responseSha256:digest(body),headersSha256:headerDigest(headers),byteLength:body.length};event({type:'original-byte-capture',...routeCapture});
            if(routeCapture.status!==200){await route.fulfill({response:upstream});routeFulfilled=true;throw new Error('actual original selected read denied/unavailable');}
            routeHeld=true;heldResolve();await gate;routeHeld=false;
            await follow('actual route fulfill',route.fulfill({response:upstream}));routeFulfilled=true;event({type:'route-fulfill-accepted',...routeCapture});
          })().catch(async error=>{heldReject(error);pushError('byte-route',error);if(!routeFulfilled){harnessAbort=true;try{await route.abort('failed');}catch(abortError){pushError('own-route-abort',abortError);}}}));return routeWork;
        };
        await deadline(browser.acquire('own exact review route',()=>page.route(origin+'/api/client/reviews',handler),()=>page.unroute(origin+'/api/client/reviews',handler)),'exact route acquisition',timeoutMs,out);browser.assertLive();
      }
      // Acquire a fresh real ordinary own read through the actual UI, so CSRF is
      // captured by the page closure rather than read from injected state.
      stage='issued-own-read';await page.getByRole('button',{name:`open plan version ${selected.version}`,exact:true}).click({timeout:timeoutMs});
      if(schedule.includes('late')){
        if(mode==='bytes')await deadline(held,'actual original byte acquisition',timeoutMs,out);
        else await page.waitForFunction(async({key})=>{const s=await window[key]?.control({op:'snapshot'});return s?.holding===true;},{key},{timeout:timeoutMs});
      }else await page.locator('.plan-view').waitFor({state:'visible',timeout:timeoutMs});
      snap=await control({op:'snapshot'});need(snap.errors.length===0&&snap.original?.csrfSha256,'original issued own request/CSRF missing');
      const matches=wire.filter(r=>r.stage==='issued-own-read'&&r.method===snap.original.method&&r.path===snap.original.path&&r.bodySha256===snap.original.bodySha256&&r.csrfSha256===snap.original.csrfSha256&&r.sessionCookieSha256);need(matches.length===1,'missing or ambiguous identical selected actual Request occurrence');const original=matches[0],targetHash=original.bodySha256,targetFlight=snap.original.localFlightLabel;
      need(typeof targetFlight==='string','actual selected native flight label missing');if(routeCapture)need(selectedRouteRequest===original.nativeRequest,'held route is not the selected actual Request reference');
      need(baseline.authSessions.some(s=>s.actor===actor),'actual named Auth session observation missing');
      const linkOriginal=p=>requireLink(p,original,actor,baseline.authSessions);
      if(schedule==='wrong-owner'||schedule==='extra-selector'){
        const command=JSON.parse(snap.original.body),other=descriptor.actors[actor==='a'?'b':'a'].id;
        const probe=schedule==='wrong-owner'?{...command,clientId:other}:{...command,ownerId:other,requestId:probeId};const body=JSON.stringify(probe);stage=schedule;
        const denial=await control({op:'probe',body});need([400,403].includes(denial.status)&&denial.csrfSha256===original.csrfSha256&&denial.bodySha256===digest(body),'actual selector denial/original CSRF mismatch');out.observations.push({type:'selector-denial',...denial,probeId:schedule==='extra-selector'?probeId:null,layer:'closed-command selector; not an RLS claim'});
        const retired=await checkpoint('retired');linkOriginal(retired);need(retired.probeRequests.some(q=>q.requestId===probeId&&q.count===0),'actual rejected UUID absence missing');await scanCapture('selector-denied');await checkpoint('released');
      }else{
        stage='retire';
        if(schedule.startsWith('leave-')){await page.getByRole('link',{name:'account',exact:true}).click({timeout:timeoutMs});await page.waitForURL(origin+'/account',{timeout:timeoutMs});}
        else{await page.getByRole('button',{name:'sign out',exact:true}).click({timeout:timeoutMs});await page.getByRole('heading',{name:'sign in',exact:true}).waitFor({state:'visible',timeout:timeoutMs});}
        need(await page.locator('.plan-view').count()===0,'private historical plan survived retirement');retiredOrder=++eventOrder;stage='retired';const retired=await checkpoint('retired');linkOriginal(retired);await scanCapture('retired');
        if(schedule==='ended-read'){
          stage='ended-read';const denial=await control({op:'probe'});need(denial.status===401&&denial.csrfSha256===original.csrfSha256&&denial.bodySha256===original.bodySha256,'ended read needs actual401 with original nonempty CSRF');out.observations.push({type:'ended-read',...denial});
        }else{
          stage='released';releaseBytes();if(routeWork)await deadline(routeWork,'held route join',timeoutMs,out);
          await control({op:'release'});await page.waitForFunction(async({key})=>{const s=await window[key]?.control({op:'snapshot'});return s&&s.pendingNative===0;},{key},{timeout:timeoutMs});snap=await control({op:'snapshot'});
          need(snap.errors.length===0,'consumer observation failed');need(wire.filter(r=>r.stage==='issued-own-read'&&r.method===original.method&&r.path===original.path&&r.bodySha256===targetHash).length===1,'late identical Request occurrence is ambiguous');
          const jsonCalls=snap.records.filter(r=>r.type==='native-json-call'&&r.localFlightLabel===targetFlight&&r.requestSha256===targetHash);need(jsonCalls.length<=1,'multiple selected native Response.json promise occurrences');const targetJson=jsonCalls[0]?.localJsonLabel??null;
          if(mode==='consumer'){const holds=snap.records.filter(r=>r.type==='consumer-held'&&r.localFlightLabel===targetFlight&&r.localJsonLabel===targetJson&&r.requestSha256===targetHash);need(holds.length===1,'exact held native Response.json promise missing');}
          const returned=snap.records.some(r=>r.type==='json-value-returned'&&r.localFlightLabel===targetFlight&&r.localJsonLabel===targetJson&&r.requestSha256===targetHash),cancelled=original.failed!==null&&original.failedOrder>retiredOrder&&/ERR_ABORTED|NS_BINDING_ABORTED|AbortError/.test(original.failed);
          out.observations.push({type:'late-result',mode,nodeOccurrence:original.nodeOccurrence,localFlightLabel:targetFlight,localJsonLabel:targetJson,labelsAreNotWireOrAuthUUIDs:true,routeFulfillAccepted:routeFulfilled,nativeJsonValueReturned:returned,naturalCancellation:cancelled&&!harnessAbort,selectedFailure:original.failed,selectedFailureOrder:original.failedOrder,retiredOrder,harnessAbort,records:snap.records});
          if(mode==='bytes'&&returned){const delivered=bodies.find(b=>b.nodeOccurrence===original.nodeOccurrence&&b.requestBodySha256===routeCapture.requestBodySha256&&b.responseSha256===routeCapture.responseSha256&&b.status===routeCapture.status&&b.headersSha256===routeCapture.headersSha256);need(delivered&&original.finished&&!original.failed,'actual original byte/status/header delivery correlation missing');}
          if(!returned){out.pending.push('natural cancellation is not delivered old bytes/result');need(cancelled&&!harnessAbort,'no actual consumer return or natural cancellation observation');}
        }
        need(await page.locator('.plan-view').count()===0,'late result revived private historical plan');await scanCapture('released');await checkpoint('released');
      }
    }
  }catch(error){pushError(stage,error);out.pending.push('failed/uncertain schedule; Parent retains context-close obligation');}
  finally{
    stage='cleanup';
    try{releaseBytes();}catch(error){pushError('release-cleanup',error);}
    if(wrapperOwned&&x)try{await deadline(x.page.evaluate(pageObserver,{op:'release',key,nonce}),'release-page-observer',x.timeoutMs,out);}catch(error){pushError('release-page-observer',error);}
    if(browser){const closed=await browser.close();out.observations.push({type:'native-cleanup',...closed});for(const e of closed.errors)pushError(e.label,new Error(e.message));out.pending.push(...closed.pending);}
    if(x?.checkpoint&&checkpoints.length===3)try{await x.checkpoint('cleaned');}catch(error){pushError('cleaned-checkpoint',error);}
    if(checkpoints.length===4){const compared=checkNoEffects(checkpoints);out.observations.push(...compared.observations);out.errors.push(...compared.errors);out.pending.push(...compared.pending);}else out.pending.push('four exact raw checkpoints incomplete');
    if(files){const closed=await files.close();out.observations.push({type:'file-cleanup',...closed});for(const e of closed.errors)pushError(e.label,new Error(e.message));out.pending.push(...closed.pending);}
    if(x&&['ended-read','logout-late-bytes','logout-late-consumer'].includes(x.schedule))try{const v=envelope(await deadline(x.helpers.relogin({page:x.page,descriptor:x.descriptor,actor:x.actor}),'ordinary UI relogin',x.timeoutMs,out),'ordinary UI relogin');out.observations.push({type:'ordinary-relogin',...v});need(v.errors.length===0,'ordinary UI relogin failed');}catch(error){pushError('ordinary-relogin',error);out.pending.push('caller ordinary UI recovery incomplete');}
  }return out;
}
