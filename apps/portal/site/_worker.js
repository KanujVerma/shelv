// server/types.ts
var SessionError = class extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
  status;
  code;
};
function demand(condition, status = 400, code = "invalid_request") {
  if (!condition)
    throw new SessionError(status, code);
}
function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return encode(bytes);
}
function encode(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function digest(value) {
  return encode(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}

// server/policy.ts
var PORTAL_ORIGIN = "https://portal.goshelv.com";
var actions = { operations: ["advisor_preview_read_v2", "advisor_list", "advisor_read_v2", "save_intake_v2", "save_draft_v2", "publish_v2", "save_meeting_note"], payments: ["advisor_read", "issue_quote", "confirm_payment", "reject_claim"], checkins: ["advisor_read", "advisor_photo_view", "set_next_checkin", "add_meeting_note"] };
function object(value) {
  demand(value !== null && typeof value === "object" && !Array.isArray(value));
  return value;
}
function exact(value, keys) {
  demand(Object.keys(value).length === keys.length && keys.every((k) => Object.hasOwn(value, k)));
}
function uuid(value) {
  demand(typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
  return value.toLowerCase();
}
function parseCommand(channel, value) {
  const command = object(value);
  demand(typeof command.action === "string" && actions[channel].includes(command.action), 403, "action_forbidden");
  demand(!Object.keys(command).some((k) => ["rpc", "rpcname", "endpoint", "url", "upstream", "function", "functionname", "headers", "authorization", "access_token", "refresh_token", "accesstoken", "refreshtoken"].includes(k.toLowerCase())), 400, "invalid_request");
  if (command.action === "advisor_preview_read_v2") {
    exact(command, ["action", "clientId", "mode", "expectedRevision"]);
    demand(command.mode === "draft" || command.mode === "published");
    demand(command.mode === "draft" ? typeof command.expectedRevision === "number" && Number.isSafeInteger(command.expectedRevision) && command.expectedRevision >= 0 : command.expectedRevision === null);
  }
  if (command.action !== "advisor_list")
    uuid(command.clientId);
  return { kind: "command", channel, command };
}
async function readBounded(stream, max) {
  if (!stream)
    return new Uint8Array();
  const reader = stream.getReader(), chunks = [];
  let total = 0;
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done)
        break;
      total += value.length;
      if (total > max) {
        await reader.cancel();
        throw new SessionError(413, "too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
async function jsonBody(request) {
  demand(request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() === "application/json", 415, "unsupported_media_type");
  const bytes = await readBounded(request.body, 1e5);
  try {
    return object(JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes)));
  } catch (error) {
    if (error instanceof SessionError)
      throw error;
    throw new SessionError(400, "invalid_request");
  }
}
function validateRequest(request, origin) {
  const url = new URL(request.url);
  demand(origin === PORTAL_ORIGIN, 503, "configuration_missing");
  demand(url.origin === origin && !url.username && !url.password, 403, "origin_rejected");
  const host = request.headers.get("host")?.toLowerCase(), canonicalHost = new URL(origin).host;
  demand(!host || host === canonicalHost || host === `${canonicalHost}:443`, 403, "origin_rejected");
  const supplied = request.headers.get("origin"), site = request.headers.get("sec-fetch-site");
  demand((!supplied || supplied === origin) && site !== "cross-site" && site !== "same-site" && site !== "none" && (site === "same-origin" || supplied === origin), 403, "origin_rejected");
  if (request.method === "POST") {
    demand(supplied === origin, 403, "origin_rejected");
    demand(request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() === "application/json", 415, "unsupported_media_type");
    demand((request.headers.get("x-shelv-csrf")?.length ?? 0) > 0 && (request.headers.get("x-shelv-csrf")?.length ?? 0) <= 128, 403, "csrf_rejected");
  }
}
function parsePreview(url) {
  const mode = url.pathname.slice("/api/advisor/preview/".length);
  demand(["draft", "published", "payments", "checkins", "photo"].includes(mode), 404, "not_found");
  const keys = mode === "photo" ? ["clientId", "photoId"] : mode === "draft" ? ["clientId", "expectedRevision"] : ["clientId"];
  demand([...url.searchParams.keys()].length === keys.length && keys.every((k) => url.searchParams.getAll(k).length === 1));
  const clientId = uuid(url.searchParams.get("clientId"));
  if (mode === "photo")
    return { kind: "photo", clientId, photoId: uuid(url.searchParams.get("photoId")) };
  if (mode === "draft") {
    const raw = url.searchParams.get("expectedRevision");
    demand(/^(0|[1-9][0-9]*)$/.test(raw));
    const expectedRevision = Number(raw);
    demand(Number.isSafeInteger(expectedRevision));
    return { kind: "preview", mode, clientId, expectedRevision };
  }
  return { kind: "preview", mode, clientId };
}
var safeCodes = /* @__PURE__ */ new Set(["invalid_request", "invalid_input", "forbidden", "action_forbidden", "not_found", "session_ended", "flow_ended", "flow_replayed", "account_conflict", "csrf_rejected", "origin_rejected", "unsupported_media_type", "too_large", "unavailable", "configuration_missing", "rate_limited", "stale_revision", "stale_draft", "draft_missing", "photo_unavailable", "preview_read_only"]);
function safeError(error) {
  const e = error;
  return { status: typeof e?.status === "number" && [400, 401, 403, 404, 405, 409, 413, 415, 429, 503].includes(e.status) ? e.status : 503, code: typeof e?.code === "string" && safeCodes.has(e.code) ? e.code : "unavailable" };
}

// server/client-policy.ts
var clientActions = {
  operations: ["client_read_v2", "client_read", "decide", "receive", "start"],
  payments: ["client_read", "submit_claim", "confirm_shipping_address", "evidence_url"],
  checkins: ["client_read", "submit_report", "photo_view"]
};
function parseClientCommand(channel, value) {
  const command = object(value);
  demand(Object.hasOwn(clientActions, channel) && typeof command.action === "string" && clientActions[channel].includes(command.action), 403, "action_forbidden");
  demand(!Object.keys(command).some((k) => /^(client_?id|owner_?id|user_?id|rpc(name)?|endpoint|url|upstream|function(name)?|headers|authorization|access_?token|refresh_?token)$/i.test(k)));
  return { kind: "command", channel, command };
}
function parseClientMedia(url) {
  const media = url.pathname.endsWith("/photo") ? "photo" : "evidence";
  exact(Object.fromEntries(url.searchParams), ["id"]);
  demand(url.searchParams.getAll("id").length === 1);
  return { kind: "client-media", media, id: uuid(url.searchParams.get("id")) };
}
function validateClientUpload(channel, metadata, bytes, contentType) {
  demand(channel === "payments" || channel === "checkins", 403, "action_forbidden");
  demand(bytes.byteLength > 0 && bytes.byteLength <= 5242880, 413, "too_large");
  demand((channel === "payments" ? ["image/png", "image/jpeg"] : ["image/png", "image/jpeg", "image/webp"]).includes(contentType), 415, "unsupported_media_type");
  demand(metadata.action === (channel === "payments" ? "upload_evidence" : "upload_photo"), 403, "action_forbidden");
  const keys = channel === "payments" ? ["action", "requestId", "completionRequestId", "expectedRevision", "quoteId", "quoteVersion"] : ["action", "requestId", "completionRequestId", "expectedRevision", "angle"];
  exact(metadata, keys);
  uuid(metadata.requestId);
  uuid(metadata.completionRequestId);
  demand(Number.isSafeInteger(metadata.expectedRevision) && Number(metadata.expectedRevision) >= 0);
  if (channel === "payments") {
    uuid(metadata.quoteId);
    demand(Number.isSafeInteger(metadata.quoteVersion) && Number(metadata.quoteVersion) > 0);
  } else demand(["front", "left", "right"].includes(String(metadata.angle)));
  return { kind: "client-upload", channel, metadata, bytes, contentType };
}

// server/gateway.ts
var noStore = { "Cache-Control": "private, no-store", "Pragma": "no-cache", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
function json(body, status = 200, headers = {}) {
  const h = new Headers(headers);
  for (const [k, v] of Object.entries(noStore))
    h.set(k, v);
  h.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers: h });
}
function cookie(name, id) {
  return `${name}=${id}; Path=/; Secure; HttpOnly; SameSite=Lax`;
}
function getCookie(request, name) {
  const matches = (request.headers.get("cookie") ?? "").split(";").map((p) => p.trim()).filter((p) => p.startsWith(name + "="));
  if (!matches.length)
    return void 0;
  demand(matches.length === 1, 401, "session_ended");
  const id = matches[0].slice(name.length + 1);
  demand(/^[A-Za-z0-9_-]{43}$/.test(id), 401, "session_ended");
  return id;
}
async function call(env, kind, id, command, audience = "advisor") {
  const prefix = audience === "client" ? "client:" : "";
  const name = `${prefix}${kind}:${await digest(`${prefix}${kind}:${id}`)}`;
  const result = await env.ADVISOR_SESSIONS.getByName(name).invoke(audience === "client" ? { ...command, audience } : command);
  demand(result && typeof result.ok === "boolean", 503, "unavailable");
  if (!result.ok)
    throw new SessionError(result.error.status, result.error.code);
  return result.value;
}
async function rate(env, request, scope, audience = "advisor") {
  const ip = request.headers.get("cf-connecting-ip");
  demand(ip && ip.length <= 64, 503, "configuration_missing");
  const result = await call(env, "limit", `${Math.floor(Date.now() / 864e5)}:${ip}`, { type: "limit", scope }, audience);
  demand(result.allowed, 429, "rate_limited");
}
function createGateway(audience) {
  const client = audience === "client", base = `/api/${audience}/`;
  const SESSION = `__Host-shelv_${audience}`, FLOW = `${SESSION}_flow`;
  function clearCookies() {
    const headers = new Headers();
    headers.append("Set-Cookie", `${cookie(SESSION, "")}; Max-Age=0`);
    headers.append("Set-Cookie", `${cookie(`__Host-shelv_${audience}_ending`, "")}; Max-Age=0`);
    return headers;
  }
  return { async fetch(request, env) {
    const dispatch = (kind, id, command) => call(env, kind, id, command, audience);
    const throttle = (scope) => rate(env, request, scope, audience);
    const url = new URL(request.url);
    if (!url.pathname.startsWith(base))
      return env.ASSETS.fetch(request);
    let lockedControl = false, clearUnusableSession = false;
    try {
      const route = client ? url.pathname.replace("/api/client/", "/api/advisor/") : url.pathname;
      if (client) demand(env.CLIENT_SHARED_SESSIONS === "true", 503, "configuration_missing");
      const rawUpload = client && route === "/api/advisor/checkins/photos/upload";
      const known = ["/api/advisor/session", "/api/advisor/auth/request", "/api/advisor/auth/complete", "/api/advisor/session/upgrade", "/api/advisor/logout", "/api/advisor/operations", "/api/advisor/payments", "/api/advisor/checkins"];
      const media = client && /^\/api\/advisor\/media\/(photo|evidence)$/.test(route);
      const preview = !client && /^\/api\/advisor\/preview\/(draft|published|payments|checkins|photo)$/.test(route);
      demand(known.includes(route) && !(client && route.endsWith("/session/upgrade")) || preview || media || rawUpload, 404, "not_found");
      demand(request.method === (route === "/api/advisor/session" || preview || media ? "GET" : "POST"), 405, "invalid_request");
      const multipart = client && request.method === "POST" && ["/api/advisor/payments", "/api/advisor/checkins"].includes(route) && request.headers.get("content-type")?.startsWith("multipart/form-data;");
      if (multipart || rawUpload) {
        const h = new Headers(request.headers);
        h.set("Content-Type", "application/json");
        validateRequest(new Request(request.url, { method: "POST", headers: h }), env.PORTAL_ORIGIN);
      } else validateRequest(request, env.PORTAL_ORIGIN);
      lockedControl = route === "/api/advisor/session";
      demand(env.ADVISOR_SESSIONS && typeof env.ADVISOR_SESSIONS.getByName === "function" && env.PORTAL_ORIGIN === PORTAL_ORIGIN, 503, "configuration_missing");
      if (!preview && !media)
        demand(url.search === "", 400, "invalid_request");
      const fresh = route === "/api/advisor/session" && request.headers.get("x-shelv-new-flow") === "1";
      let sid, fid, staleSession = false;
      try {
        sid = getCookie(request, SESSION);
      } catch (error) {
        clearUnusableSession = lockedControl;
        if (!fresh) throw error;
        staleSession = true;
      }
      try {
        fid = getCookie(request, FLOW);
      } catch (error) {
        if (!fresh) throw error;
      }
      const csrf = request.headers.get("x-shelv-csrf") ?? "";
      const ending = (request.headers.get("cookie") ?? "").split(";").some((v) => v.trim().startsWith(`__Host-shelv_${audience}_ending=`));
      if (ending && route !== "/api/advisor/logout" && !(route === "/api/advisor/session" && request.headers.get("x-shelv-logout") === "1")) demand(false, 401, "session_ended");
      if (route === "/api/advisor/session") {
        if (request.headers.get("x-shelv-logout") === "1") {
          demand(sid || fid, 401, "session_ended");
          if (sid) {
            try {
              return json(await dispatch("session", sid, { type: "session.logout-context" }));
            } catch (error) {
              if (error instanceof SessionError && error.status === 401) clearUnusableSession = true;
              if (!(error instanceof SessionError && error.status === 401 && fid)) throw error;
            }
          }
          return json(await dispatch("flow", fid, { type: "flow.logout-context" }), 200, clearUnusableSession ? clearCookies() : {});
        }
        let session = null;
        if (sid) {
          try {
            session = await dispatch("session", sid, { type: "session.view" });
          } catch (error) {
            if (error instanceof SessionError && [401, 403].includes(error.status)) clearUnusableSession = true;
            if (!(fresh && clearUnusableSession)) throw error;
            staleSession = true;
          }
        }
        if (session && !fresh && request.headers.get("x-shelv-flow") !== "1")
          return json({ signedIn: true, ...session });
        await throttle("bootstrap");
        const id = fid ?? randomId(), flow = await dispatch("flow", id, fresh ? { type: "flow.restart", ...session && sid ? { preserveSessionId: sid } : {} } : { type: "flow.bootstrap" });
        const headers = staleSession ? clearCookies() : new Headers();
        if (fresh || !fid) headers.append("Set-Cookie", cookie(FLOW, id));
        return json(session ? { signedIn: true, ...session, flow } : flow, 200, headers);
      }
      if (preview || media) {
        const operation2 = media ? parseClientMedia(url) : parsePreview(url);
        demand(sid, 401, "session_ended");
        const result2 = await dispatch("session", sid, { type: "session.execute", ...csrf ? { csrf } : {}, operation: operation2 });
        return result2.bytes ? new Response(result2.bytes, { status: result2.status, headers: { ...noStore, "Content-Type": result2.contentType ?? "application/octet-stream" } }) : json(result2.body, result2.status);
      }
      if (rawUpload) {
        demand(sid, 401, "session_ended");
        const h = request.headers;
        const revision = h.get("x-expected-revision") ?? "";
        demand(/^(0|[1-9][0-9]*)$/.test(revision));
        const operation2 = validateClientUpload("checkins", { action: "upload_photo", requestId: h.get("x-request-id"), completionRequestId: h.get("x-completion-request-id"), expectedRevision: Number(revision), angle: h.get("x-photo-angle") }, await readBounded(request.body, 5242880), h.get("content-type") ?? "");
        const result2 = await dispatch("session", sid, { type: "session.execute", csrf, operation: operation2 });
        return json(result2.body, result2.status);
      }
      if (multipart) {
        demand(sid, 401, "session_ended");
        const bytes = await readBounded(request.body, 526e4);
        const form = await new Response(bytes, { headers: { "Content-Type": request.headers.get("content-type") } }).formData();
        demand([...form.keys()].length === 2 && form.getAll("metadata").length === 1 && form.getAll("file").length === 1);
        const raw = form.get("metadata"), file = form.get("file");
        demand(typeof raw === "string" && raw.length <= 1e4 && file && typeof file !== "string");
        let metadata;
        try {
          metadata = JSON.parse(raw);
        } catch {
          demand(false);
        }
        const operation2 = validateClientUpload(route.slice("/api/advisor/".length), metadata, new Uint8Array(await file.arrayBuffer()), file.type);
        const result2 = await dispatch("session", sid, { type: "session.execute", csrf, operation: operation2 });
        return json(result2.body, result2.status);
      }
      const body = await jsonBody(request);
      if (route === "/api/advisor/logout") {
        exact(body, []);
        demand(sid || fid, 401, "session_ended");
        let result2, usedSession = false;
        if (sid) {
          try {
            result2 = await dispatch("session", sid, { type: "session.logout", csrf });
            usedSession = true;
          } catch (error) {
            if (!(error instanceof SessionError && error.status === 401 && fid)) throw error;
          }
        }
        if (!usedSession) result2 = await dispatch("flow", fid, { type: "flow.cancel", csrf });
        if (usedSession && fid)
          await dispatch("flow", fid, { type: "flow.retire" });
        return json(result2, 200, clearCookies());
      }
      if (route === "/api/advisor/auth/request") {
        exact(body, client || Object.hasOwn(body, "remember") ? ["email", "remember"] : ["email"]);
        if (client || Object.hasOwn(body, "remember")) demand(typeof body.remember === "boolean");
        demand(fid && typeof body.email === "string", 401, "flow_ended");
        await throttle("otp");
        return json(await dispatch("flow", fid, { type: "flow.request", csrf, email: body.email, remember: body.remember === true }));
      }
      if (route === "/api/advisor/auth/complete" || route === "/api/advisor/session/upgrade") {
        demand(fid, 401, "flow_ended");
        let command;
        if (route.endsWith("/complete")) {
          exact(body, ["code"]);
          demand(typeof body.code === "string");
          command = { type: "flow.complete", csrf, code: body.code, ...sid ? { existingId: sid } : {} };
        } else {
          exact(body, ["accessToken", "refreshToken"]);
          demand(typeof body.accessToken === "string" && typeof body.refreshToken === "string");
          command = { type: "flow.upgrade", csrf, pair: { accessToken: body.accessToken, refreshToken: body.refreshToken }, ...sid ? { existingId: sid } : {} };
        }
        await throttle("auth");
        const result2 = await dispatch("flow", fid, command);
        demand(/^[A-Za-z0-9_-]{43}$/.test(result2.sessionId), 503, "unavailable");
        const remaining = Math.floor((Date.parse(result2.session.absoluteExpiresAt) - Date.now()) / 1e3);
        if (client || result2.session.remembered === true) demand(Number.isSafeInteger(remaining) && remaining > 0 && remaining <= (client ? 2592e3 : 28800), 503, "unavailable");
        return json({ signedIn: true, ...result2.session }, 200, { "Set-Cookie": cookie(SESSION, result2.sessionId) + (result2.session.remembered === true ? `; Max-Age=${remaining}` : "") });
      }
      const channel = route.slice("/api/advisor/".length), operation = client ? parseClientCommand(channel, body) : parseCommand(channel, body);
      demand(sid, 401, "session_ended");
      const result = await dispatch("session", sid, { type: "session.execute", csrf, operation });
      return json(result.body, result.status);
    } catch (error) {
      const { status, code } = safeError(error);
      return json({ code }, status, lockedControl && clearUnusableSession && [401, 403].includes(status) ? clearCookies() : {});
    }
  } };
}
var advisorGateway = /* @__PURE__ */ createGateway("advisor");
var clientGateway = createGateway("client");
var gateway_default = { fetch(request, env) {
  const path = new URL(request.url).pathname;
  if (path === "/api/advisor" || path.startsWith("/api/advisor/"))
    return Promise.resolve(json({ code: "not_found" }, 404));
  return clientGateway.fetch(request, env);
} };

// server/advisor-candidate-gateway.ts
var advisor_candidate_gateway_default = { fetch(request, env) {
  const path = new URL(request.url).pathname;
  if (path === "/api/advisor" || path.startsWith("/api/advisor/")) {
    if (env.ADVISOR_SHARED_SESSIONS !== "true") return gateway_default.fetch(request, env);
    return advisorGateway.fetch(request, env);
  }
  return gateway_default.fetch(request, env);
} };
export {
  advisor_candidate_gateway_default as default
};
