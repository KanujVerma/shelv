import {handlePaymentRequest} from './handler.ts';
import {createPaymentPorts} from './runtime.ts';

// Source only. No function configuration, credential setup or deployment is included.
Deno.serve(async(request:Request)=>{
 try{
  const ports=createPaymentPorts({supabaseUrl:Deno.env.get('SUPABASE_URL')??'',publicKey:Deno.env.get('SUPABASE_PUBLISHABLE_KEY')??Deno.env.get('SUPABASE_ANON_KEY')??'',
   serviceKey:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),allowedOrigins:(Deno.env.get('CONCIERGE_ALLOWED_ORIGINS')??'').split(',').map(value=>value.trim()).filter(Boolean),
   recipient:{name:Deno.env.get('CONCIERGE_ZELLE_RECIPIENT_NAME'),email:Deno.env.get('CONCIERGE_ZELLE_RECIPIENT_EMAIL'),phone:Deno.env.get('CONCIERGE_ZELLE_RECIPIENT_PHONE')}});
  return await handlePaymentRequest(request,ports);
 }catch{return new Response(JSON.stringify({code:'unavailable'}),{status:503,headers:{'content-type':'application/json','cache-control':'private, no-store, max-age=0',pragma:'no-cache',vary:'Origin'}});}
});
