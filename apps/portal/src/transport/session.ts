// @ts-ignore retained JavaScript; private denial provenance is exercised with real cookies
import {cookieDenialStatus} from '../../site/auth/advisor-cookie-session.js';
import type {PresentationMode} from '../navigation/routes.ts';

/** Structural boundary of the retained CookieClientSession / CookieAdvisorSession.
 * The gateway and its factories remain responsible for cookies, CSRF, same-origin,
 * no-store, action allowlists, owner authorization and lease expiry. No URLs here.
 */
export interface CookieLease {ownerId: string; localEpoch: number; csrf: string; idleExpiresAt?: string; absoluteExpiresAt?: string}
export interface CookieSessionPort {
  readonly audience: 'client'|'advisor';
  readonly status: string;
  readonly generation: number;
  readonly identity: {ownerId: string; role: string} | null;
  /** Retained cookie sessions expose their local epoch and clock. Read only:
   * an offline error must still belong to the original, unexpired lease. */
  readonly _epoch?: number;
  now?: ()=>number;
  acquire(): Promise<CookieLease>;
  isCurrent(lease: CookieLease): boolean;
  signOut(): Promise<unknown>;
}
/** Local UI relevance only. This predicate can deny, never grant authority. */
export interface OperationOptions {signal?: AbortSignal;isApplicable?:()=>boolean}
export interface OperationPort<Input,Output> {execute(input: Input, options?: OperationOptions): Promise<Output>}
export type CookieChannel = 'operations'|'payments'|'checkins'|'admission'|'walkthroughs'|'plans'|'care'|'reviews'|'guidance'|'notifications'|'account-profile'|'account-contact'|'client-orders';
export type CookieRequestFactory = (channel: CookieChannel, session: CookieSessionPort) => (command: unknown, options?: OperationOptions)=>Promise<unknown>;
export type OperationKind = 'read'|'write';
export {TransportError} from './error.ts';
import {TransportError} from './error.ts';

