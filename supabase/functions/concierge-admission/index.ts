import {handleAdmissionRequest} from './handler.ts';
import {createAdmissionPorts} from './runtime.ts';
declare const Deno:{env:{get(name:string):string|undefined};serve(handler:(request:Request)=>Promise<Response>):void};

Deno.serve(async request=>{
 try{return await handleAdmissionRequest(request,createAdmissionPorts({supabaseUrl:Deno.env.get('SUPABASE_URL')??'',publicKey:Deno.env.get('SUPABASE_PUBLISHABLE_KEY')??Deno.env.get('SUPABASE_ANON_KEY')??'',serviceKey:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'',allowedOrigins:(Deno.env.get('CONCIERGE_ALLOWED_ORIGINS')??'').split(',').map(s=>s.trim()).filter(Boolean)}));}
 catch{return Response.json({code:'unavailable'},{status:503,headers:{'cache-control':'private, no-store, max-age=0'}});}
});
