/** A safe typed failure, with no upstream/private error text in the HTTP response. */
export class AccountProfileFailure extends Error{
 readonly status:number;readonly code:string;
 constructor(status:number,code:string){super(code);this.status=status;this.code=code;}
}
const receivedDenials=new WeakMap<AbortSignal,AccountProfileFailure>();
const deadlines=new WeakMap<AbortSignal,number>();
export function setAccountProfileDeadline(signal:AbortSignal,deadline:number):void{
 if(deadlines.has(signal)||!Number.isFinite(deadline)||deadline>Date.now()+10000)throw new AccountProfileFailure(503,'unavailable');
 deadlines.set(signal,deadline);
}
function check(signal:AbortSignal):void{
 const deadline=deadlines.get(signal);
 if(deadline===undefined||signal.aborted||Date.now()>=deadline)throw new AccountProfileFailure(503,'unavailable');
}
export function accountProfileReceivedDenial(signal:AbortSignal,status?:401|403):AccountProfileFailure|undefined{
 if(status!==undefined)receivedDenials.set(signal,new AccountProfileFailure(status,status===401?'session_ended':'forbidden'));
 return receivedDenials.get(signal);
}
/** Race every asynchronous operation against the SAME handler-owned operation signal. */
export async function accountProfileWait<T>(start:()=>Promise<T>,signal:AbortSignal):Promise<T>{
 check(signal);
 let listener:()=>void=()=>{};
 const aborted=new Promise<never>((_resolve,reject)=>{listener=()=>reject(new AccountProfileFailure(503,'unavailable'));signal.addEventListener('abort',listener,{once:true});});
 try{const value=await Promise.race([start(),aborted]);check(signal);return value;}finally{signal.removeEventListener('abort',listener);}
}
export async function readAccountProfileJson(stream:ReadableStream<Uint8Array>|null,maximum:number,signal:AbortSignal):Promise<unknown>{
 if(!stream)throw new AccountProfileFailure(400,'invalid_input');
 const reader=stream.getReader(),chunks:Uint8Array[]=[];let size=0,done=false;
 try{
  while(true){const next=await accountProfileWait(()=>reader.read(),signal);if(next.done){done=true;break;}
   size+=next.value.byteLength;if(size>maximum)throw new AccountProfileFailure(413,'too_large');chunks.push(next.value);
  }
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new AccountProfileFailure(400,'invalid_input');}
 }finally{
  if(!done){try{const cancellation=reader.cancel();void cancellation.catch(()=>{});await accountProfileWait(()=>cancellation,signal);}catch{/* Same deadline bounds cancellation; never renew it. */}}
  try{reader.releaseLock();}catch{/* Pending reader after abort is retired. */}
 }
}
