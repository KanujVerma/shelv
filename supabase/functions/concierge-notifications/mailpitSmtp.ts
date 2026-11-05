import {Socket} from 'node:net';
import {readNeutralNotificationEmail} from './neutralPayload.ts';
import type {NeutralNotificationEmail} from './neutralPayload.ts';
import type {AdapterResult} from './worker.ts';

/** Standalone Node22 source. Not admitted to the existing filesystem worker. */
export type MailpitNotificationAdapter={
 kind:'local_mailpit_smtp';
 send(message:NeutralNotificationEmail,operation:{notAfter:string;signal:AbortSignal;revalidate:()=>Promise<void>}):Promise<AdapterResult>;
};
type Config={host:'127.0.0.1'|'::1';port:number;from:'shelv@synthetic.invalid';timeoutMs?:number};
type Reply={code:number;lines:string[]};

/** Copy only closed own data properties; never read caller accessors after awaits. */
function fields(value:unknown,required:string[],optional:string[]=[]):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('smtp_invalid_input');
 const descriptors=Object.getOwnPropertyDescriptors(value),keys=Reflect.ownKeys(value);
 if(keys.some(k=>typeof k!=='string'||(!required.includes(k)&&!optional.includes(k)))||required.some(k=>!Object.hasOwn(descriptors,k)))throw Error('smtp_invalid_input');
 const copy:Record<string,unknown>=Object.create(null) as Record<string,unknown>;
 for(const key of keys){const name=key as string,d=descriptors[name];if(!d||!Object.hasOwn(d,'value'))throw Error('smtp_invalid_input');copy[name]=d.value;}
 return copy;
}
function neutral(value:unknown):NeutralNotificationEmail{
 const message=readNeutralNotificationEmail(fields(value,['deliveryId','to','subject','link','text']));
 const url=new URL(message.link);
 if(!/^[a-z0-9][a-z0-9._+-]{0,63}@synthetic\.invalid$/i.test(message.to)
  ||/[\u0000-\u0020\u007f-\u009f]/.test(message.link)
  ||!(url.hostname==='synthetic.invalid'||url.hostname.endsWith('.synthetic.invalid'))
  ||url.port!==''||url.href!==message.link)throw Error('smtp_invalid_input');
 return Object.freeze({...message,deliveryId:message.deliveryId.toLowerCase()});
}
function smtpData(message:NeutralNotificationEmail):string{
 const text=message.text.replace(/\r?\n/g,'\r\n').replace(/(^|\r\n)\./g,'$1..');
 const data=[`From: shelv@synthetic.invalid`,`To: ${message.to}`,'Subject: an update from shelv',
  `Message-ID: <${message.deliveryId}@synthetic.invalid>`,'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=utf-8','Content-Transfer-Encoding: 8bit','',text].join('\r\n')+'\r\n.\r\n';
 if(Buffer.byteLength(data,'utf8')>8192||data.split('\r\n').some(line=>Buffer.byteLength(line,'utf8')>998))throw Error('smtp_invalid_input');
 return data;
}
function notAfter(value:unknown):number{
 if(typeof value!=='string')throw Error('smtp_invalid_input');
 const parts=/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})$/.exec(value);
 if(!parts)throw Error('smtp_invalid_input');
 // Validate local calendar components independently of the explicit offset.
 // Date.parse alone silently rolls February30 into March. Microseconds are
 // conservatively truncated to the millisecond precision of the local clock.
 const calendar=`${parts[1]}.${(parts[2]??'').padEnd(3,'0').slice(0,3)}Z`,local=Date.parse(calendar),expiry=Date.parse(value);
 if(!Number.isFinite(local)||new Date(local).toISOString()!==calendar||!Number.isFinite(expiry))throw Error('smtp_invalid_input');
 return expiry;
}

/**
 * Explicit loopback SMTP only. The trusted future worker must supply fixed-SQL
 * current-context revalidation bound to the actual owner/session/lease/body.
 * This hook grants no authority. A final250 is queue acceptance, not delivery.
 * Identical Message-IDs do not deduplicate SMTP. There is no retry or resend.
 */
