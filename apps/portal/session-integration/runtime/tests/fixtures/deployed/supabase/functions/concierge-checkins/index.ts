import { createConciergeAuthenticatedPorts } from '../concierge-operations/runtime.ts';
import { handleCheckinsRequest } from './handler.ts';
import { createCheckinStorage } from './storage.ts';
import type { CheckinRpcCall } from './types.ts';
declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (request: Request) => Promise<Response>): void };

// Source only. Core owns migration, capability, storage/deletion lifecycle and deployment composition.
Deno.serve(async (request: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const shared = createConciergeAuthenticatedPorts<CheckinRpcCall>({ supabaseUrl,
      publicKey: Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      allowedOrigins: (Deno.env.get('CONCIERGE_ALLOWED_ORIGINS') ?? '').split(',').map(value => value.trim()).filter(Boolean),
      allowedRpcNames: ['concierge_checkin_read','concierge_checkin_advisor_read','concierge_checkin_write','concierge_checkin_photo_authorize'],
    });
    const storage = createCheckinStorage({ supabaseUrl, serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' });
    return await handleCheckinsRequest(request,{...shared,storage});
  } catch {
    return new Response(JSON.stringify({code:'unavailable',retryable:true}),{status:503,headers:{
      'content-type':'application/json','cache-control':'private, no-store, max-age=0',pragma:'no-cache',vary:'Origin',
    }});
  }
});
