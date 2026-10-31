import {handlePlanRequest} from './handler.ts';
import {createPlanPorts} from './runtime.ts';
Deno.serve(async(request:Request)=>{
 try{return await handlePlanRequest(request,createPlanPorts({supabaseUrl:Deno.env.get('SUPABASE_URL')??'',publicKey:Deno.env.get('SUPABASE_PUBLISHABLE_KEY')??Deno.env.get('SUPABASE_ANON_KEY')??'',allowedOrigins:(Deno.env.get('CONCIERGE_ALLOWED_ORIGINS')??'').split(',').map(s=>s.trim()).filter(Boolean)}));}
 catch{return new Response(JSON.stringify({code:'unavailable'}),{status:503,headers:{'content-type':'application/json','cache-control':'private, no-store'}});}
});
