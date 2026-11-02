import type {PlanCommand} from '../contracts/PortalRebuild.ts';
import type {PlanResult} from '../contracts/PortalRebuildMapping.ts';
import {mapPlanResult} from '../contracts/PortalRebuildMapping.ts';
import {readPlanCommand} from '../contracts/PortalRebuildValidation.ts';
import {planCommandMaxBytes, planErrorStatuses} from '../contracts/PortalRebuildValues.ts';

type Configuration={
  supabaseUrl:string;
  anonKey:string;
  getAccessToken:(signal?:AbortSignal)=>Promise<string|null>;
  fetch?:typeof fetch;
  timeoutMs?:number;
};
type Outcome='not_dispatched'|'rejected'|'uncertain';
class AgentError extends Error {
  readonly status:number;
  readonly code:string;
  readonly outcome:Outcome;
  constructor(status:number,code:string,outcome:Outcome){
    super(code);this.name='PortalPlanAgentError';this.status=status;this.code=code;this.outcome=outcome;
  }
}

// This private transport cap matches the retained gateway, not a Root/domain
// maximum. Legitimate larger histories need a separately owned pagination seam.
const responseMaxBytes=2000000;
const encoder=new TextEncoder();
const nativeAborted=Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted')!.get!;
const nativeBody=Object.getOwnPropertyDescriptor(Response.prototype,'body')!.get!;
const nativeStatus=Object.getOwnPropertyDescriptor(Response.prototype,'status')!.get!;
const listen=EventTarget.prototype.addEventListener;
const unlisten=EventTarget.prototype.removeEventListener;
const aborted=(signal:AbortSignal)=>Boolean(nativeAborted.call(signal));

function claims(token:string):Record<string,unknown>{
  if(typeof token!=='string'||token.length>16384||!/^[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+$/.test(token))throw Error();
  const payload=token.split('.')[1]!;
  const bytes=Uint8Array.from(atob(payload.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(payload.length/4)*4,'=')),c=>c.charCodeAt(0));
  const value:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error();
  return value as Record<string,unknown>;
}
function validToken(value:unknown):value is string{
  try{if(typeof value!=='string')return false;const exp=claims(value).exp;return typeof exp==='number'&&Number.isSafeInteger(exp)&&exp>Date.now()/1000;}catch{return false;}
}

/** Snapshot only plain structured data, without invoking getters or toJSON.
 * The Root parser remains the authority for all command fields and values. */
function commandSnapshot(input:unknown):PlanCommand{
  const active=new Set<object>();let nodes=0,bytes=0;
  const visit=(value:unknown,depth=0):unknown=>{
    if(++nodes>planCommandMaxBytes||depth>64)throw Error();
    if(value===null||typeof value==='boolean')return value;
    if(typeof value==='number'){if(!Number.isFinite(value))throw Error();return value;}
    if(typeof value==='string'){bytes+=encoder.encode(value).byteLength;if(bytes>planCommandMaxBytes)throw new AgentError(413,'too_large','not_dispatched');return value;}
    if(typeof value!=='object'||active.has(value))throw Error();
    const array=Array.isArray(value),prototype=Object.getPrototypeOf(value);
    if(array?prototype!==Array.prototype:prototype!==Object.prototype&&prototype!==null)throw Error();
    const descriptors=Object.getOwnPropertyDescriptors(value);
    if(Reflect.ownKeys(value).length!==Object.keys(descriptors).length)throw Error();
    active.add(value);
    try{
      if(array){
        const length=descriptors.length?.value;
        if(!Number.isSafeInteger(length)||length>planCommandMaxBytes||Object.keys(descriptors).length!==length+1)throw Error();
        return Array.from({length},(_,i)=>{const d=descriptors[String(i)];if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error();return visit(d.value,depth+1);});
      }
      return Object.fromEntries(Object.entries(descriptors).map(([key,d])=>{
        if(!d.enumerable||!Object.hasOwn(d,'value'))throw Error();
        bytes+=encoder.encode(key).byteLength;if(bytes>planCommandMaxBytes)throw new AgentError(413,'too_large','not_dispatched');
        return [key,visit(d.value,depth+1)];
      }));
    }finally{active.delete(value);}
  };
  return readPlanCommand(visit(input));
}
function discard(stream:ReadableStream<Uint8Array>|null){
  // Cancellation is observed, never awaited: an uncooperative producer's cancel
  // promise must not extend this operation's absolute deadline.
  try{void stream?.cancel().catch(()=>{});}catch{/* no private error escapes */}
}