export function createSessionTransport(session: CookieSessionPort, retireBoundary: ()=>void = ()=>{}) {
  const audience=session.audience;
  const memory=new Map<string,unknown>(),listeners=new Set<()=>void>(),controllers=new Set<AbortController>();
  let generation=session.generation,owner=session.identity?.ownerId,role=session.identity?.role,
    observedAudience=session.audience,signedOut=session.status==='signedout',ended=false,invalidating=false;
  function invalidate() {
    if(invalidating)return;
    invalidating=true;
    try{
    const pending=[...controllers], observers=[...listeners];
    memory.clear();controllers.clear();
    // Local context retirement can only deny. It runs after memory is cleared
    // and before aborts or observers can inspect the producing App boundary.
    try {retireBoundary();} catch {/* Cleanup must still reach the retained session. */}
    for(const controller of pending){try{controller.abort();}catch{/* Continue captured cleanup. */}}
    for(const observer of observers){if(listeners.has(observer)){try{observer();}catch{/* Isolate each observer. */}}}
    }finally{invalidating=false;}
  }
  function sessionChanged() {
    const nextGeneration=session.generation,nextIdentity=session.identity,nextAudience=session.audience,
      nextOwner=nextIdentity?.ownerId,nextRole=nextIdentity?.role,nextSignedOut=session.status==='signedout';
    if (generation!==nextGeneration || owner!==nextOwner || role!==nextRole || observedAudience!==nextAudience || signedOut!==nextSignedOut) {
      generation=nextGeneration;owner=nextOwner;role=nextRole;observedAudience=nextAudience;signedOut=nextSignedOut;
      invalidate();
    }
  }
  function accessible() {
    sessionChanged();
    if (ended || !session.identity || session.audience!==audience || session.identity.role!==audience || !['ready','offline'].includes(session.status)) throw new TransportError(401);
  }
  function bind<Input,Output>({kind,invoke,decode}: {kind: OperationKind; invoke: (input: Input,options: OperationOptions&{signal: AbortSignal})=>Promise<unknown>; decode: (value: unknown)=>Output}): OperationPort<Input,Output> {
    return {async execute(input,options={}) {
      accessible();if (session.status!=='ready') throw new TransportError(503,kind);
      const retained=session as CookieSessionPort&{readonly _view?:{ownerId:string;generation:number;csrf:string;idleExpiresAt:string;absoluteExpiresAt:string}};
      const startGeneration=session.generation,startOwner=session.identity?.ownerId,startEpoch=session._epoch,startServerGeneration=retained._view?.generation;
      const same=()=>!ended&&session.audience===audience&&session.identity?.role===audience&&
        session.identity.ownerId===startOwner&&session.generation===startGeneration&&session._epoch===startEpoch&&retained._view?.generation===startServerGeneration;
      const isApplicable=options.isApplicable;
      const applicability=(guard:()=>void)=>{
        if(isApplicable===undefined)return;
        guard();let applies=false;
        try{applies=typeof isApplicable==='function'&&isApplicable()===true;}catch{/* Pure local denial; callback errors are never authority/errors from HTTP. */}
        guard();if(!applies)throw new TransportError(503,kind);
      };
      applicability(()=>{
        accessible();
        if(!same())throw new TransportError(401);
        if(session.status!=='ready')throw new TransportError(503,kind);
      });
      let lease: CookieLease;
      try {lease=await session.acquire();} catch (error) {sessionChanged();if(!same())throw new TransportError(401);throw safeError(error,kind);}
      const privateCurrent=()=>{
        const live=same()&&session.isCurrent(lease);
        if(!same()||!live||session.status!=='ready'){sessionChanged();throw new TransportError(401);}
      };
      // This predicate classifies failures only. It never admits invocation,
      // decoding or private success, and requires an actually acquired lease.
      const offlineCurrent=()=>{
        const matches=()=>same()&&session.status==='offline'&&Number.isFinite(startEpoch)&&lease.localEpoch===startEpoch&&
          lease.ownerId===startOwner&&retained._view?.ownerId===startOwner&&retained._view?.csrf===lease.csrf;
        if(!matches())return false;
        let now:number;try{now=session.now?.()??Date.now();}catch{return false;}
        const view=retained._view;
        return matches()&&!!view&&Number.isFinite(now)&&now<Math.min(Date.parse(view.idleExpiresAt),Date.parse(view.absoluteExpiresAt));
      };
      const errorCurrent=()=>{
        sessionChanged();
        const live=same()&&session.isCurrent(lease),offline=offlineCurrent();
        if(!same()||!(live&&session.status==='ready'||offline)){sessionChanged();throw new TransportError(401);}
        return offline;
      };
      const classify=(error:unknown):TransportError=>{
        errorCurrent();
        const status=(error as {status?:unknown}|null)?.status,denial=cookieDenialStatus(error,session,lease);
        const offline=errorCurrent();
        if(offline&&denial!==401&&denial!==403)return new TransportError(503,kind);
        if(status!==401&&status!==403)applicability(()=>{errorCurrent();});
        const result=safeError(error,kind);errorCurrent();return result;
      };
      const controller=new AbortController(),abort=()=>controller.abort();controllers.add(controller);
      const signal=options.signal;
      let decoded!:Output,failed=false,failure:unknown;
      try {
        privateCurrent();applicability(privateCurrent);
        if(signal?.aborted)controller.abort();
        signal?.addEventListener('abort',abort,{once:true});
        if (controller.signal.aborted) throw new TransportError(503,kind);
        applicability(privateCurrent);
        const value=await invoke(input,{signal:controller.signal,...(isApplicable===undefined?{}:{isApplicable})});
        privateCurrent();
        if (controller.signal.aborted) throw new TransportError(503,kind);
        applicability(privateCurrent);
        // Decoders are supplied by W1's versioned strict response contracts.
        decoded=decode(value);privateCurrent();applicability(privateCurrent);
      } catch (error) {
        failed=true;failure=error;
      } finally {
        controllers.delete(controller);
        try{signal?.removeEventListener('abort',abort);}catch(error){if(!failed){failed=true;failure=error;}}
      }
      if(failed)throw classify(failure);
      // Cleanup is callback-capable too. Recheck before the only private return.
      try{privateCurrent();applicability(privateCurrent);if(controller.signal.aborted||signal?.aborted)throw new TransportError(503,kind);}
      catch(error){throw classify(error);}
      return decoded;
    }};
  }
  return {
    bind,
    /** Supply createClientCookieRequest or createCookieRequest from the retained transport. */
    bindCookieChannel<Input,Output>(factory: CookieRequestFactory, channel: CookieChannel, kind: OperationKind, decode: (value: unknown)=>Output): OperationPort<Input,Output> {
      return bind({kind,invoke:factory(channel,session),decode});
    },
    sessionChanged,
    subscribeInvalidation(listener: ()=>void) {listeners.add(listener);return()=>listeners.delete(listener);},
    memory: {
      get<T=unknown>(key: string): T | undefined {sessionChanged();return memory.get(key) as T|undefined;},
      set(key: string,value: unknown) {accessible();memory.set(key,value);},
      delete(key: string) {memory.delete(key);},
    },
    async signOut() {ended=true;invalidate();return session.signOut();},
    dispose() {ended=true;invalidate();listeners.clear();},
  };
}
function safeError(error: unknown, kind: OperationKind): TransportError {
  if (error instanceof TransportError) return error;
  const status=(error as {status?: unknown}|null)?.status;
  return new TransportError(typeof status==='number' && [400,401,403,404,409,413,415,429,503].includes(status)?status:503,kind);
}
/** Fixtures accept a memory reducer, with no cookie/session/fetch argument. */
export function createDemoPort<Input,Output>(reduce: (input: Input)=>Output): OperationPort<Input,Output> & {readonly mode: Extract<PresentationMode,'public-demo'>} {
  return {mode:'public-demo',async execute(input) {return reduce(input);}};
}
