import {CookieAdvisor,CookieClient} from './retained.ts';
import type {RetainedCookie,RetainedOptions} from './retained.ts';
import {createSessionTransport,TransportError} from '../transport/session.ts';
import type {CookieLease} from '../transport/session.ts';
import type {PlanSessionBoundary} from '../features/plan/types.ts';

export interface ApplicationSessionSnapshot {status:string;boundary:PlanSessionBoundary|null}
export function createApplicationSession({audience,...options}:{audience:'client'|'advisor'} & Omit<RetainedOptions,'onState'>) {
  const listeners=new Set<()=>void>();
  let snapshot:ApplicationSessionSnapshot={status:'initial',boundary:null},disposed=false,timer:ReturnType<typeof setTimeout>|undefined;
  let captured:{owner:string;generation:number;epoch:number;lease:CookieLease;boundary:PlanSessionBoundary;end():void}|null=null;
  const cookie:RetainedCookie=new (audience==='client'?CookieClient:CookieAdvisor)({...options,onState:changed});
  const transport=createSessionTransport(cookie);
  function emit(){snapshot={status:cookie.status,boundary:captured?.boundary??null};listeners.forEach(fn=>fn());}
  function drop(){const prior=captured;captured=null;prior?.end();}
  function current(c:NonNullable<typeof captured>):boolean {
    if(disposed||captured!==c||cookie.identity?.role!==audience||cookie.audience!==audience||cookie.identity.ownerId!==c.owner||cookie.generation!==c.generation||cookie._epoch!==c.epoch)return false;
    if(cookie.status==='ready')return cookie.isCurrent(c.lease);
    // A suspended request is uncertain, not a logout. Never accept its success;
    // the transport still requires ready+isCurrent before calling any decoder.
    const v=cookie._view;
    return cookie.status==='offline'&&v?.csrf===c.lease.csrf&&(cookie.now?.()??Date.now())<Math.min(Date.parse(v.idleExpiresAt??''),Date.parse(v.absoluteExpiresAt??''));
  }
  function capture() {
    const v=cookie._view,identity=cookie.identity;
    if(!v||!identity||identity.role!==audience||cookie.status!=='ready')return;
    const memory=new Map<string,unknown>(),invalidations=new Set<()=>void>();
    const c={owner:identity.ownerId,generation:cookie.generation,epoch:cookie._epoch,lease:{...v,localEpoch:cookie._epoch},boundary:null as unknown as PlanSessionBoundary,end(){memory.clear();invalidations.forEach(fn=>fn());invalidations.clear();}};
    const valid=()=>{if(current(c))return true;if(captured===c){drop();emit();}return false;};
    c.boundary={key:crypto.randomUUID(),isCurrent:valid,subscribeInvalidation(fn){invalidations.add(fn);return()=>invalidations.delete(fn);},memory:{get<T>(key:string){return valid()?memory.get(key) as T|undefined:undefined;},set(key,value){if(!valid())throw new TransportError(401);memory.set(key,value);},delete(key){memory.delete(key);}}};
    captured=c;
  }
  function changed() {
    if(disposed)return;
    // Synchronous invalidation happens before publishing any React snapshot.
    transport.sessionChanged();
    if(captured&&!current(captured))drop();
    if(!captured)capture();
    clearTimeout(timer);
    const v=cookie._view;
    if(v&&captured){timer=setTimeout(()=>{if(captured&&!current(captured)){drop();emit();}},Math.max(1,Math.min(2147483647,Math.min(Date.parse(v.idleExpiresAt??''),Date.parse(v.absoluteExpiresAt??''))-(cookie.now?.()??Date.now()))));}
    emit();
  }
  return {
    cookie,transport,
    getSnapshot:()=>snapshot,
    subscribe(fn:()=>void){listeners.add(fn);return()=>listeners.delete(fn);},
    async restore(){return cookie.restore();},
    async complete(code:string){return cookie.complete(code);},
    async sendLink(email:string,returnTo:string,remember:boolean){return cookie.sendLink(email,returnTo,remember);},
    async signOut(){drop();transport.sessionChanged();emit();return transport.signOut();},
    dispose(){if(disposed)return;transport.dispose();drop();disposed=true;clearTimeout(timer);cookie.dispose();listeners.clear();},
  };
}
export type ApplicationSession=ReturnType<typeof createApplicationSession>;
