import {createHash} from 'node:crypto';
import {isAbsolute} from 'node:path';

// No SDK, launcher, authentication, interception, database connection, or import effects.
// Input validation and caller observations establish neither custody nor acceptance.
const SQL_ENCODING='PostgreSQL jsonb::text / UTF-8';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const sha=value=>createHash('sha256').update(value,'utf8').digest('hex');
const result=()=>({kind:'OBSERVATIONS_ONLY',observations:[],errors:[],pending:[]});
const need=(condition,message)=>{if(!condition)throw new TypeError(message);};
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const text=v=>typeof v==='string'&&v.length>0;
const positive=v=>Number.isSafeInteger(v)&&v>0;
const revision=v=>Number.isSafeInteger(v)&&v>=0;
function keys(value,expected,label){need(object(value)&&Object.keys(value).sort().join('|')===[...expected].sort().join('|'),`${label}: exact fields required`);}
function endpoint(value,protocol,label){
  need(text(value),`${label}: endpoint required`);const u=new URL(value);
  need(u.protocol===protocol&&u.hostname==='127.0.0.1'&&u.port!==''&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==='/',`${label}: literal local endpoint with port required`);
}
function stable(value){
  if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
  if(object(value))return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
function publication(p,label){
  keys(p,['version','publicationReceiptId','notificationEventId','documentSchemaVersion','markers'],label);
  need(positive(p.version)&&p.documentSchemaVersion===3&&uuid.test(p.publicationReceiptId)&&uuid.test(p.notificationEventId),`${label}: actual M04 version/receipt/event identities required`);
  need(Array.isArray(p.markers)&&p.markers.length>0&&p.markers.length<=20&&p.markers.every(m=>text(m)&&m.length<=1000)&&new Set(p.markers).size===p.markers.length,`${label}: distinct rendered public markers required`);
}

/** Parent-forwarded exact public v1. Shape checking is not a resource grant. */
export function validateHistoryInputs({descriptor,historyScenario}={}){
  keys(descriptor,['schemaVersion','ownerId','projectId','fixtureDirectory','sourceCommit','endpoints','actors','privateDirectory','fingerprints'],'descriptor');
  need(descriptor.schemaVersion===1&&uuid.test(descriptor.ownerId)&&/^[0-9a-f]{40}$/.test(descriptor.sourceCommit)&&text(descriptor.projectId),'descriptor: identity required');
  for(const k of ['fixtureDirectory','privateDirectory'])need(text(descriptor[k])&&isAbsolute(descriptor[k]),`descriptor.${k}: absolute path required`);
  keys(descriptor.endpoints,['portal','supabase','mailpit'],'descriptor.endpoints');
  endpoint(descriptor.endpoints.portal,'https:','portal');endpoint(descriptor.endpoints.supabase,'https:','supabase');endpoint(descriptor.endpoints.mailpit,'http:','mailpit');
  keys(descriptor.actors,['a','b'],'descriptor.actors');
  for(const k of ['a','b']){const a=descriptor.actors[k];keys(a,['id','email','initialDisplayName'],`descriptor.actors.${k}`);need(uuid.test(a.id)&&/^[^\s@]+@[^\s@]+\.invalid$/.test(a.email)&&text(a.initialDisplayName),'descriptor: synthetic actor required');}
  need(descriptor.actors.a.id!==descriptor.actors.b.id&&descriptor.actors.a.email!==descriptor.actors.b.email,'descriptor: distinct actors required');
  keys(descriptor.fingerprints,['source','config','images','processes','resources'],'descriptor.fingerprints');need(Object.values(descriptor.fingerprints).every(text),'descriptor: fingerprint references required');
  keys(historyScenario,['schemaVersion','publicationMilestoneId','actor','publications','newPublication','invalidVersions'],'historyScenario');
  need(historyScenario.schemaVersion===1&&historyScenario.publicationMilestoneId==='M04'&&['a','b'].includes(historyScenario.actor),'historyScenario: M04 actor required');
  keys(historyScenario.publications,['a','b'],'historyScenario.publications');
  for(const k of ['a','b']){
    const p=historyScenario.publications[k];if(p===null)continue;
    keys(p,['older','current'],`publications.${k}`);publication(p.older,'older');publication(p.current,'current');need(p.older.version<=p.current.version,'publication version order');
    if(p.older.version===p.current.version)need(stable(p.older)===stable(p.current),'same version must identify same publication');
  }
  if(historyScenario.publications.a&&historyScenario.publications.b){
    const a=new Set(Object.values(historyScenario.publications.a).flatMap(p=>p.markers));
    need(Object.values(historyScenario.publications.b).every(p=>p.markers.every(m=>!a.has(m))),'cross-actor observation markers must be distinct');
  }
  const selected=historyScenario.publications[historyScenario.actor];need(selected!==null,'historyScenario: selected actor publication is pending M04');
  if(historyScenario.newPublication!==null){publication(historyScenario.newPublication,'newPublication');need(historyScenario.newPublication.version>selected.current.version,'newPublication must be newer');}
  const invalid=historyScenario.invalidVersions;
  need(Array.isArray(invalid)&&invalid.length>0&&invalid.length<=10&&invalid.every(v=>positive(v)&&v<=2147483647)&&new Set(invalid).size===invalid.length,'invalidVersions: positive PostgreSQL integer candidates required; oracle absence still required');
  need(invalid.every(v=>![selected.older.version,selected.current.version,historyScenario.newPublication?.version].includes(v)),'invalidVersions includes known publication');
  return structuredClone({descriptor,historyScenario});
}
function errorAt(out,phase,error){out.errors.push({phase,name:error?.name??'Error',message:String(error?.message??error)});}
async function bounded(promise,label,timeoutMs,out){
  let timer;
  try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>{
    out.pending.push(`unjoined caller observation: ${label}`);reject(new Error(`${label}: observation deadline exceeded; caller operation remains unjoined`));
  },timeoutMs);})]);}finally{clearTimeout(timer);}
}
function envelope(v,label){keys(v,['observations','errors'],label);need(Array.isArray(v.observations)&&Array.isArray(v.errors),`${label}: observations/errors arrays required`);return v;}
function readCommand(command){
  need(command?.schemaVersion===1,'read: schemaVersion required');
  const fields={read_client_plan_v3:['version'],read_care_history_v1:['version','cursor','limit'],read_client_instruction_manifest_v1:['snapshot','cursor','limit'],read_client_instruction_v1:['snapshot','instructionId','version','contentHash']}[command.action];
  need(fields,'unexpected history operation');keys(command,['schemaVersion','action',...fields],'read command');
  if(['read_client_plan_v3','read_care_history_v1'].includes(command.action))need(command.version===null||positive(command.version),'read: invalid version');
  return command;
}
function checkOracle(p,descriptor){
  keys(p,['schemaVersion','encoding','actors','heads','rows'],'oracle');need(p.schemaVersion===1&&p.encoding===SQL_ENCODING,'oracle: server encoding required');
  keys(p.actors,['a','b'],'oracle actors');keys(p.heads,['a','b'],'oracle heads');
  for(const k of ['a','b'])need(p.actors[k]===descriptor.actors[k].id&&revision(p.heads[k]),'oracle: actual actor/head binding required');
  need(Array.isArray(p.rows)&&p.rows.length>0,'oracle: rows required');const seen=new Set();
  for(const r of p.rows){
    keys(r,['actor','clientId','version','present','documentSchemaVersion','publicationReceiptId','notificationEventId','snapshotText','snapshotSha256','documentText','documentSha256'],'oracle row');
    need(['a','b'].includes(r.actor)&&r.clientId===descriptor.actors[r.actor].id&&positive(r.version),'oracle: wrong owner/version');const key=r.actor+':'+r.version;need(!seen.has(key),'oracle: duplicate row');seen.add(key);
    need(typeof r.present==='boolean','oracle: presence required');
    if(!r.present){need(['documentSchemaVersion','publicationReceiptId','notificationEventId','snapshotText','snapshotSha256','documentText','documentSha256'].every(k=>r[k]===null),'oracle: absent row has content');continue;}
    need(r.version<=p.heads[r.actor]&&r.documentSchemaVersion===3&&uuid.test(r.publicationReceiptId)&&uuid.test(r.notificationEventId),'oracle: incomplete canonical publication');
    for(const prefix of ['snapshot','document'])need(text(r[prefix+'Text'])&&sha(r[prefix+'Text'])===r[prefix+'Sha256'],`oracle: ${prefix} UTF-8 hash mismatch`);
    const snapshot=JSON.parse(r.snapshotText),document=JSON.parse(r.documentText);
    need(snapshot.publication?.client_id===r.clientId&&snapshot.publication.version===r.version&&snapshot.document?.client_id===r.clientId&&snapshot.document.version===r.version&&snapshot.document.receipt_id===r.publicationReceiptId&&stable(snapshot.document.document)===stable(document),'oracle: snapshot row/content binding mismatch');
  }return p;
}
function bind(p,actor,ref){const row=p.rows.find(r=>r.actor===actor&&r.version===ref.version);need(row?.present&&row.publicationReceiptId===ref.publicationReceiptId&&row.notificationEventId===ref.notificationEventId&&row.documentSchemaVersion===ref.documentSchemaVersion,'oracle: M04 receipt/version/event mismatch');return row;}
function checkBrowser(b,p,descriptor,actor,selected,head,invalidVersions){
  need(b?.kind==='OBSERVATIONS_ONLY'&&Array.isArray(b.errors)&&b.errors.length===0,'browser: missing/failed observation');
  need(b.actor===actor&&b.sourceCommit===descriptor.sourceCommit&&b.actorId===p.actors[actor]&&Array.isArray(b.reads)&&Array.isArray(b.observations),'browser: actor/source binding required');
  const row=bind(p,actor,selected),doc=JSON.parse(row.documentText);
  for(const phase of ['select','refresh','deep-link']){
    const o=b.observations.find(o=>o.phase===phase);need(o&&o.errors.length===0,`browser: ${phase} phase missing/failed`);
    const canonical=checkOracle(o.canonical,descriptor),observed=bind(canonical,actor,selected);
    need(observed.snapshotText===row.snapshotText&&canonical.heads[actor]===head,`browser: ${phase} canonical bytes/head mismatch`);
    need(o.path==='/history/versions/'+selected.version&&o.markers.length===selected.markers.length&&o.markers.every((v,i)=>v.visible===true&&v.text===selected.markers[i]),`browser: ${phase} DOM binding mismatch`);
    const reads=b.reads.filter(r=>r.phase===phase&&r.command.action==='read_client_plan_v3'&&r.command.version===selected.version&&r.status===200);need(reads.length>0,`browser: ${phase} selected read missing`);
    for(const r of reads){need(sha(r.wireText)===r.wireSha256,'browser: wire hash mismatch');const body=JSON.parse(r.wireText);need(body.schemaVersion===3&&body.plan?.version===selected.version&&body.plan.documentSchemaVersion===3&&stable(body.plan.content)===stable(doc)&&body.currentGuidance?.snapshot.publication.version===selected.version&&body.currentGuidance.snapshot.currentPublication.version===head,'browser: immutable content/current head mismatch');}
  }
  for(const phase of ['list','back','native-back'])need(b.observations.some(o=>o.phase===phase&&o.path==='/history'&&o.errors.length===0),`browser: ${phase} missing/failed`);
  const listReads=b.reads.filter(r=>r.phase==='list'&&r.command.action==='read_care_history_v1'&&r.command.version===null&&r.status===200);
  need(listReads.length>0,'browser: actual own history list read missing');const versions=new Set();
  for(const r of listReads){need(sha(r.wireText)===r.wireSha256,'browser: history wire hash mismatch');const body=JSON.parse(r.wireText);need(body.audience==='client'&&body.version===null&&body.heads?.publicationVersion===head&&Array.isArray(body.entries)&&body.entries.every(e=>!['private_note','conversation','legacy_review_note'].includes(e.kind)),'browser: own public history/head mismatch');for(const e of body.entries)if(e.kind==='publication'&&e.publication?.documentSchemaVersion===3)versions.add(e.publication.version);}
  need(versions.has(selected.version)&&versions.has(head),'browser: selected/current versions missing from actual list');
  for(const v of [...invalidVersions,0,-1,'1.5','9007199254740992']){
    const phase='invalid:'+v,o=b.observations.find(o=>o.phase===phase);need(o&&o.errors.length===0&&o.path==='/history/versions/'+v&&o.privatePlanCount===0,`browser: ${phase} missing/failed`);
    if(positive(v)){const canonical=checkOracle(o.canonical,descriptor);need(p.rows.some(r=>r.actor===actor&&r.version===v&&!r.present)&&canonical.rows.some(r=>r.actor===actor&&r.version===v&&!r.present),'oracle: invalid positive version not proven absent');need(b.reads.some(r=>r.phase===phase&&r.command.action==='read_client_plan_v3'&&r.command.version===v&&[403,404].includes(r.status)),`browser: ${phase} genuine denial missing`);}
  }
}

