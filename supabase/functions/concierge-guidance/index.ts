import {handleGuidanceRequest} from './handler.ts';
import {createGuidancePorts} from './runtime.ts';
Deno.serve(async(request:Request)=>{
 try{return await handleGuidanceRequest(request,createGuidancePorts({supabaseUrl:Deno.env.get('SUPABASE_URL')??'',publicKey:Deno.env.get('SUPABASE_PUBLISHABLE_KEY')??Deno.env.get('SUPABASE_ANON_KEY')??'',allowedOrigins:(Deno.env.get('CONCIERGE_ALLOWED_ORIGINS')??'').split(',').map(s=>s.trim()).filter(Boolean)}));}
 catch{return new Response(JSON.stringify({code:'unavailable'}),{status:503,headers:{'content-type':'application/json','cache-control':'private, no-store'}});}
});