/** Fixed Plan API client for configured external agents. It issues no credential,
 * stores no session, and grants no role, client, source or publication authority.
 * Errors expose only status/code/outcome. After an uncertain write, the caller
 * retains the exact command for explicit request_status_v1 or an exact retry. */
export function createPortalPlanAgentClient(config:Configuration):{
  execute(command:PlanCommand,options?:{signal?:AbortSignal}):Promise<PlanResult>;
}{
  let endpoint:string,key:string,send:typeof fetch,getToken:Configuration['getAccessToken'],timeout:number;
  try{
    const base=new URL(config.supabaseUrl);
    key=config.anonKey;send=config.fetch??globalThis.fetch;getToken=config.getAccessToken;timeout=config.timeoutMs??12000;
    if(base.protocol!=='https:'||base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw Error();
    if(typeof key!=='string'||key.length>16384||!(/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)||claims(key).role==='anon'))throw Error();
    if(typeof send!=='function'||typeof getToken!=='function'||!Number.isSafeInteger(timeout)||timeout<1||timeout>2147483647)throw Error();
    endpoint=new URL('/functions/v1/concierge-plans',base).href;
  }catch{throw new AgentError(503,'unavailable','not_dispatched');}

  // This is a retirement fence, never authorization or a cached credential
  // supplier. Every execution still consults the configured credential callback.
  // An observed replacement cannot revive an older operation even after ABA.
  let observedToken:string|null|undefined,credentialRevision=0;
  const observe=(value:string|null)=>{if(value!==observedToken){observedToken=value;credentialRevision++;}};

  return Object.freeze({async execute(command:PlanCommand,options?:{signal?:AbortSignal}):Promise<PlanResult>{
    const until=Date.now()+timeout,controller=new AbortController();
    let dispatched=false,write=false,stopped=false,received=false,reader:ReadableStreamDefaultReader<Uint8Array>|undefined,denied:AgentError|undefined;
    let rejectStop:(reason:unknown)=>void=()=>{};
    const stopPromise=new Promise<never>((_resolve,reject)=>{rejectStop=reject;});
    // Also handle rejection when cancellation happens synchronously during an
    // input callback, before the first wait has attached to the stop promise.
    void stopPromise.catch(()=>{});
    const unavailable=(transport=false)=>new AgentError(503,transport&&dispatched&&write?'uncertain':'unavailable',dispatched?'uncertain':'not_dispatched');
    const stop=()=>{if(stopped)return;stopped=true;rejectStop(unavailable(true));try{controller.abort();}catch{/* fenced before observers */}};
    const timer=setTimeout(stop,timeout);
    let callerSignal:AbortSignal|undefined;
    const check=()=>{if(Date.now()>=until)stop();if(stopped||aborted(controller.signal))throw unavailable(true);};
    const wait=async<T>(work:Promise<T>):Promise<T>=>{const result=await Promise.race([work,stopPromise]);check();return result;};
    const credential=async()=>{
      check();const before=credentialRevision;
      let value:string|null;
      try{value=await wait(Promise.resolve(getToken(controller.signal)));}catch(error){observe(null);throw error;}
      check();
      if(!validToken(value)){observe(null);throw new AgentError(401,'session_ended',dispatched?'uncertain':'not_dispatched');}
      if(before!==credentialRevision&&observedToken!==value)throw new AgentError(401,'session_ended',dispatched?'uncertain':'not_dispatched');
      observe(value);return Object.freeze({token:value,revision:credentialRevision});
    };
    const sameCredential=(captured:{token:string;revision:number},current:{token:string;revision:number})=>
      captured.token===current.token&&captured.revision===current.revision&&captured.revision===credentialRevision&&observedToken===captured.token&&validToken(captured.token);
    try{
      callerSignal=options?.signal;
      if(callerSignal){
        // Intrinsic native operations avoid caller cleanup wrappers introducing
        // a callback after the final credential/applicability check.
        if(aborted(callerSignal))stop();else listen.call(callerSignal,'abort',stop,{once:true});
      }
      check();
      let captured:PlanCommand,body:string;
      try{captured=commandSnapshot(command);body=JSON.stringify(captured);}catch(error){if(error instanceof AgentError)throw error;throw new AgentError(400,'invalid_input','not_dispatched');}
      if(encoder.encode(body).byteLength>planCommandMaxBytes)throw new AgentError(413,'too_large','not_dispatched');
      // All v1 mutations carry requestId; status is an explicitly read-only
      // reconciliation using the original write's UUID.
      write='requestId' in captured&&captured.action!=='request_status_v1';
      const capturedCredential=await credential();
      if(!sameCredential(capturedCredential,await credential()))throw new AgentError(401,'session_ended','not_dispatched');
      check();
      dispatched=true;
      const response=await wait(Promise.resolve(send(endpoint,{method:'POST',headers:{authorization:`Bearer ${capturedCredential.token}`,apikey:key,'content-type':'application/json'},body,signal:controller.signal,credentials:'omit',redirect:'error',cache:'no-store'})).then(response=>{
        if(stopped){try{discard(nativeBody.call(response));}catch{/* invalid native response */}}
        return response;
      }));
      // Brand-checked native Response access; no caller-provided response facade.
      const status=Number(nativeStatus.call(response));
      if(status===401||status===403)denied=new AgentError(status,status===401?'session_ended':'forbidden','rejected');
      const stream=nativeBody.call(response) as ReadableStream<Uint8Array>|null;
      received=true;
      if(status>=300&&status<400){discard(stream);throw unavailable();}
      if(!stream)throw unavailable();
      reader=stream.getReader();const chunks:Uint8Array[]=[];let size=0;
      while(true){
        const {done,value}=await wait(reader.read());
        if(done)break;
        size+=value.byteLength;
        if(size>responseMaxBytes)throw new AgentError(413,'too_large','uncertain');
        chunks.push(value);
      }
      // Complete all potentially reentrant cleanup before the final credential
      // callback/check. Finally must not run a reader callback after selection
      // of a private success value.
      const completedReader=reader;reader=undefined;completedReader.releaseLock();
      check();const bytes=new Uint8Array(size);let offset=0;
      for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      const raw:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
      if(status!==200){
        const code=raw&&typeof raw==='object'&&!Array.isArray(raw)&&Object.keys(raw).length===1&&Object.hasOwn(raw,'code')?(raw as {code:unknown}).code:null;
        const transport:Readonly<Record<string,number>>={too_large:413,unsupported_media_type:415,method_not_allowed:405,origin_forbidden:403};
        if(typeof code==='string'&&((Object.hasOwn(planErrorStatuses,code)&&planErrorStatuses[code]===status)||(Object.hasOwn(transport,code)&&transport[code]===status)))throw new AgentError(status,code,'rejected');
        if(status===503&&code==='uncertain')throw new AgentError(503,'uncertain','uncertain');
        throw unavailable();
      }
      const result=mapPlanResult(raw,captured);
      if(!sameCredential(capturedCredential,await credential()))throw new AgentError(401,'session_ended','uncertain');
      check();
      return result;
    }catch(error){
      if(denied)throw error instanceof AgentError&&error.status===denied.status&&error.outcome==='rejected'?error:denied;
      if(error instanceof AgentError)throw error;
      throw unavailable(!received);
    }finally{
      clearTimeout(timer);
      if(callerSignal)try{unlisten.call(callerSignal,'abort',stop);}catch{/* no callback */}
      if(reader){try{void reader.cancel().catch(()=>{});}catch{/* no callback */}try{reader.releaseLock();}catch{/* pending read owns lock until settled */}}
    }
  }});
}
