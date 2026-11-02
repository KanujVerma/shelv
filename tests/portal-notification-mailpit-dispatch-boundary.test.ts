import assert from 'node:assert/strict';
import {test} from 'node:test';
import {EventEmitter} from 'node:events';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createContext,Script} from 'node:vm';
import type {NeutralNotificationEmail} from '../supabase/functions/concierge-notifications/neutralPayload.ts';
import type {AdapterResult} from '../supabase/functions/concierge-notifications/worker.ts';

// Explicitly synthetic I/O. No Socket, listener, Mailpit, Auth or database is run.
// Removing the actual adapter's parser, validation, write ordering, cap checks or
// cleanup must break these transcript assertions; no accepted adapter is mocked.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=resolve(root,'supabase/functions/concierge-notifications/mailpitSmtp.ts');
const deliveryId='10000000-0000-4000-8000-000000000001';
const link='https://portal.synthetic.invalid/history/versions/1';
const message=():NeutralNotificationEmail=>({deliveryId,to:'case-one@synthetic.invalid',subject:'an update from shelv',link,text:`there is an update in your shelv portal. sign in to view it.\n\n${link}`});
type Operation={notAfter:string;signal:AbortSignal;revalidate:()=>Promise<void>};
type Adapter={kind:'local_mailpit_smtp';send(m:NeutralNotificationEmail,o:Operation):Promise<AdapterResult>};
type Factory=(config:unknown)=>Adapter;
type Step={want:string|RegExp;reply?:string|Uint8Array|null;delay?:number;error?:boolean;throwWrite?:boolean;backpressure?:boolean;callbackDelay?:number;callbackError?:boolean;hook?:()=>void};
const ehlo='EHLO shelv.synthetic.invalid\r\n',mail='MAIL FROM:<shelv@synthetic.invalid>\r\n',rcpt='RCPT TO:<case-one@synthetic.invalid>\r\n';
function steps():Step[]{return [
 {want:ehlo,reply:'250-mailpit.synthetic.invalid\r\n250-SIZE 8192\r\n250 AUTH PLAIN LOGIN\r\n'},
 {want:mail,reply:'250 2.1.0 sender ok\r\n'},
 {want:rcpt,reply:'250 2.1.5 recipient ok\r\n'},
 {want:'DATA\r\n',reply:'354 End data with <CR><LF>.<CR><LF>\r\n'},
 {want:/^From: shelv@synthetic\.invalid\r\n/,reply:'250 2.0.0 Ok: queued as Q-123\r\n'},
 {want:'QUIT\r\n',reply:'221 2.0.0 bye\r\n'},
];}
type HarnessOptions={steps?:Step[];greeting?:string|Uint8Array;connectDelay?:number;noConnect?:boolean;closeNever?:boolean;destroyThrows?:boolean;clock?:()=>number;monotonic?:()=>number};
function harness(options:HarnessOptions={}){
 assert.ok(existsSync(source),'standalone SMTP adapter source is missing');
 const ts=createRequire(import.meta.url)('typescript') as typeof import('typescript');
 const writes:string[]=[],connections:unknown[]=[],sockets:TranscriptSocket[]=[];
 const script=options.steps??steps();let cursor=0,ioAllowed=false;
 const pending=new Set<ReturnType<typeof setTimeout>>();
 function later(fn:()=>void,ms=0){const timer=setTimeout(()=>{pending.delete(timer);fn();},ms);pending.add(timer);}
 class TranscriptSocket extends EventEmitter{
  destroyed=false;destroyCalls=0;
  constructor(){super();assert.ok(ioAllowed,'module-load socket construction');sockets.push(this);}
  connect(value:unknown){connections.push(value);if(!options.noConnect)later(()=>{if(this.destroyed)return;this.emit('connect');this.feed(options.greeting??'220 mailpit.synthetic.invalid ESMTP\r\n');},options.connectDelay);return this;}
  feed(data:string|Uint8Array){if(!this.destroyed)this.emit('data',typeof data==='string'?Buffer.from(data,'utf8'):Buffer.from(data));}
  write(data:string|Uint8Array,callback?:(error?:Error|null)=>void){
   assert.equal(this.destroyed,false,'late write on captured closed socket');const text=Buffer.from(data).toString('utf8');writes.push(text);
   const step=script[cursor++];assert.ok(step,`unexpected write ${text}`);if(typeof step.want==='string')assert.equal(text,step.want);else assert.match(text,step.want);
   step.hook?.();if(step.throwWrite)throw Error('SYNTHETIC_write_throw');
   later(()=>callback?.(step.callbackError?Error('PRIVATE_late_write_error'):null),step.callbackDelay);
   if(step.backpressure)later(()=>this.emit('drain'),step.callbackDelay);
   if(step.error)later(()=>this.emit('error',Error('PRIVATE_smtp_error')),step.delay);
   else if(step.reply!==null&&step.reply!==undefined)later(()=>this.feed(step.reply!),step.delay);
   return !step.backpressure;
  }
  destroy(){this.destroyCalls++;this.destroyed=true;if(!options.closeNever)later(()=>this.emit('close'));if(options.destroyThrows)throw Error('PRIVATE_cleanup_throw');return this;}
 }
 const denied=()=>{throw Error('external_IO_UUID_storage_denied');};
 const sandbox=createContext({Buffer,Uint8Array,URL,TextEncoder,TextDecoder,AbortSignal,AbortController,
  Date:options.clock?class extends Date{static override now(){return options.clock!();}}:Date,
  performance:{now:options.monotonic??(()=>performance.now())},
  setTimeout,clearTimeout,queueMicrotask,fetch:denied,crypto:{randomUUID:denied,getRandomValues:denied},
  localStorage:new Proxy({},{get:denied,set:denied}),sessionStorage:new Proxy({},{get:denied,set:denied}),
 });
 const cache=new Map<string,{exports:Record<string,unknown>}>();let renderSmtpData:((m:NeutralNotificationEmail)=>string)|undefined;
 function load(path:string):Record<string,unknown>{
  const cached=cache.get(path);if(cached)return cached.exports;
  assert.ok(path.startsWith(root+'/src/contracts/')||path.startsWith(root+'/supabase/functions/concierge-notifications/'),'unapproved VM input');
  const module={exports:{} as Record<string,unknown>};cache.set(path,module);
  const js=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  // Test-only read of the actual private serializer; no production export or
  // codec bypass is added. This helper check never enters send() or SMTP I/O.
  const evaluate=new Script(`(function(require,module,exports){${js}\nreturn ${path===source?'smtpData':'undefined'};})`,{filename:path}).runInContext(sandbox) as (r:(s:string)=>unknown,m:typeof module,e:typeof module.exports)=>unknown;
  const internal=evaluate(spec=>{if(spec==='node:net')return {Socket:TranscriptSocket};assert.ok(spec.startsWith('.'),'VM resource import denied: '+spec);return load(resolve(dirname(path),spec));},module,module.exports);
  if(path===source)renderSmtpData=internal as typeof renderSmtpData;
  return module.exports;
 }
 const api=load(source);assert.equal(sockets.length,0);assert.equal(connections.length,0);ioAllowed=true;
 const factory=api.createMailpitNotificationAdapter as Factory;assert.equal(typeof factory,'function');
 return {factory,writes,connections,sockets,renderSmtpData,dispose(){for(const timer of pending)clearTimeout(timer);}};
}
function operation(controller=new AbortController(),revalidate:()=>Promise<void>=async()=>{}):Operation{return {notAfter:new Date(Date.now()+2000).toISOString(),signal:controller.signal,revalidate};}
const config={host:'127.0.0.1',port:58494,from:'shelv@synthetic.invalid'};
function plain<T>(value:T):T{return JSON.parse(JSON.stringify(value)) as T;}
async function send(h:ReturnType<typeof harness>,o=operation(),m=message(),c:unknown=config){return h.factory(c).send(m,o);}

