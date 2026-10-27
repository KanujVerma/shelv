import { handleConciergeRequest } from './handler.ts';
import { createConciergeSupabasePorts } from './runtime.ts';

// Source only: no deployment/config entry or schema changes accompany this adapter.
Deno.serve(async (request: Request) => {
  try {
    const ports = createConciergeSupabasePorts({
      supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
      publicKey: Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      allowedOrigins: (Deno.env.get('CONCIERGE_ALLOWED_ORIGINS') ?? '').split(',').map(value => value.trim()).filter(Boolean),
    });
    return await handleConciergeRequest(request, ports);
  } catch {
    return new Response(JSON.stringify({ code: 'unavailable' }), { status: 503,
      headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store, max-age=0', pragma: 'no-cache', vary: 'Origin' } });
  }
});
