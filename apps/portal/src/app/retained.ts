import type {
  CookieLease,
  CookieRequestFactory,
  CookieSessionPort,
} from "../transport/session.ts";
// This local structural facade describes only the real retained JavaScript
// exports used by composition; no auth rewrite.
// @ts-ignore JavaScript declarations are absent in the standalone portal graph; the facade below types the retained exports.
import * as advisor from "../../site/auth/advisor-cookie-session.js";
// @ts-ignore The Root test graph infers this JavaScript module, while the standalone portal graph needs this import annotation.
import * as client from "../../site/auth/client-cookie-session.js";
export interface CookieCapabilities {
  view: boolean;
  edit: boolean;
  publish: boolean;
  confirmPayments: boolean;
}
export interface RetainedCookie extends CookieSessionPort {
  _epoch: number;
  _view: (CookieLease & { capabilities: CookieCapabilities; generation: number }) | null;
  restore(): Promise<unknown>;
  complete(code: string): Promise<unknown>;
  sendLink(
    email: string,
    redirect: string,
    remember: boolean,
  ): Promise<unknown>;
  dispose(): void;
  _end(): void;
}
export interface RetainedOptions {
  onState: () => void;
  fetcher?: typeof fetch;
  now?: () => number;
  locks?: Pick<LockManager, "request">;
}
type Constructor = new (options: RetainedOptions) => RetainedCookie;
export const CookieAdvisor = advisor.CookieAdvisorSession as Constructor;
export const CookieClient = client.CookieClientSession as Constructor;
export const advisorCookieRequest = advisor.createCookieRequest as CookieRequestFactory;
export const clientCookieRequest = client.createClientCookieRequest as CookieRequestFactory;