export function createMailpitNotificationAdapter(config:Config):MailpitNotificationAdapter{
 const c=fields(config,['host','port','from'],['timeoutMs']);
 if((c.host!=='127.0.0.1'&&c.host!=='::1')||c.from!=='shelv@synthetic.invalid'
  ||typeof c.port!=='number'||!Number.isInteger(c.port)||c.port<1||c.port>65535
  ||(Object.hasOwn(c,'timeoutMs')&&(typeof c.timeoutMs!=='number'||!Number.isInteger(c.timeoutMs)||c.timeoutMs<1||c.timeoutMs>10000)))throw Error('smtp_invalid_config');
 const host=c.host,port=c.port,timeoutMs=typeof c.timeoutMs==='number'?c.timeoutMs:10000;
 let active:symbol|null=null;
 return {kind:'local_mailpit_smtp',send:async(value,operation):Promise<AdapterResult>=>{
  if(active!==null)return {status:'failed',errorCode:'smtp_adapter_busy'};
  const token=Symbol();active=token;
  let socket:Socket|undefined,signal:AbortSignal|undefined,timer:ReturnType<typeof setTimeout>|undefined;
  let alive=true,dispatched=false,closing=false,closed=false,cleanupFailed=false,listenerAdded=false;
  let fault:string|undefined,outcome:AdapterResult|undefined,quitAcknowledged=false;
  let wallEnd=0,monoEnd=0,lastWall=0,lastMono=0;
  let rejectStop:(error:Error)=>void=()=>{};
  const stopped=new Promise<never>((_resolve,reject)=>{rejectStop=reject;});
  // The stop can precede the first await (including a reentrant abort listener).
  void stopped.catch(()=>{});
  const destroy=()=>{if(socket&&!socket.destroyed){closing=true;try{socket.destroy();}catch{cleanupFailed=true;}}};
  const stop=(code:string)=>{if(!fault){fault=code;rejectStop(Error(code));}destroy();};
  const check=()=>{
   const wall=Date.now(),mono=performance.now();
   if(!alive||active!==token||signal?.aborted)throw Error('smtp_scope_ended');
   if(!Number.isFinite(wall)||!Number.isFinite(mono)||wall<lastWall||mono<lastMono)throw Error('smtp_clock_invalid');
   lastWall=wall;lastMono=mono;
   if(wall>=wallEnd||mono>=monoEnd)throw Error('smtp_timeout');
   if(fault)throw Error(fault);
  };
  const bounded=async<T>(promise:Promise<T>):Promise<T>=>{void promise.catch(()=>{});check();const result=await Promise.race([promise,stopped]);check();return result;};
  const onAbort=()=>stop('smtp_aborted');
  try{
   const message=neutral(value),data=smtpData(message);
   const op=fields(operation,['notAfter','signal','revalidate']);
   if(!(op.signal instanceof AbortSignal)||typeof op.revalidate!=='function')throw Error('smtp_invalid_input');
   signal=op.signal;const revalidate=op.revalidate as ()=>Promise<void>;
   const expiry=notAfter(op.notAfter);lastWall=Date.now();lastMono=performance.now();
   if(!Number.isFinite(expiry)||!Number.isFinite(lastWall)||!Number.isFinite(lastMono))throw Error('smtp_clock_invalid');
   wallEnd=Math.min(expiry,lastWall+timeoutMs);monoEnd=lastMono+(wallEnd-lastWall);
   check();timer=setTimeout(()=>stop('smtp_timeout'),Math.max(1,Math.ceil(wallEnd-lastWall)));
   listenerAdded=true;signal.addEventListener('abort',onAbort,{once:true});check();
   const recheck=async()=>{
    check();
    const result=await bounded(Promise.resolve().then(()=>{
     check();const verification=revalidate();
     if(!verification||typeof verification.then!=='function')throw Error('smtp_revalidation_invalid');
     return verification;
    }));
    if(result!==undefined)throw Error('smtp_revalidation_invalid');
    check();
   };
   // Missing/denied context never opens a socket. Subsequent checks precede each
   // recipient exposure and DATA boundary, including the wait for354.
   await recheck();check();
   socket=new Socket();const ownSocket=socket;
   let resolveConnected:()=>void=()=>{},resolveClosed:()=>void=()=>{};
   const connected=new Promise<void>(resolve=>{resolveConnected=resolve;});
   const closure=new Promise<void>(resolve=>{resolveClosed=resolve;});
   let bytes=Buffer.alloc(0),totalBytes=0,multilineCode:number|undefined,replyLines:string[]=[];
   let waiting:{expected:number;resolve:(reply:Reply)=>void}|undefined;
   const reply=(expected:number):Promise<Reply>=>{
    check();if(waiting||bytes.length||replyLines.length)throw Error('smtp_protocol');
    return new Promise(resolve=>{waiting={expected,resolve};});
   };
   const receive=(chunk:Buffer)=>{
    if(!alive||fault)return;
    try{
     check();if(!(chunk instanceof Uint8Array))throw Error('smtp_protocol');
     totalBytes+=chunk.byteLength;if(totalBytes>32768||bytes.length+chunk.byteLength>8192)throw Error('smtp_reply_size');
     bytes=Buffer.concat([bytes,chunk]);
     while(bytes.length){
      const lf=bytes.indexOf(10);
      if(lf===-1){if(bytes.length>511)throw Error('smtp_reply_size');break;}
      if(lf===0||bytes[lf-1]!==13||lf+1>512)throw Error('smtp_protocol');
      const line=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,lf-1));bytes=bytes.subarray(lf+1);
      if(/[\u0000-\u001f\u007f-\u009f]/.test(line)||!waiting)throw Error('smtp_protocol');
      const match=/^([2-5][0-9]{2})([ -])([^\r\n]*)$/.exec(line);if(!match)throw Error('smtp_protocol');
      const code=Number(match[1]);
      if(multilineCode!==undefined&&multilineCode!==code)throw Error('smtp_protocol');
      replyLines.push(line);if(replyLines.length>32)throw Error('smtp_reply_size');
      if(match[2]==='-'){multilineCode=code;continue;}
      const pending=waiting;waiting=undefined;const lines=replyLines;replyLines=[];multilineCode=undefined;
      if(code!==pending.expected)throw Error(code>=400?'smtp_rejected':'smtp_protocol');
      if(code===221)quitAcknowledged=true;
      pending.resolve({code,lines});
     }
    }catch{stop('smtp_reply_invalid');}
   };
   ownSocket.on('data',receive);
   ownSocket.on('connect',()=>{if(alive&&!fault)resolveConnected();});
   // Keep the error observer on this one destroyed socket to absorb late Node
   // error events. It cannot write, revalidate, reopen or resolve a later send.
   ownSocket.on('error',()=>{if(alive)stop('smtp_io_error');});
   ownSocket.on('end',()=>{if(alive&&!closing&&!quitAcknowledged)stop('smtp_reply_interrupted');});
   ownSocket.on('close',()=>{closed=true;resolveClosed();if(alive&&!closing&&!quitAcknowledged)stop('smtp_connection_closed');});
   const write=async(content:string,isBody=false)=>{
    check();
    let done=false,returned=false,needsDrain=false,drained=false;
    let resolveWrite:()=>void=()=>{},rejectWrite:(e:Error)=>void=()=>{};
    const written=new Promise<void>((resolve,reject)=>{resolveWrite=resolve;rejectWrite=reject;});
    // A reentrant abort or synchronous write throw can precede bounded().
    // Observe a later callback error even when this send has already retired.
    void written.catch(()=>{});
    const finish=()=>{if(returned&&done&&(!needsDrain||drained))resolveWrite();};
    const onDrain=()=>{drained=true;finish();};
    ownSocket.on('drain',onDrain);
    try{
     check();
     // Only an actual body-write attempt can make the result uncertain.
     if(isBody)dispatched=true;
     needsDrain=!ownSocket.write(content,error=>{if(error)rejectWrite(Error('smtp_write_failed'));else{done=true;finish();}});
     returned=true;finish();await bounded(written);
    }finally{ownSocket.removeListener('drain',onDrain);}
    check();
   };
   const command=async(content:string,expected:number)=>{check();const response=reply(expected);await write(content);return bounded(response);};
   const greeting=reply(220);check();ownSocket.connect({host,port,family:host==='::1'?6:4});
   await bounded(connected);await bounded(greeting);
   await command('EHLO shelv.synthetic.invalid\r\n',250);
   await command('MAIL FROM:<shelv@synthetic.invalid>\r\n',250);
   await recheck();await command(`RCPT TO:<${message.to}>\r\n`,250);
   await recheck();await command('DATA\r\n',354);
   await recheck();check();
   const queued=reply(250);
   await write(data,true);const acknowledgment=await bounded(queued);
   const queueId=acknowledgment.lines.length===1?/^250 2\.0\.0 Ok: queued as ([A-Za-z0-9][A-Za-z0-9._-]{0,127})$/i.exec(acknowledgment.lines[0]??'')?.[1]:undefined;
   if(!queueId)throw Error('smtp_queue_ack_invalid');
   await command('QUIT\r\n',221);check();
   closing=true;destroy();
   if(cleanupFailed)throw Error('smtp_cleanup_failed');
   if(!closed)await bounded(closure);
   check();outcome={status:'accepted',providerMessageId:queueId};
  }catch{
   outcome={status:dispatched?'uncertain':'failed',errorCode:fault??'smtp_exchange_failed'};
  }finally{
   // Revoke write scope before callback-capable disposal. A late continuation
   // can observe only this ended scope and its own captured socket.
   alive=false;destroy();
   if(listenerAdded&&signal){try{signal.removeEventListener('abort',onAbort);}catch{cleanupFailed=true;}}
   try{
    const wall=Date.now(),mono=performance.now();
    if(active!==token||signal?.aborted||!Number.isFinite(wall)||!Number.isFinite(mono)||wall<lastWall||mono<lastMono||wall>=wallEnd||mono>=monoEnd||cleanupFailed||fault){
     outcome={status:dispatched?'uncertain':'failed',errorCode:cleanupFailed?'smtp_cleanup_failed':fault??'smtp_scope_ended'};
    }
   }catch{outcome={status:dispatched?'uncertain':'failed',errorCode:'smtp_clock_invalid'};}
   if(timer!==undefined)clearTimeout(timer);
   if(active===token)active=null;
  }
  return outcome??{status:dispatched?'uncertain':'failed',errorCode:'smtp_exchange_failed'};
 }};
}
