import { readUuid } from '../../../src/contracts/ConciergePortalValidation.ts';

export type ConciergeCleanupPort = {
  list(bucket:string,prefix:string,offset:number):Promise<{entries:{name:string;id:string|null}[];error:boolean}>;
  remove(bucket:string,paths:string[]):Promise<boolean>;
};
const buckets=['concierge-payment-evidence','concierge-checkin-photos'] as const;
const pageSize=100, maximumEntries=10000;

/** Call after the committed deletion fence, before Auth deletion. No paths log. */
export async function cleanupConciergePrivateStorage(ownerId:string,port:ConciergeCleanupPort):Promise<boolean>{
  try{
    ownerId=readUuid(ownerId);
    const inventory=async(bucket:string):Promise<string[]|null>=>{
      const pending=[ownerId],seen=new Set<string>(),files=new Set<string>();let count=0;
      while(pending.length){
        const prefix=pending.shift()!;if(seen.has(prefix))continue;seen.add(prefix);
        for(let offset=0;;offset+=pageSize){
          const result=await port.list(bucket,prefix,offset);
          if(result.error || result.entries.length>pageSize)return null;
          for(const entry of result.entries){
            if(++count>maximumEntries || typeof entry.name!=='string' || !entry.name || ['.','..'].includes(entry.name) || /[\\/\u0000]/.test(entry.name))return null;
            const path=prefix+'/'+entry.name;
            if(entry.id===null)pending.push(path);else files.add(path);
          }
          if(result.entries.length<pageSize)break;
        }
      }
      return [...files];
    };
    for(const bucket of buckets){
      const paths=await inventory(bucket);if(paths===null)return false;
      for(let i=0;i<paths.length;i+=pageSize)if(!await port.remove(bucket,paths.slice(i,i+pageSize)))return false;
    }
    for(const bucket of buckets){const paths=await inventory(bucket);if(paths===null || paths.length)return false;}
    return true;
  }catch{return false;}
}
