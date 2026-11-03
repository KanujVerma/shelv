import type {ApplicationSession} from '../../../app/session.ts';
import {createClientOrdersReadPort} from '../../../app/client-orders-read-request.ts';
import {TransportError} from '../../../transport/session.ts';
import type {ClientOrdersReadCommand,ClientOrdersReadController,ClientOrdersReadSnapshot} from './types.ts';

type Context={readonly owner:string|undefined;readonly generation:number;readonly epoch:number;
  readonly view:ApplicationSession['cookie']['_view'];readonly serverGeneration:number|undefined;readonly csrf:string|undefined};
type Operation={readonly context:Context;readonly abort:AbortController;readonly command:ClientOrdersReadCommand};
const snapshot=(phase:ClientOrdersReadSnapshot['phase'],error:ClientOrdersReadSnapshot['error']=null):ClientOrdersReadSnapshot=>Object.freeze({phase,view:null,error});
const obscured=snapshot('unavailable',503);

/** One creation-bound actual session. Construction/SSR never requests or restores.
 * Parent owns mounting, route applicability, post-commit load and disposal. */
export function createClientOrdersReadController(runtime:ApplicationSession,options?:{isApplicable?:()=>boolean}):ClientOrdersReadController {
  const boundary=runtime.getSnapshot().boundary,port=createClientOrdersReadPort(runtime),listeners=new Set<()=>void>();
  let state=snapshot('idle'),active:Operation|null=null,viewContext:Context|null=null;
  let disposed=false,terminal=false,checking=false,notifying=false,launching=false,started=false;
  let stopRuntime:(()=>void)|undefined,stopBoundary:(()=>void)|undefined;
  function cleanup(fn:(()=>void)|undefined):void {try{fn?.();}catch{/* Complete all captured cleanup. */}}
  function notify():void {
    if(notifying)return;
    notifying=true;
    try{let published:ClientOrdersReadSnapshot;
      do{published=state;for(const fn of [...listeners]){
        if(state!==published||disposed)break;
        if(listeners.has(fn))try{fn();}catch{/* One observer cannot block another or retirement. */}
      }}while(state!==published&&!disposed);
    }finally{notifying=false;}
  }
  function clear(phase:ClientOrdersReadSnapshot['phase'],error:ClientOrdersReadSnapshot['error'],end=false):void {
    if(disposed||terminal)return;
    if(!end&&!active&&!viewContext&&state.phase===phase&&state.error===error&&state.view===null)return;
    terminal=end;
    const old=active;active=null;viewContext=null;state=snapshot(phase,error);
    const a=end?stopRuntime:undefined,b=end?stopBoundary:undefined;
    if(end)stopRuntime=stopBoundary=undefined;
    // Clear before abort, unsubscribe or notification can inspect/reenter.
    cleanup(()=>old?.abort.abort());cleanup(a);cleanup(b);notify();
  }
  function sameSession():boolean {
    return !!boundary&&runtime.getSnapshot().boundary===boundary&&boundary.isCurrent()&&
      runtime.getSnapshot().boundary===boundary&&runtime.cookie.audience==='client'&&runtime.cookie.identity?.role==='client';
  }
  function context():Context {
    const cookie=runtime.cookie,view=cookie._view;
    return {owner:cookie.identity?.ownerId,generation:cookie.generation,epoch:cookie._epoch,
      view,serverGeneration:view?.generation,csrf:view?.csrf};
  }
  function matches(c:Context):boolean {
    const cookie=runtime.cookie;
    return cookie.identity?.ownerId===c.owner&&cookie.generation===c.generation&&cookie._epoch===c.epoch&&
      cookie._view===c.view&&cookie._view?.generation===c.serverGeneration&&cookie._view?.csrf===c.csrf;
  }
  function base(c:Context):boolean {
    if(disposed||terminal)return false;
    if(!sameSession()){clear('ended',401,true);return false;}
    if(runtime.cookie._view?.capabilities.view!==true){clear('denied',403,true);return false;}
    if(runtime.cookie.status!=='ready'||!matches(c)){clear('unavailable',503);return false;}
    return true;
  }
  function current(c:Context):boolean {
    if(checking||!base(c))return false;
    let allowed=false;checking=true;
    try{const applies=options?.isApplicable;allowed=applies===undefined||applies()===true;}
    catch{/* A local callback cannot grant rights. */}
    finally{checking=false;}
    if(!base(c))return false;
    if(!allowed){clear('ended',503,true);return false;}
    // No caller callback after these final actual context/VIEW/READY checks.
    return matches(c)&&runtime.cookie._view?.capabilities.view===true&&runtime.cookie.status==='ready';
  }
  function reconcile():void {
    if(checking||disposed||terminal)return;
    const c=active?.context??viewContext??context();
    current(c);
  }
  function owns(op:Operation):boolean {
    return active===op&&!op.abort.signal.aborted&&current(op.context)&&active===op&&!op.abort.signal.aborted;
  }
  function start():void {
    if(started||disposed||terminal)return;
    started=true;
    const a=runtime.subscribe(reconcile);
    if(disposed||terminal){cleanup(a);return;}stopRuntime=a;
    const b=boundary?.subscribeInvalidation(reconcile);
    if(disposed||terminal){cleanup(b);cleanup(stopRuntime);stopRuntime=undefined;return;}stopBoundary=b;
  }
  async function load():Promise<void> {
    if(disposed||terminal||checking||notifying||launching)return;
    // Take request and operation custody before any caller callback/observer.
    const op:Operation={context:context(),abort:new AbortController(),command:Object.freeze({schemaVersion:1,action:'read_client_orders_v1'})};
    const old=active;active=op;viewContext=null;state=snapshot('loading');launching=true;
    try {
      cleanup(()=>old?.abort.abort());start();
      if(!owns(op))return;
      notify();if(!owns(op))return;
      launching=false;
      const view=await port.execute(op.command,{signal:op.abort.signal,isApplicable:()=>owns(op)});
      if(!owns(op))return;
      active=null;viewContext=op.context;state=Object.freeze({phase:'ready',view,error:null});notify();
      reconcile();
    }catch(error){
      if(active!==op||disposed||terminal)return;
      const status=error instanceof TransportError?error.status:503;
      if(status===401||status===403){clear(status===401?'ended':'denied',status,true);return;}
      if(!owns(op))return;
      const safe:ClientOrdersReadSnapshot['error']=status===400||status===404||status===409||status===413||status===415||status===429?status:503;
      clear('unavailable',safe);
    }finally{
      launching=false;
      if(active===op)clear('unavailable',503);
    }
  }
  return {
    getSnapshot(){
      // A relevance callback may inspect the controller, but cannot receive a
      // private projection before its own final post-callback check completes.
      if(checking)return obscured;
      reconcile();return state;
    },
    subscribe(fn){if(disposed||terminal)return()=>{};listeners.add(fn);return()=>{listeners.delete(fn);};},
    load,
    dispose(){
      if(disposed)return;
      disposed=true;terminal=true;
      const old=active;active=null;viewContext=null;state=snapshot('ended');
      const a=stopRuntime,b=stopBoundary;stopRuntime=stopBoundary=undefined;
      listeners.clear();cleanup(()=>old?.abort.abort());cleanup(a);cleanup(b);
    },
  };
}
