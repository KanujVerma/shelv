import { readConciergeJson } from '../concierge-operations/body.ts';
import type { CheckinStorage, PrivateCheckinPhoto } from './types.ts';
type Configuration = { supabaseUrl: string; serviceKey: string; fetch?: typeof globalThis.fetch };
/** Server-only Storage I/O. Caller must obtain the descriptor using a freshly guarded JWT RPC first. */
export function createCheckinStorage(config: Configuration): CheckinStorage {
  let base: URL;
  try { base = new URL(config.supabaseUrl);
    if (base.protocol !== 'https:' || base.username || base.password || base.pathname !== '/' || base.search || base.hash || !config.serviceKey.trim()) throw new Error();
  } catch { throw new Error('storage_unavailable'); }
  const send = config.fetch ?? globalThis.fetch;
  const path = (photo: PrivateCheckinPhoto) => `${photo.bucket}/${photo.path.split('/').map(encodeURIComponent).join('/')}`;
  const options = (signal?: AbortSignal): RequestInit => ({ headers: { authorization:`Bearer ${config.serviceKey}`,apikey:config.serviceKey },
    redirect:'error',credentials:'omit',cache:'no-store',signal:signal ? AbortSignal.any([signal,AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000) });
  const url = (route: string) => new URL(`/storage/v1/${route}`,base).href;
  async function boundedBytes(response: Response): Promise<Uint8Array<ArrayBuffer>> {
    if (!response.body) throw new Error('storage_unavailable');
    const reader = response.body.getReader(), chunks:Uint8Array[]=[]; let size=0;
    try { while (true) { const {done,value}=await reader.read(); if(done)break; size+=value.length;
      if(size>5*1024*1024){await reader.cancel();throw new Error('storage_unavailable');} chunks.push(value); }
    } finally {reader.releaseLock();}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
  }
  return {
    origin:base.origin,
    upload:async(photo,body,signal)=>{
      try {
        const init=options(signal),headers=new Headers(init.headers);headers.set('content-type',photo.contentType);headers.set('x-upsert','false');
        const response=await send(url(`object/${path(photo)}`),{...init,headers,method:'POST',body});
        if(response.ok){await response.body?.cancel();return 'uploaded';}
        if(response.status===409){await response.body?.cancel();return 'exists';}
        const value=await readConciergeJson(response.body,16384) as Record<string,unknown>;
        if(response.status===400 && (value.error==='Duplicate'||value.code==='Duplicate'||value.statusCode==='409')) return 'exists';
        throw new Error();
      }catch{throw new Error('storage_unavailable');}
    },
    read:async(photo,signal)=>{
      try{
        const response=await send(url(`object/authenticated/${path(photo)}`),{...options(signal),method:'GET'});
        if(!response.ok){await response.body?.cancel();throw new Error();}
        const bytes=await boundedBytes(response);return new Blob([bytes],{type:response.headers.get('content-type')??''});
      }catch{throw new Error('storage_unavailable');}
    },
    sign:async(photo,expiresIn,signal)=>{
      try{
        if(!Number.isSafeInteger(expiresIn)||expiresIn<1||expiresIn>60)throw new Error();
        const init=options(signal),headers=new Headers(init.headers);headers.set('content-type','application/json');
        const response=await send(url(`object/sign/${path(photo)}`),{...init,headers,method:'POST',body:JSON.stringify({expiresIn})});
        if(!response.ok){await response.body?.cancel();throw new Error();}
        const value=await readConciergeJson(response.body,16384) as {signedURL?:unknown};
        if(typeof value.signedURL!=='string'||!value.signedURL.startsWith('/object/sign/'))throw new Error();
        return new URL(`/storage/v1${value.signedURL}`,base).href;
      }catch{throw new Error('storage_unavailable');}
    },
  };
}
