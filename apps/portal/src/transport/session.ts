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
export type CookieChannel = 'operations'|'payments'|'checkins'|'admission'|'walkthroughs'|'plans'|'care'|'reviews'|'guidance';
export type CookieRequestFactory = (channel: CookieChannel, session: CookieSessionPort) => (command: unknown, options?: OperationOptions)=>Promise<unknown>;
export type OperationKind = 'read'|'write';
export class TransportError extends Error {
  readonly status: number;
  readonly outcome: 'rejected'|'uncertain'|'session-ended';
  constructor(status: number, kind: OperationKind='read') {
    super(status===401?'your session has ended. sign in again.':status===403?'you do not have access to this action.':status===409?'this changed. review the latest version before trying again.':status===503 && kind==='write'?'the result is uncertain. check its status before retrying.':'we could not complete this request.');
    this.name='TransportError';this.status=status;
    this.outcome=status===401?'session-ended':status===503 && kind==='write'?'uncertain':'rejected';
  }
}
export function createSessionTransport(session: CookieSessionPort) {
  const audience=session.audience;
  const memory=new Map<string,unknown>(),listeners=new Set<()=>void>(),controllers=new Set<AbortController>();
  let generation=session.generation,owner=session.identity?.ownerId,ended=false;
  function invalidate() {memory.clear();controllers.forEach(c=>c.abort());controllers.clear();listeners.forEach(fn=>fn());}
  function sessionChanged() {
    if (generation!==session.generation || owner!==session.identity?.ownerId || audience!==session.audience || session.identity?.role!==audience || !session.identity || session.status==='signedout') {
      generation=session.generation;owner=session.identity?.ownerId;invalidate();
    }
  }
  function accessible() {
    sessionChanged();
    if (ended || !session.identity || session.audience!==audience || session.identity.role!==audience || !['ready','offline'].includes(session.status)) throw new TransportError(401);
  }
  function bind<Input,Output>({kind,invoke,decode}: {kind: OperationKind; invoke: (input: Input,options: OperationOptions&{signal: AbortSignal})=>Promise<unknown>; decode: (value: unknown)=>Output}): OperationPort<Input,Output> {
    return {async execute(input,options={}) {
      accessible();if (session.status!=='ready') throw new TransportError(503,kind);
      const startGeneration=session.generation,startOwner=session.identity?.ownerId;
      const isApplicable=options.isApplicable;
      const applicability=(guard:()=>void)=>{
        if(isApplicable===undefined)return;
        guard();let applies=false;
        try{applies=typeof isApplicable==='function'&&isApplicable()===true;}catch{/* Pure local denial; callback errors are never authority/errors from HTTP. */}
        guard();if(!applies)throw new TransportError(503,kind);
      };
      applicability(()=>{
        accessible();
        if(ended||session.audience!==audience||session.identity?.role!==audience||session.identity.ownerId!==startOwner||session.generation!==startGeneration)throw new TransportError(401);
        if(session.status!=='ready')throw new TransportError(503,kind);
      });
      let lease: CookieLease;
      try {lease=await session.acquire();} catch (error) {sessionChanged();throw safeError(error,kind);}
      if (ended || session.generation!==startGeneration || session.identity?.ownerId!==startOwner || !session.isCurrent(lease)) {sessionChanged();throw new TransportError(401);}
      const privateCurrent=()=>{
        if(ended||session.audience!==audience||session.identity?.role!==audience||session.identity.ownerId!==startOwner||session.generation!==startGeneration||!session.isCurrent(lease)){sessionChanged();throw new TransportError(401);}
      };
      applicability(privateCurrent);
      const controller=new AbortController(),abort=()=>controller.abort();controllers.add(controller);
      if (options.signal?.aborted) controller.abort();
      options.signal?.addEventListener('abort',abort,{once:true});
      try {
        if (controller.signal.aborted) throw new TransportError(503,kind);
        applicability(privateCurrent);
        const value=await invoke(input,{signal:controller.signal,...(isApplicable===undefined?{}:{isApplicable})});
        if (ended || session.audience!==audience || session.generation!==startGeneration || !session.isCurrent(lease)) throw new TransportError(401);
        if (controller.signal.aborted) throw new TransportError(503,kind);
        applicability(privateCurrent);
        // Decoders are supplied by W1's versioned strict response contracts.
        const decoded=decode(value);applicability(privateCurrent);return decoded;
      } catch (error) {
        // Real factories check the lease, then suspend on 503 before rethrowing.
        // isCurrent intentionally rejects offline results, so only that error
        // path may use the retained epoch/deadlines. Never accept a late success.
        const live=session.isCurrent(lease);
        const suspended=(error as {status?: unknown}|null)?.status===503 && suspendedLease(session,lease);
        const current=!ended && session.audience===audience && session.identity?.role===audience &&
          session.identity.ownerId===startOwner && session.generation===startGeneration && (live || suspended);
        sessionChanged();if (!current) throw new TransportError(401);
        if(![401,403].includes((error as {status?:number}|null)?.status??0))applicability(()=>{
          const live=session.isCurrent(lease),suspended=(error as {status?:unknown}|null)?.status===503&&suspendedLease(session,lease);
          if(ended||session.audience!==audience||session.identity?.role!==audience||session.identity.ownerId!==startOwner||session.generation!==startGeneration||!(live||suspended)){sessionChanged();throw new TransportError(401);}
        });
        throw safeError(error,kind);
      } finally {controllers.delete(controller);options.signal?.removeEventListener('abort',abort);}
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
function suspendedLease(session: CookieSessionPort,lease: CookieLease): boolean {
  return session.status==='offline' && session._epoch===lease.localEpoch && Number.isFinite(session._epoch) &&
    (session.now?.() ?? Date.now())<Math.min(Date.parse(lease.idleExpiresAt ?? ''),Date.parse(lease.absoluteExpiresAt ?? ''));
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