/** Diagnostic comparison only. Raw server text is hashed; JS sorting below is
 * solely semantic comparison of browser content, never canonical SQL authority. */
export function compareHistoryObservations(input={}){
  const out=result();out.pending.push('Parent-reviewed owner/session/delayed-byte schedules','independent genuine/visual/accessibility acceptance');
  try{
    let {descriptor,historyScenario,before,after}=input??{};
    ({descriptor,historyScenario}=validateHistoryInputs({descriptor,historyScenario}));const actor=historyScenario.actor,selected=historyScenario.publications[actor],first=checkOracle(before?.oracle,descriptor);
    need(first.heads[actor]===selected.current.version,'oracle: initial current head mismatch');
    for(const k of ['a','b']){const p=historyScenario.publications[k];if(p){bind(first,k,p.older);bind(first,k,p.current);}else out.pending.push(`${k}: own publication or verified unavailable positive control`);}
    for(const v of historyScenario.invalidVersions)need(first.rows.some(r=>r.actor===actor&&r.version===v&&!r.present),'oracle: invalid positive version not proven absent');
    need(!after||historyScenario.newPublication!==null,'after requires actual newer M04 publication');
    let next=null;
    if(historyScenario.newPublication&&after){
      next=checkOracle(after.oracle,descriptor);const newer=historyScenario.newPublication;need(next.heads[actor]===newer.version,'oracle: newer current head mismatch');bind(next,actor,newer);
      for(const old of first.rows.filter(r=>r.present)){const now=next.rows.find(r=>r.actor===old.actor&&r.version===old.version);need(now?.present&&now.publicationReceiptId===old.publicationReceiptId&&now.notificationEventId===old.notificationEventId&&now.snapshotText===old.snapshotText&&now.snapshotSha256===old.snapshotSha256&&now.documentText===old.documentText&&now.documentSha256===old.documentSha256,'oracle: immutable historical bytes changed');}
    }
    checkBrowser(before.browser,first,descriptor,actor,selected.older,selected.current.version,historyScenario.invalidVersions);
    out.observations.push({phase:'before',actor,olderVersion:selected.older.version,currentHead:first.heads[actor],immutableSnapshotSha256:bind(first,actor,selected.older).snapshotSha256});
    if(next){checkBrowser(after.browser,next,descriptor,actor,selected.older,historyScenario.newPublication.version,historyScenario.invalidVersions);out.observations.push({phase:'after-new-publication',actor,olderVersion:selected.older.version,currentHead:next.heads[actor],immutableSnapshotSha256:bind(next,actor,selected.older).snapshotSha256});}
    else out.pending.push('actual M04 newer publication and after observation');
  }catch(error){errorAt(out,'comparison',error);}return out;
}

