import { capability, capabilityDigest } from './walkthrough-policy';
import { keys, projectWalkthrough, record, requireWalkthrough, type WalkthroughSnapshot } from './walkthrough-contract';

export const walkthroughHeaders={
    'Cache-Control':'no-store, max-age=0',Pragma:'no-cache','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive','Content-Type':'application/json; charset=utf-8',
};
export function walkthroughResponse(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:walkthroughHeaders});}
export async function readWalkthroughJson(request:Request,max=1024):Promise<unknown>{
    const length=request.headers.get('content-length');requireWalkthrough(length===null||(/^\d+$/.test(length)&&Number(length)<=max),413,'payload_too_large');
    const reader=request.body?.getReader();requireWalkthrough(reader);const chunks:Uint8Array[]=[];let size=0;
    try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;requireWalkthrough(size<=max,413,'payload_too_large');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
    const bytes=new Uint8Array(size);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.byteLength;}return JSON.parse(new TextDecoder('utf-8',{fatal:true,ignoreBOM:false}).decode(bytes));
}
export type WalkthroughGatewayOptions={origin:string;read:(digest:string)=>Promise<WalkthroughSnapshot>;limit:(request:Request)=>Promise<boolean>};
/** This route does not consult, issue, forward or downgrade any ordinary account session. */
export function createWalkthroughGateway(options:WalkthroughGatewayOptions){return {async fetch(request:Request):Promise<Response>{
    try{
        const url=new URL(request.url);requireWalkthrough(url.origin===options.origin&&url.pathname==='/api/walkthroughs/view'&&!url.search,404,'unavailable');
        requireWalkthrough(request.method==='POST',404,'unavailable');
        requireWalkthrough(await options.limit(request),429,'unavailable');
        requireWalkthrough(request.headers.get('Origin')===options.origin&&request.headers.get('Sec-Fetch-Site')!=='cross-site',403,'unavailable');
        requireWalkthrough(!request.headers.has('Authorization')&&request.headers.get('Content-Type')?.split(';')[0].trim()==='application/json',404,'unavailable');
        const body=record(await readWalkthroughJson(request));keys(body,['audience','token']);requireWalkthrough(body.audience==='walkthrough',404,'unavailable');
        const digest=await capabilityDigest(capability(body.token));
        const snapshot=projectWalkthrough(await options.read(digest));
        return walkthroughResponse({schemaVersion:1,snapshot});
    }catch(error){
        const status=(error as {status?:number}).status;
        // Identical content for absent, malformed, expired, revoked and unknown capabilities.
        return walkthroughResponse({code:'unavailable'},status===429?429:status===503?503:404);
    }
}};}
