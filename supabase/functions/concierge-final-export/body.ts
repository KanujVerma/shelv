/** Own bounded byte reader. It rejects overflow before any unbounded retained decoder sees bytes. */
export async function readFinalExportBytes(stream:ReadableStream<Uint8Array>|null,maximum:number):Promise<Uint8Array<ArrayBuffer>>{
 if(!stream)throw Error('invalid_input');const reader=stream.getReader(),chunks:Uint8Array[]=[];let size=0;
 try{while(true){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>maximum){await reader.cancel();throw Error('too_large');}chunks.push(next.value);}}
 finally{reader.releaseLock();}
 const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.byteLength;}return result;
}
export async function readFinalExportJson(stream:ReadableStream<Uint8Array>|null,maximum:number):Promise<unknown>{
 const bytes=await readFinalExportBytes(stream,maximum);
 try{const result:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));return result;}catch{throw Error('invalid_input');}
}
