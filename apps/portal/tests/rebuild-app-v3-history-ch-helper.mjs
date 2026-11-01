// Actual Session/cookie/raw Review/Root/W4/canonical navigator. Structured-clone
// plain Window controls, never a DOM/browser or successful business-port stub.
import {createPortalNavigator} from '../src/navigation/history.ts';
import {createClientComposition,deferClientHistoryRestoration} from '../src/app/client-composition.ts';
import {createBrowserHistoricalNavigation} from '../src/app/preview-navigation.ts';
import {session,virtualNavigationWindow,view,page,uid} from './rebuild-app-v3-history-helper.mjs';
export async function chFixture(t,path='/history/versions/1'){
 let failure=null;
 const actual=await session(t,command=>{
  if(failure)return failure(command);
  if(command.action==='read_client_plan_v3'){
   const value=view();value.currentGuidance.snapshot.currentPublication.version=2;
   if(command.version===1)value.currentGuidance.mode='historical_document';
   else{value.plan.version=2;value.currentGuidance.snapshot.publication.version=2;value.use.planProducts.forEach(p=>p.product.publication.version=2);}
   return value;
  }
  const p=page();p.heads.publicationVersion=2;p.entries=[{kind:'publication',publication:{version:1,documentSchemaVersion:3},publishedAt:'2026-10-30T12:00:00Z',recordedBy:uid(7)}];return p;
 });
 const boundary=actual.runtime.getSnapshot().boundary,connection=createClientComposition(actual.runtime),w=virtualNavigationWindow(path),frames=[],effects=[],history=w.win.history;
 const getter=Object.getOwnPropertyDescriptor(history,'state').get,replace=history.replaceState,push=history.pushState;
 Object.defineProperty(history,'state',{get:()=>structuredClone(getter.call(history))});history.replaceState=(v,title,url)=>replace.call(history,structuredClone(v),title,url);history.pushState=(v,title,url)=>push.call(history,structuredClone(v),title,url);
 w.win.requestAnimationFrame=fn=>{frames.push(fn);return frames.length;};w.win.scrollTo=({top})=>{w.win.scrollY=top;effects.push(['scroll',top]);};w.win.document.getElementById=id=>({focus:()=>effects.push(['focus',id])});w.win.document.querySelector=()=>({focus:()=>effects.push(['focus','heading'])});
 const navigator=createPortalNavigator(w.win,{scopeKey:boundary.key,deferRestoration:deferClientHistoryRestoration}),stop=navigator.subscribe(()=>{}),cursors=[],offs=[];
 t.after(()=>{offs.forEach(off=>off());cursors.forEach(c=>c.dispose());connection.dispose();stop();navigator.dispose();});
 const flush=()=>frames.splice(0).forEach(fn=>fn());
 function cursor(version=1){const key='history-navigation:'+version;let c=boundary.memory.get(key);if(!c){c=createBrowserHistoricalNavigation(w.win,navigator,version,()=>boundary.isCurrent());boundary.memory.set(key,c);cursors.push(c);}return c;}
 async function selected(version=1){const c=connection.createVersionController(version);await c.refresh();if(c.getSnapshot().error)throw Error('selected source read failed');return c.getSnapshot().view;}
 async function historyReady(){const result=await connection.history.restoration.restore(null).ready;const ticket=navigator.restoration.getSnapshot();if(ticket)navigator.restoration.complete(ticket,'fallback',()=>boundary.isCurrent()&&connection.history.restoration.isCurrent(result));flush();return result;}
 function capture(top=780,focus='history-version-opener:publication:1'){w.win.scrollY=top;w.win.document.activeElement.id=focus;w.fire('scroll');w.fire('focusin');return w.win.history.state.shelvNavigation.entryId;}
 return {...actual,w,navigator,connection,boundary,frames,effects,flush,cursor,selected,historyReady,capture,listen(c){const off=c.subscribe(()=>{});offs.push(off);return off;},entry:()=>w.win.history.state.shelvNavigation.entryId,context:()=>navigator.restoration.read(navigator.restoration.getSnapshot()),fault(fn){failure=fn;}};
}
