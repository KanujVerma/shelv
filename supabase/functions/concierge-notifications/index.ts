import {handleNotificationRequest} from './handler.ts';
import {createNotificationPorts} from './runtime.ts';
declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (request: Request) => Promise<Response>): void };
Deno.serve(async(request:Request)=>{
 try{return await handleNotificationRequest(request,createNotificationPorts({supabaseUrl:Deno.env.get('SUPABASE_URL')??'',publicKey:Deno.env.get('SUPABASE_PUBLISHABLE_KEY')??Deno.env.get('SUPABASE_ANON_KEY')??'',allowedOrigins:(Deno.env.get('CONCIERGE_ALLOWED_ORIGINS')??'').split(',').map(s=>s.trim()).filter(Boolean)}));}
 catch{return new Response(JSON.stringify({code:'unavailable'}),{status:503,headers:{'content-type':'application/json','cache-control':'private, no-store'}});}
});
