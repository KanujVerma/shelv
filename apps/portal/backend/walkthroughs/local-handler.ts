import { createWalkthroughGateway, walkthroughResponse, readWalkthroughJson } from '../../session-integration/runtime/server/walkthrough-gateway.ts';
import { requireWalkthrough } from '../../session-integration/runtime/server/walkthrough-contract.ts';
import { LocalWalkthroughStore, type LocalWalkthroughActor } from './local-store.ts';

export type LocalWalkthroughAuthorization={actor:LocalWalkthroughActor;csrfValid:boolean};
/** The caller supplies a verified local advisor-session bridge. There is no default founder identity. */
export function createLocalWalkthroughHandler(store:LocalWalkthroughStore,options:{origin:string;authorize:(request:Request)=>Promise<LocalWalkthroughAuthorization>;limit?:(request:Request)=>Promise<boolean>}){
    const attempts=new Map<string,{minute:number;count:number}>();
    const limit=options.limit??(async(request:Request)=>{
        const key='local',minute=Math.floor(Date.now()/60000),old=attempts.get(key);
        const next={minute,count:old?.minute===minute?old.count+1:1};attempts.set(key,next);return next.count<=60;
    });
    const guest=createWalkthroughGateway({origin:options.origin,read:digest=>store.readCapability(digest),limit});
    return {async fetch(request:Request):Promise<Response>{
        const url=new URL(request.url);
        if(url.pathname.startsWith('/api/walkthroughs/'))return guest.fetch(request);
        try{
            requireWalkthrough(url.origin===options.origin&&url.pathname==='/api/advisor/walkthroughs'&&!url.search&&request.method==='POST',404,'unavailable');
            requireWalkthrough(request.headers.get('Origin')===options.origin&&request.headers.get('Content-Type')?.split(';')[0]==='application/json',403,'forbidden');
            const command=await readWalkthroughJson(request,8192),authorization=await options.authorize(request);requireWalkthrough(authorization.csrfValid,403,'csrf_required');
            const result=await store.command(command,async()=>{const live=await options.authorize(request);requireWalkthrough(live.csrfValid,403,'csrf_required');return live.actor;});
            return walkthroughResponse(result);
        }catch(error){const e=error as {status?:number;code?:string};return walkthroughResponse({code:e.code??'unavailable'},[400,401,403,404,409,413,429].includes(e.status??0)?e.status:503);}
    }};
}
