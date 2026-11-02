import test from 'node:test';
import assert from 'node:assert/strict';
import {createClientComposition} from '../src/app/client-composition.ts';
import {createPortalNavigator} from '../src/navigation/history.ts';
import {parseRoute} from '../src/navigation/routes.ts';
import {session,renderer,virtualNavigationWindow} from './rebuild-app-v3-history-helper.mjs';
const m=await renderer();
globalThis.fetch=async()=>{throw Error('external network denied');};
for(const token of ['0','not-a-version','1.5','9007199254740992','v2'])test('actual History recovers invalid version '+token+' before mounting a historical controller',async t=>{
 const f=await session(t),connection=createClientComposition(f.runtime);t.after(()=>connection.dispose());
 const path='/history/versions/'+token,route=parseRoute(path),w=virtualNavigationWindow(path),boundary=f.runtime.getSnapshot().boundary;
 assert.equal(route.name,'history-version','preserve retained generic route identity parsing');
 const nav=createPortalNavigator(w.win,{scopeKey:boundary.key});t.after(()=>nav.dispose());
 const html=m.renderToStaticMarkup(m.createElement(m.OverlayProvider,null,m.createElement(m.NavigationProvider,{navigator:nav},m.createElement(m.ClientHistoryContent,{connection,boundary,route,win:w.win,onSignOut(){}}))));
 assert.match(html,/plan version unavailable/);assert.match(html,/href="\/history"/);
 assert.doesNotMatch(html,/loading plan version|historical plan|history-record/);
 assert.equal(f.calls.length,0,'invalid version has no authenticated history or plan dispatch');
});
for(const token of ['1','2'])test('actual positive History version '+token+' retains inert loading composition',async t=>{
 const f=await session(t),connection=createClientComposition(f.runtime);t.after(()=>connection.dispose());
 const path='/history/versions/'+token,w=virtualNavigationWindow(path),boundary=f.runtime.getSnapshot().boundary,nav=createPortalNavigator(w.win,{scopeKey:boundary.key});t.after(()=>nav.dispose());
 const html=m.renderToStaticMarkup(m.createElement(m.OverlayProvider,null,m.createElement(m.NavigationProvider,{navigator:nav},m.createElement(m.ClientHistoryContent,{connection,boundary,route:parseRoute(path),win:w.win,onSignOut(){}}))));
 assert.match(html,/loading plan version/);assert.doesNotMatch(html,/plan version unavailable/);assert.equal(f.calls.length,0);
});

test('negative version tokens remain rejected by the actual route parser',()=>{assert.equal(parseRoute('/history/versions/-1'),null);});
