import { CookieAdvisor, CookieClient } from "./retained.ts";
import type { RetainedCookie, RetainedOptions } from "./retained.ts";
import {
  createSessionTransport,
  TransportError,
} from "../transport/session.ts";
import type { CookieLease } from "../transport/session.ts";
import type { PlanSessionBoundary } from "../features/plan/types.ts";

export interface ApplicationSessionSnapshot {
  status: string;
  boundary: PlanSessionBoundary | null;
}
export function createApplicationSession({
  audience,
  ...options
}: { audience: "client" | "advisor" } & Omit<RetainedOptions, "onState">) {
  const listeners = new Set<() => void>();
  let snapshot: ApplicationSessionSnapshot = {
      status: "initial",
      boundary: null,
    },
    disposed = false,
    timer: ReturnType<typeof setTimeout> | undefined;
  let captured: {
    owner: string;
    generation: number;
    serverGeneration: number;
    epoch: number;
    lease: CookieLease;
    boundary: PlanSessionBoundary;
    end(): void;
  } | null = null;
  const cookie: RetainedCookie = new (
    audience === "client" ? CookieClient : CookieAdvisor
  )({ ...options, onState: changed });
  const transport = createSessionTransport(cookie, drop);
  function emit() {
    snapshot = { status: cookie.status, boundary: captured?.boundary ?? null };
    const published = snapshot;
    for (const listener of [...listeners]) {
      if (snapshot !== published) break;
      if (listeners.has(listener)) {
        try { listener(); } catch { /* Observer failures cannot block retirement. */ }
      }
    }
  }
  function drop() {
    const prior = captured;
    captured = null;
    snapshot = { status: cookie.status, boundary: null };
    prior?.end();
  }
  function current(c: NonNullable<typeof captured>): boolean {
    if (
      disposed ||
      captured !== c ||
      cookie.identity?.role !== audience ||
      cookie.audience !== audience ||
      cookie.identity.ownerId !== c.owner ||
      cookie.generation !== c.generation ||
      cookie._view?.generation !== c.serverGeneration ||
      cookie._epoch !== c.epoch
    )
      return false;
    if (cookie.status === "ready") return cookie.isCurrent(c.lease);
    // A suspended request is uncertain, not a logout. Never accept its success;
    // the transport still requires ready+isCurrent before calling any decoder.
    const v = cookie._view;
    const suspended = cookie.status === "offline" && v?.csrf === c.lease.csrf;
    if (
      suspended &&
      (cookie.now?.() ?? Date.now()) >=
        Math.min(
          Date.parse(v.idleExpiresAt ?? ""),
          Date.parse(v.absoluteExpiresAt ?? ""),
        )
    ) {
      cookie._end();
      return false;
    }
    return suspended;
  }
  function capture() {
    const v = cookie._view,
      identity = cookie.identity;
    if (
      !v ||
      !identity ||
      identity.role !== audience ||
      cookie.status !== "ready"
    )
      return;
    const memory = new Map<string, unknown>(),
      invalidations = new Set<() => void>();
    let retired = false;
    const c = {
      owner: identity.ownerId,
      generation: cookie.generation,
      serverGeneration: v.generation,
      epoch: cookie._epoch,
      lease: { ...v, localEpoch: cookie._epoch },
      boundary: null as unknown as PlanSessionBoundary,
      end() {
        if (retired) return;
        retired = true;
        memory.clear();
        const observers = [...invalidations];
        invalidations.clear();
        for (const observer of observers) {
          try { observer(); } catch { /* Continue every captured retirement observer. */ }
        }
      },
    };
    const valid = () => {
      if (current(c)) return true;
      if (captured === c) {
        drop();
        emit();
      }
      return false;
    };
    c.boundary = {
      key: crypto.randomUUID(),
      isCurrent: valid,
      subscribeInvalidation(fn) {
        if (retired) return () => {};
        invalidations.add(fn);
        return () => invalidations.delete(fn);
      },
      memory: {
        get<T>(key: string) {
          return valid() ? (memory.get(key) as T | undefined) : undefined;
        },
        set(key, value) {
          if (!valid()) throw new TransportError(401);
          memory.set(key, value);
        },
        delete(key) {
          memory.delete(key);
        },
      },
    };
    captured = c;
  }
  function changed() {
    if (disposed) return;
    // Synchronous invalidation happens before publishing any React snapshot.
    transport.sessionChanged();
    if (captured && !current(captured)) drop();
    if (!captured) capture();
    clearTimeout(timer);
    const v = cookie._view;
    if (v && captured) {
      timer = setTimeout(
        () => {
          if (captured && !current(captured)) {
            drop();
            emit();
          }
        },
        Math.max(
          1,
          Math.min(
            2147483647,
            Math.min(
              Date.parse(v.idleExpiresAt ?? ""),
              Date.parse(v.absoluteExpiresAt ?? ""),
            ) - (cookie.now?.() ?? Date.now()),
          ),
        ),
      );
    }
    emit();
  }
  return {
    cookie,
    transport,
    getSnapshot: () => snapshot,
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    async restore() {
      return cookie.restore();
    },
    async complete(code: string) {
      return cookie.complete(code);
    },
    async sendLink(email: string, returnTo: string, remember: boolean) {
      return cookie.sendLink(email, returnTo, remember);
    },
    async signOut() {
      const ending = transport.signOut();
      emit();
      return ending;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(timer);
      transport.dispose();
      drop();
      cookie.dispose();
      snapshot = { status: cookie.status, boundary: null };
      listeners.clear();
    },
  };
}
export type ApplicationSession = ReturnType<typeof createApplicationSession>;