for(const expireOn of [0,4,5,6,7])test(`SMTP1 actual body-write boundary, expiry read ${expireOn}`,async()=>{
 let armed=false,reads=0,checks=0;const base=Date.now(),expiry=base+250;
 const h=harness({clock:()=>armed&&expireOn!==0&&++reads>=expireOn?expiry:base});
 const o=operation(undefined,async()=>{if(++checks===4)armed=true;});o.notAfter=new Date(expiry).toISOString();
 try{
  const result=await send(h,o,message(),{...config,timeoutMs:10000});
  const bodyWrites=h.writes.filter(w=>w.startsWith('From:')).length;
  const observation={expireOn,checks,reads,bodyWrites,writes:h.writes.map(w=>w.startsWith('From:')?'BODY':w.trim()),destroyed:h.sockets.every(s=>s.destroyed),result};
  process.stdout.write('OBSERVATION '+JSON.stringify(observation)+'\n');
  assert.equal(checks,4);assert.ok(observation.destroyed);
  if(expireOn===0){assert.equal(bodyWrites,1);assert.equal(result.status,'accepted');}
  else if(expireOn===7){assert.equal(bodyWrites,1);assert.equal(result.status,'uncertain');}
  else{assert.equal(bodyWrites,0);assert.equal(result.status,'failed');}
 }finally{h.dispose();}
});