/** A Parent execution packet is required separately. Caller owns an already
 * ordinarily UI-authenticated Page and all three real observation helpers. */
export async function observeClientHistory(input={}){
  const out={...result(),actor:null,actorId:null,sourceCommit:null,reads:[]};out.pending.push('Parent-reviewed owner/session/delayed-byte schedules');
  let page,descriptor,historyScenario,phase,helpers,timeoutMs,requestListener,responseListener,listening=false,stage='setup';const pending=new Set(),requestPhases=new WeakMap();
  try{
    ({page,descriptor,historyScenario,phase='before',helpers,timeoutMs=15000}=input??{});
    ({descriptor,historyScenario}=validateHistoryInputs({descriptor,historyScenario}));need(['before','after-new-publication'].includes(phase),'unknown observation phase');need(phase!=='after-new-publication'||historyScenario.newPublication!==null,'new actual M04 publication required');
    for(const method of ['on','off','goto','reload','goBack','url','locator','getByRole','getByText','waitForURL','waitForResponse','waitForFunction'])need(typeof page?.[method]==='function',`page.${method} required`);
    keys(helpers,['privateScan','capture','captureCanonical'],'helpers');need(Object.values(helpers).every(v=>typeof v==='function'),'real observation helpers required');need(positive(timeoutMs)&&timeoutMs<=60000,'bounded timeout required');
    const actor=historyScenario.actor,selected=historyScenario.publications[actor].older,origin=new URL(descriptor.endpoints.portal).origin,path='/history/versions/'+selected.version;
    const currentVersion=phase==='after-new-publication'?historyScenario.newPublication.version:historyScenario.publications[actor].current.version;
    out.actor=actor;out.actorId=descriptor.actors[actor].id;out.sourceCommit=descriptor.sourceCommit;
    const tracked=request=>{const u=new URL(request.url());return u.origin===origin&&u.pathname==='/api/client/reviews';};
    requestListener=request=>{try{if(tracked(request))requestPhases.set(request,stage);}catch(error){errorAt(out,'request',error);}};
    responseListener=response=>{
      let work;work=(async()=>{
        const request=response.request();if(!tracked(request))return;const observedPhase=requestPhases.get(request);need(observedPhase,'read event missing original request phase');
        const command=readCommand(request.postDataJSON());
        const wireText=await bounded(response.text(),`${observedPhase}: response body`,timeoutMs,out);need(Buffer.byteLength(wireText,'utf8')<=2000000,'observation response exceeds bounded capture');
        out.reads.push({phase:observedPhase,command,status:response.status(),wireText,wireSha256:sha(wireText)});
      })().catch(error=>errorAt(out,'read',error)).finally(()=>pending.delete(work));pending.add(work);
    };
    page.on('request',requestListener);listening=true;page.on('response',responseListener);
    const checkpoint=async label=>{
      const entry={phase:label,path:new URL(page.url()).pathname,markers:[],canonical:null,observations:[],errors:[]};out.observations.push(entry);
      if(['select','refresh','deep-link'].includes(label))for(const marker of selected.markers)entry.markers.push({text:marker,visible:await page.getByText(marker,{exact:true}).isVisible()});
      for(const helper of ['privateScan','capture','captureCanonical']){try{
        const observed=envelope(await bounded(helper==='captureCanonical'?helpers[helper](label):helpers[helper]({phase:label,page,descriptor}),`${label}: ${helper}`,timeoutMs,out),helper);entry.observations.push({helper,observations:observed.observations});need(observed.observations.length>0,`${helper}: observation missing`);
        for(const error of observed.errors)entry.errors.push({helper,error});
        if(helper==='captureCanonical'&&observed.errors.length===0){need(observed.observations.length===1,'captureCanonical: exactly one SQL observation required');entry.canonical=checkOracle(observed.observations[0],descriptor);}
      }catch(error){entry.errors.push({helper,name:error?.name??'Error',message:String(error?.message??error)});}if(entry.errors.length)break;}
      need(entry.errors.length===0,`${label}: helper observation failed`);need(entry.markers.every(m=>m.visible),`${label}: published markers missing`);
    };
    const ready=async()=>{await page.locator('.plan-view').waitFor({state:'visible',timeout:timeoutMs});await page.getByText('historical plan',{exact:true}).waitFor({state:'visible',timeout:timeoutMs});};
    stage='list';await page.goto(origin+'/history',{waitUntil:'domcontentloaded',timeout:timeoutMs});
    const opener=page.getByRole('button',{name:`open plan version ${selected.version}`,exact:true}),currentOpener=page.getByRole('button',{name:`open plan version ${currentVersion}`,exact:true});
    const loadRequiredVersions=async()=>{
    await page.locator('.history-timeline').waitFor({state:'visible',timeout:timeoutMs});
    for(let n=0;!(await opener.isVisible())||!(await currentOpener.isVisible());n++){
      need(n<100,'history pagination bound exhausted');const more=page.locator('#history-load-more');need(await more.isVisible(),'selected/current published versions not in history');
      let response;response=page.waitForResponse(r=>tracked(r.request())&&r.request().postDataJSON()?.action==='read_care_history_v1',{timeout:timeoutMs}).catch(error=>{errorAt(out,'pagination-read',error);throw error;}).finally(()=>pending.delete(response));pending.add(response);
      // Attach a rejection handler before click so a failed click cannot orphan a wait.
      response.catch(()=>{});await more.click({timeout:timeoutMs});await response;
      await page.waitForFunction(()=>{const more=document.getElementById('history-load-more');return !more||!more.disabled;},undefined,{timeout:timeoutMs});
    }
    };
    await loadRequiredVersions();await checkpoint('list');stage='select';await opener.click({timeout:timeoutMs});await page.waitForURL(origin+path,{timeout:timeoutMs});await ready();await checkpoint('select');
    stage='refresh';await page.reload({waitUntil:'domcontentloaded',timeout:timeoutMs});await ready();await checkpoint('refresh');
    stage='back';await page.locator('#history-version-back').click({timeout:timeoutMs});await page.waitForURL(origin+'/history',{timeout:timeoutMs});await loadRequiredVersions();await checkpoint('back');
    stage='deep-link';await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:timeoutMs});await ready();await checkpoint('deep-link');
    stage='native-back';await page.goBack({waitUntil:'domcontentloaded',timeout:timeoutMs});await page.waitForURL(origin+'/history',{timeout:timeoutMs});await loadRequiredVersions();await checkpoint('native-back');
    for(const version of [...historyScenario.invalidVersions,0,-1,'1.5','9007199254740992']){
      stage='invalid:'+version;await page.goto(origin+'/history/versions/'+version,{waitUntil:'domcontentloaded',timeout:timeoutMs});await page.getByText(version===-1?'page unavailable':'plan version unavailable',{exact:true}).waitFor({state:'visible',timeout:timeoutMs});
      const privatePlanCount=await page.locator('.plan-view').count();need(privatePlanCount===0,'invalid version retains private plan DOM');await checkpoint(stage);out.observations.at(-1).privatePlanCount=privatePlanCount;
    }
  }catch(error){errorAt(out,stage,error);}
  finally{
    if(listening)try{page.off('request',requestListener);page.off('response',responseListener);}catch(error){errorAt(out,'observer-cleanup',error);}
    await Promise.allSettled([...pending]);
  }return out;
}
