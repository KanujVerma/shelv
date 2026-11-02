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

test('actual SMTP exchange uses fixed envelope and neutral MIME, accepting only the final parsed queue ID',async()=>{
 const h=harness();let checks=0;
 try{const result=await send(h,operation(undefined,async()=>{checks++;}));assert.deepEqual(plain(result),{status:'accepted',providerMessageId:'Q-123'});
  assert.deepEqual(plain(h.connections),[{host:'127.0.0.1',port:58494,family:4}]);assert.equal(checks,4);assert.equal(h.writes.length,6);
  assert.equal(h.writes[4],`From: shelv@synthetic.invalid\r\nTo: case-one@synthetic.invalid\r\nSubject: an update from shelv\r\nMessage-ID: <${deliveryId}@synthetic.invalid>\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\nthere is an update in your shelv portal. sign in to view it.\r\n\r\n${link}\r\n.\r\n`);
  assert.ok(h.sockets.every(s=>s.destroyed));assert.ok(h.writes.every(w=>!/^AUTH |STARTTLS |RSET /m.test(w)));
 }finally{h.dispose();}
});
test('same message is sent twice on separate sockets with identical Message-ID and no SMTP deduplication claim',async()=>{
 const h=harness({steps:[...steps(),...steps()]});try{const a=h.factory(config);assert.equal((await a.send(message(),operation())).status,'accepted');assert.equal((await a.send(message(),operation())).status,'accepted');assert.equal(h.sockets.length,2);assert.equal(h.writes[4],h.writes[10]);}finally{h.dispose();}
});
test('configuration rejects DNS, external IP, URL, credentials, AUTH and arbitrary routing before any socket',()=>{
 const h=harness();try{for(const c of [{...config,host:'localhost'},{...config,host:'192.0.2.1'},{...config,host:'http://127.0.0.1'},{...config,from:'real@example.com'},{...config,port:0},{...config,port:65536},{...config,port:1.2},{...config,timeoutMs:10001},{...config,timeoutMs:0},{...config,username:'x'},{...config,AUTH:'PLAIN'},{...config,url:'smtp://127.0.0.1'},{...config,headers:{x:'x'}}])assert.throws(()=>h.factory(c));assert.equal(h.sockets.length,0);}finally{h.dispose();}
});
test('actual neutral codec and synthetic address policy reject actor fields, injected headers, controls and external links before connect',async()=>{
 const h=harness();try{for(const m of [
  {...message(),actorId:deliveryId},{...message(),to:'real@example.com'},{...message(),to:'case@synthetic.invalid\r\nBcc: real@example.com'},
  {...message(),to:'case\u0000@synthetic.invalid'},{...message(),to:'Case Name <case@synthetic.invalid>'},{...message(),subject:'an update from shelv\r\nX: y'},
  {...message(),link:'https://real.example/notifications',text:'there is an update in your shelv portal. sign in to view it.\n\nhttps://real.example/notifications'},
  {...message(),text:'PRIVATE skin product evidence'}, {...message(),headers:{AUTH:'secret'}},
 ])assert.equal((await send(h,operation(),m as NeutralNotificationEmail)).status,'failed');assert.equal(h.sockets.length,0);
 }finally{h.dispose();}
});
test('missing or failed revalidation, bad clocks, missing expiry and already expired or aborted contexts deny before connect',async()=>{
 for(const o of [{...operation(),revalidate:undefined},{...operation(),revalidate:async()=>{throw Error('PRIVATE_denied');}},{...operation(),notAfter:''},{...operation(),notAfter:'2020-01-01T00:00:00Z'},{...operation(),actorId:deliveryId},{...operation(),signal:AbortSignal.abort()}]){
  const h=harness();try{assert.equal((await send(h,o as Operation)).status,'failed');assert.equal(h.sockets.length,0);}finally{h.dispose();}
 }
 for(const clock of [()=>NaN,()=>Infinity]){const h=harness({clock});try{assert.equal((await send(h)).status,'failed');assert.equal(h.sockets.length,0);}finally{h.dispose();}}
});
test('captured immutable message, configuration and operation survive address and timeout mutation during revalidation',async()=>{
 const h=harness();const m=message(),c={...config},o=operation();o.revalidate=async()=>{m.to='real@example.com';m.text='PRIVATE';c.host='external.example';c.port=25;o.notAfter='2099-01-01T00:00:00Z';};
 try{assert.equal((await send(h,o,m,c)).status,'accepted');assert.match(h.writes[2]!,/^RCPT TO:<case-one@synthetic.invalid>/);assert.doesNotMatch(h.writes.join(''),/PRIVATE|real@example.com|external.example/);}finally{h.dispose();}
});
test('accessors and symbol fields cannot execute or alter captured configuration, message or operation',async()=>{
 const h=harness();let getters=0;const m=message();Object.defineProperty(m,'to',{get(){getters++;return 'case-one@synthetic.invalid';}});
 try{assert.equal((await send(h,operation(),m)).status,'failed');const o=operation();Object.defineProperty(o,'revalidate',{get(){getters++;return async()=>{};}});assert.equal((await send(h,o)).status,'failed');assert.throws(()=>h.factory({...config,[Symbol('auth')]:true}));assert.equal(getters,0);assert.equal(h.sockets.length,0);}finally{h.dispose();}
});
test('reentrant callback cannot replace the captured socket or open another exchange',async()=>{
 const h=harness();const a=h.factory(config);let nested:AdapterResult|undefined;
 try{const r=await a.send(message(),operation(undefined,async()=>{nested=await a.send(message(),operation());}));assert.equal(r.status,'accepted');assert.equal(nested?.status,'failed');assert.equal(h.sockets.length,1);}finally{h.dispose();}
});
test('revocation before recipient envelope or DATA prevents that exposure and closes only the captured socket',async()=>{
 for(const check of [2,3,4]){const h=harness();let n=0;try{const r=await send(h,operation(undefined,async()=>{if(++n===check)throw Error('PRIVATE_context_expired');}));assert.equal(r.status,'failed');assert.equal(h.writes.some(w=>w.startsWith('RCPT')),check!==2);assert.equal(h.writes.some(w=>w.startsWith('From:')),false);if(check===3)assert.equal(h.writes.includes('DATA\r\n'),false);assert.ok(h.sockets.every(s=>s.destroyed));}finally{h.dispose();}}
});
test('one timeout covers pending revalidation and late completion never writes or connects',async()=>{
 const h=harness();let release!:()=>void;const wait=new Promise<void>(r=>{release=r;});
 try{const r=await send(h,operation(undefined,()=>wait),message(),{...config,timeoutMs:25});assert.equal(r.status,'failed');release();await new Promise(r=>setTimeout(r,5));assert.equal(h.connections.length,0);assert.equal(h.writes.length,0);}finally{h.dispose();}
});
test('absolute deadline is not renewed across connection and command waits; notAfter can shorten timeout',async()=>{
 const transcript=steps();for(const s of transcript)s.delay=12;
 const h=harness({steps:transcript,connectDelay:12});try{const r=await send(h,operation(),message(),{...config,timeoutMs:35});assert.equal(r.status,'failed');assert.ok(h.writes.length<4);assert.ok(h.sockets.every(s=>s.destroyed));}finally{h.dispose();}
 const h2=harness({noConnect:true});try{const o=operation();o.notAfter=new Date(Date.now()+25).toISOString();assert.equal((await send(h2,o,message(),{...config,timeoutMs:1000})).status,'failed');assert.ok(h2.sockets[0]?.destroyed);}finally{h2.dispose();}
});
test('abort during pending connection or a reply cancels and produces no late writes',async()=>{
 for(const noConnect of [true,false]){const transcript=steps();transcript[0]!.reply=null;const h=harness({noConnect,steps:transcript});const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15);
  try{assert.equal((await send(h,operation(controller))).status,'failed');const n=h.writes.length;h.sockets[0]?.emit('connect');h.sockets[0]?.emit('data',Buffer.from('250 late\r\n'));h.sockets[0]?.emit('drain');h.sockets[0]?.emit('error',Error('PRIVATE_late_error'));assert.equal(h.writes.length,n);assert.ok(h.sockets.every(s=>s.destroyed));}finally{clearTimeout(timer);h.dispose();}
 }
});
test('strict SMTP parser rejects bare LF, controls, wrong codes, oversized lines, invalid UTF8 and inconsistent multiline replies',async()=>{
 for(const greeting of ['220 bare\n','220 bad\u0000\r\n','250 wrong state\r\n','220 '+ 'x'.repeat(510)+'\r\n',new Uint8Array([50,50,48,32,0xc3,0x28,13,10]),'220-first\r\n221 different\r\n','220-one\r\n'.repeat(33),'220 ok\r\n250 unsolicited\r\n']){
  const h=harness({greeting});try{assert.equal((await send(h)).status,'failed');assert.equal(h.writes.length,0);assert.ok(h.sockets.every(s=>s.destroyed));}finally{h.dispose();}
 }
});
test('split UTF8/multiline replies are consumed by the actual parser without treating continuation as a final acknowledgment',async()=>{
 const transcript=steps();transcript[0]!.reply=null;const h=harness({steps:transcript});
 const timer=setInterval(()=>{const s=h.sockets[0];if(h.writes.length===1&&s&&!s.destroyed){clearInterval(timer);const b=Buffer.from('250-mailpit é\r\n250 OK\r\n');s.feed(b.subarray(0,13));s.feed(b.subarray(13,14));s.feed(b.subarray(14));}},1);
 try{assert.equal((await send(h)).status,'accepted');}finally{clearInterval(timer);h.dispose();}
});
test('explicit SMTP rejection before DATA fails while lost or malformed final acknowledgment remains uncertain',async()=>{
 for(const index of [0,1,2,3,4]){const transcript=steps();transcript[index]!.reply='550 5.7.1 denied PRIVATE\r\n';const h=harness({steps:transcript});try{const r=await send(h);assert.equal(r.status,index===4?'uncertain':'failed');assert.doesNotMatch(JSON.stringify(r),/PRIVATE/);assert.ok(h.sockets.every(s=>s.destroyed));}finally{h.dispose();}}
 for(const reply of [null,'250 accepted\r\n','250 2.0.0 Ok: queued as '+ 'x'.repeat(201)+'\r\n','250-first\r\n250 2.0.0 Ok: queued as Q-123\r\n']){const transcript=steps();transcript[4]!.reply=reply;const h=harness({steps:transcript});try{assert.equal((await send(h,operation(),message(),{...config,timeoutMs:35})).status,'uncertain');assert.equal(h.writes.filter(w=>w.startsWith('From:')).length,1);}finally{h.dispose();}}
});
test('SMTP errors and write throws before versus after body dispatch retain truthful uncertainty',async()=>{
 for(const index of [0,4])for(const throwing of [false,true]){const transcript=steps();Object.assign(transcript[index]!,throwing?{throwWrite:true}:{error:true,reply:null});const h=harness({steps:transcript});try{assert.equal((await send(h)).status,index===4?'uncertain':'failed');assert.ok(h.sockets.every(s=>s.destroyed));assert.equal(h.writes.filter(w=>w.startsWith('From:')).length,index===4?1:0);}finally{h.dispose();}}
});
test('backpressure waits for both callback and drain, while abort forbids the next command',async()=>{
 const transcript=steps();transcript[0]!.backpressure=true;transcript[0]!.callbackDelay=15;const h=harness({steps:transcript});try{assert.equal((await send(h)).status,'accepted');}finally{h.dispose();}
 const transcript2=steps();transcript2[0]!.backpressure=true;transcript2[0]!.callbackDelay=50;const h2=harness({steps:transcript2});const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15);try{assert.equal((await send(h2,operation(controller))).status,'failed');assert.equal(h2.writes.length,1);assert.ok(h2.sockets[0]?.destroyed);}finally{clearTimeout(timer);h2.dispose();}
});
test('delayed final ACK beyond deadline or abort cannot become accepted and never resends the body',async()=>{
 for(const aborting of [false,true]){const transcript=steps();transcript[4]!.delay=70;const h=harness({steps:transcript});const c=new AbortController();const timer=aborting?setTimeout(()=>c.abort(),30):undefined;
  try{const r=await send(h,operation(c),message(),{...config,timeoutMs:45});assert.equal(r.status,'uncertain');await new Promise(r=>setTimeout(r,80));assert.equal(h.writes.filter(w=>w.startsWith('From:')).length,1);assert.equal(h.writes.includes('QUIT\r\n'),false);assert.ok(h.sockets[0]?.destroyed);}finally{clearTimeout(timer);h.dispose();}
 }
});
test('cleanup throw, missing close and reentrant cleanup abort never fabricate acceptance',async()=>{
 for(const options of [{destroyThrows:true},{closeNever:true}]){const h=harness(options);try{assert.equal((await send(h,operation(),message(),{...config,timeoutMs:45})).status,'uncertain');assert.ok(h.sockets[0]?.destroyed);}finally{h.dispose();}}
 const h=harness();const c=new AbortController(),original=c.signal.removeEventListener.bind(c.signal);c.signal.removeEventListener=(...args:Parameters<AbortSignal['removeEventListener']>)=>{original(...args);c.abort();};try{assert.equal((await send(h,operation(c))).status,'uncertain');}finally{h.dispose();}
});
test('literal IPv6 loopback is supported without DNS lookup or constructor-time I/O',async()=>{
 const h=harness();try{assert.equal((await send(h,operation(),message(),{...config,host:'::1'})).status,'accepted');assert.deepEqual(plain(h.connections),[{host:'::1',port:58494,family:6}]);}finally{h.dispose();}
});
test('malformed success booleans and synchronous callbacks do not supply trusted revalidation',async()=>{
 const h=harness();try{for(const callback of [()=>true,()=>false,()=>undefined,async()=>true,async()=>false]){
  const o=operation();o.revalidate=callback as unknown as Operation['revalidate'];assert.equal((await send(h,o)).status,'failed');
 }assert.equal(h.connections.length,0);}finally{h.dispose();}
});
test('abort reentrancy followed by a delayed write callback error is observed without an unhandled rejection',async()=>{
 const c=new AbortController(),transcript=steps();Object.assign(transcript[0]!,{hook:()=>c.abort(),callbackError:true,callbackDelay:10});const h=harness({steps:transcript});
 try{assert.equal((await send(h,operation(c))).status,'failed');await new Promise(r=>setTimeout(r,20));assert.equal(h.writes.length,1);assert.ok(h.sockets[0]?.destroyed);}finally{h.dispose();}
});
test('interrupted reply fails before body, and lost reply after body remains uncertain',async()=>{
 for(const index of [0,4]){const transcript=steps();transcript[index]!.reply=null;const h=harness({steps:transcript});let fired=false;
  const timer=setInterval(()=>{if(!fired&&h.writes.length===index+1){fired=true;h.sockets[0]!.feed('250 incomplete');h.sockets[0]!.emit('end');}},1);
  try{assert.equal((await send(h)).status,index===4?'uncertain':'failed');assert.ok(h.sockets[0]?.destroyed);}finally{clearInterval(timer);h.dispose();}
 }
});
test('clock regression or invalid monotonic time after a callback blocks recipient exposure',async()=>{
 for(const invalid of [false,true]){let offset=0;const h=harness({clock:()=>Date.now()+offset,monotonic:()=>invalid&&offset!==0?NaN:performance.now()});let count=0;
  try{assert.equal((await send(h,operation(undefined,async()=>{if(++count===2)offset=-10000;}))).status,'failed');assert.equal(h.writes.some(w=>w.startsWith('RCPT')),false);assert.ok(h.sockets[0]?.destroyed);}finally{h.dispose();}
 }
});
test('SMTP wire line cap applies to an otherwise valid fixed neutral message before connecting',async()=>{
 const h=harness(),m=message();m.link='https://portal.synthetic.invalid/history/versions/'+'1'.repeat(950);m.text=`there is an update in your shelv portal. sign in to view it.\n\n${m.link}`;
 try{assert.equal((await send(h,operation(),m)).status,'failed');assert.equal(h.connections.length,0);}finally{h.dispose();}
});
test('actual private serializer applies CRLF and dot stuffing; send still rejects non-neutral dot-line content',async()=>{
 const h=harness(),m={...message(),text:'.first\n.\n..last'};
 try{assert.ok(h.renderSmtpData);assert.ok(h.renderSmtpData(m).endsWith('\r\n\r\n..first\r\n..\r\n...last\r\n.\r\n'));assert.equal((await send(h,operation(),m)).status,'failed');assert.equal(h.connections.length,0);}finally{h.dispose();}
});
test('retired socket errors and delayed callback cannot close or write into the next send',async()=>{
 const c=new AbortController(),h=harness({steps:[{want:ehlo,reply:null,callbackDelay:12,callbackError:true,hook:()=>c.abort()},...steps()]});const a=h.factory(config);
 try{assert.equal((await a.send(message(),operation(c))).status,'failed');const old=h.sockets[0]!;const next=a.send(message(),operation());old.emit('data',Buffer.from('250 2.0.0 Ok: queued as OLD\r\n'));old.emit('error',Error('PRIVATE_old_socket'));old.emit('drain');assert.equal((await next).status,'accepted');assert.equal(h.sockets.length,2);assert.equal(h.writes.filter(w=>w.startsWith('From:')).length,1);assert.ok(h.sockets.every(s=>s.destroyed));}finally{h.dispose();}
});
test('notAfter accepts the explicit UTC offset used by trusted context instants',async()=>{
 const h=harness(),o=operation();o.notAfter=o.notAfter.replace('Z','+00:00');try{assert.equal((await send(h,o)).status,'accepted');}finally{h.dispose();}
});
test('calendar-invalid notAfter cannot acquire a socket through Date.parse rollover',async()=>{
 const h=harness(),o=operation();o.notAfter='2099-02-30T00:00:00Z';try{assert.equal((await send(h,o)).status,'failed');assert.equal(h.connections.length,0);}finally{h.dispose();}
});
