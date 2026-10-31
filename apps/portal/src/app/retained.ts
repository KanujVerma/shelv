import type {
  CookieLease,
  CookieRequestFactory,
  CookieSessionPort,
} from "../transport/session.ts";
// The retained JavaScript adapters have no declarations. This local structural
// facade describes only the real exports used by composition; no auth rewrite.
// @ts-expect-error retained JavaScript, exercised with the actual cookie adapters
import * as advisor from "../../site/auth/advisor-cookie-session.js";
// @ts-expect-error retained JavaScript, exercised with the actual cookie adapters
import * as client from "../../site/auth/client-cookie-session.js";
export interface CookieCapabilities {
  view: boolean;
  edit: boolean;
  publish: boolean;
  confirmPayments: boolean;
}
export interface RetainedCookie extends CookieSessionPort {
  _epoch: number;
  _view: (CookieLease & { capabilities: CookieCapabilities }) | null;
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
