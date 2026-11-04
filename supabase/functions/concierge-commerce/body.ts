export type CommerceOperation={readonly signal:AbortSignal;readonly deadline:number};
/** A handler passes this same lifetime through Auth, input, hashing and RPC.
 * Direct runtime consumers get the same existing ten-second transport budget. */
export function commerceOperation(parent?:AbortSignal):CommerceOperation {
 const timeout=AbortSignal.timeout(10000);
 return {signal:parent?AbortSignal.any([parent,timeout]):timeout,deadline:Date.now()+10000};
}
export function commerceAvailable(operation:CommerceOperation):void {
 if(operation.signal.aborted||Date.now()>=operation.deadline)throw new Error('unavailable');
}
export async function commerceWait<T>(start:()=>Promise<T>,operation:CommerceOperation):Promise<T> {
 commerceAvailable(operation);
 let listener:()=>void=()=>{};
 const aborted=new Promise<never>((_resolve,reject)=>{
  listener=()=>reject(new Error('unavailable'));
  operation.signal.addEventListener('abort',listener,{once:true});
 });
 try{
  const result=await Promise.race([start(),aborted]);
  commerceAvailable(operation);return result;
 }finally{operation.signal.removeEventListener('abort',listener);}
}
/** A cancelled or refused body never waits for its producer to finish cleanup. */
export async function readCommerceJson(stream:ReadableStream<Uint8Array>|null,maximum:number,operation:CommerceOperation):Promise<unknown> {
 commerceAvailable(operation);if(!stream)throw new Error('invalid_input');
 const reader=stream.getReader(),chunks:Uint8Array[]=[];let size=0,done=false;
 try{
  while(true){
   const next=await commerceWait(()=>reader.read(),operation);
   if(next.done){done=true;break;}
   size+=next.value.byteLength;if(size>maximum)throw new Error('too_large');chunks.push(next.value);
  }
  commerceAvailable(operation);
  const bytes=new Uint8Array(size);let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  let value:unknown;
  try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true,ignoreBOM:false}).decode(bytes));}
  catch{throw new Error('invalid_input');}
  commerceAvailable(operation);return value;
 }finally{
  if(!done){try{void reader.cancel().catch(()=>{});}catch{/* Already closed/locked. */}}
  try{reader.releaseLock();}catch{/* A pending reader is retired after cancellation. */}
 }
}
