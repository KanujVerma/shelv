// Actual shared components/host callbacks and a plain Window model. No DOM,
// hooks, authority or successful operation implementation is substituted.
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {sourceModule} from './rebuild-maya-five-stage-build.mjs';
const require=createRequire(import.meta.url),jsx=require('react/jsx-runtime'),original={jsx:jsx.jsx,jsxs:jsx.jsxs};
const text=v=>typeof v==='string'?v:Array.isArray(v)?v.map(text).join(''):v?.props?text(v.props.children):'';
let buttons=[],dialogs=[],links=[];
for(const key of ['jsx','jsxs'])jsx[key]=(type,props,...rest)=>{
 if(type==='button')buttons.push({label:text(props.children),props});
 if(type==='a')links.push(props);
 if(typeof type==='function'&&type.name==='Dialog')dialogs.push(props);
 return original[key](type,props,...rest);
};
after(()=>Object.assign(jsx,original));
const {exports:api}=await sourceModule('tests/w0-maya-shell-ssr.ts');
function windowModel(path='/maya'){
 const location={href:'https://portal.invalid'+path,pathname:path,search:''},events=new Map();let state=null;
 const update=url=>{const u=new URL(url,'https://portal.invalid');Object.assign(location,{href:u.href,pathname:u.pathname,search:u.search});};update(path);
 return {location,scrollY:0,document:{activeElement:null,getElementById:()=>null,querySelector:()=>null},scrollTo(){},requestAnimationFrame(){},
  addEventListener(name,fn){if(!events.has(name))events.set(name,new Set());events.get(name).add(fn);},removeEventListener(name,fn){events.get(name)?.delete(fn);},
  history:{scrollRestoration:'auto',get state(){return state;},replaceState(value,_,url){state=value;update(url);},pushState(value,_,url){state=value;update(url);},back(){}}};
}
function fixture(t,stage=1){const scope=api.createMayaApplicationScope(windowModel(api.buildRoute({name:'maya',stage})));t.after(scope.dispose);return scope;}
function render(scope){buttons=[];dialogs=[];links=[];return api.renderMayaApplication(scope);}
function nav(html){return /<nav[^>]*aria-label="main navigation"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1]??'';}
test('actual public App supplies one shared shell and Maya identity inside the client canvas',t=>{
 const scope=fixture(t),html=render(scope);
 for(const name of ['sidebar','contact','identity','topbar','content'])assert.equal((html.match(new RegExp('data-foundation="'+name+'"','g'))??[]).length,1,name);
 assert.match(html,/data-mode="public-demo"/);assert.match(html,/Maya · fictional demo/);assert.match(html,/fictional demo/);
 assert.equal((html.match(/id="portal-content"/g)??[]).length,1);
});
test('guide rail stays outside the actual client shell and canvas',t=>{
 const html=render(fixture(t)),stack=[];let found=false;
 for(const match of html.matchAll(/<\/?([a-z][\w:-]*)\b([^>]*)>/gi)){
  const [tag,name,attrs]=match;if(tag.startsWith('</')){assert.equal(stack.pop()?.name,name);continue;}
  if(name==='aside'&&/class="maya-guide-rail"/.test(attrs)){
   found=true;assert.equal(stack.some(x=>/class="shelv-shell"/.test(x.attrs)),false);
   assert.equal(stack.some(x=>/class="maya-client-canvas"/.test(x.attrs)),false);assert.equal(stack.some(x=>/maya-five-stage/.test(x.attrs)),true);
  }
  if(!['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'].includes(name))stack.push({name,attrs});
 }
 assert.equal(found,true);
});
test('public shell navigation has only a current Maya href and inert explained destinations',t=>{
 const scope=fixture(t,4),html=render(scope),navigation=nav(html);assert.ok(navigation);
 assert.deepEqual([...navigation.matchAll(/href="([^"]*)"/g)].map(x=>x[1]),[api.buildRoute({name:'maya',stage:4})]);
 assert.equal((navigation.match(/aria-disabled="true"/g)??[]).length,3);
 assert.match(html,/history, orders and account are unavailable in this demo/);assert.doesNotMatch(html,/replies within 24 hours|tel:|sms:|mailto:/);
 assert.equal(scope.getSnapshot().controller.getPlanProps().ports,undefined);
});
test('real nonpublic shell keeps all four canonical navigation destinations',t=>{
 const html=api.renderClientShellControl(fixture(t)),navigation=nav(html);
 assert.deepEqual([...navigation.matchAll(/href="([^"]*)"/g)].map(x=>x[1]),['/plan','/history','/orders','/account']);
 assert.match(html,/replies within 24 hours/);assert.doesNotMatch(html,/unavailable in this demo/);
});
test('actual contact and dialog callbacks respect exact opening and context ownership',t=>{
 const scope=fixture(t);render(scope);const contact=buttons.filter(x=>x.label==='text shelv');assert.equal(contact.length,2);
 assert.ok(scope.chrome,'shared App must own the chrome lifetime');contact[0].props.onClick();assert.ok(scope.chrome.getSnapshot().opening);
 render(scope);const old=dialogs.find(x=>x.title==='contact shelv');assert.ok(old);assert.equal(old.open,true);
 scope.getSnapshot().controller.navigate({name:'plan',routine:'evening'});assert.equal(scope.chrome.getSnapshot().opening,null);
 contact[0].props.onClick();assert.equal(scope.chrome.getSnapshot().opening,null);
 render(scope);buttons.find(x=>x.label==='text shelv').props.onClick();const current=scope.chrome.getSnapshot();old.onOpenChange(false);assert.equal(scope.chrome.getSnapshot(),current);assert.ok(current.opening);
});
test('modified public plan clicks preserve the current sample and stale ordinary clicks cannot switch stages',t=>{
 const scope=fixture(t,4);render(scope);const link=links.find(x=>x.href===api.buildRoute({name:'maya',stage:4}));assert.ok(link);
 const event=extra=>({button:0,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...extra});
 for(const modifiers of [{metaKey:true},{ctrlKey:true},{shiftKey:true},{altKey:true},{button:1}]){
  const before=scope.getSnapshot().controller.getSnapshot();link.onClick(event(modifiers));assert.equal(scope.getSnapshot().controller.getSnapshot(),before);
 }
 scope.getSnapshot().controller.selectStage(2);const current=scope.getSnapshot().controller.getSnapshot();link.onClick(event({}));assert.equal(scope.getSnapshot().controller.getSnapshot(),current);
 render(scope);const next=links.find(x=>x.href===api.buildRoute({name:'maya',stage:2}));next.onClick(event({}));assert.equal(scope.getSnapshot().controller.getSnapshot().page,'plan');assert.equal(scope.getSnapshot().controller.getSnapshot().stage,2);
});
test('actual App disposal clears chrome before session and scope observers, including throws',t=>{
 const scope=fixture(t);scope.chrome.open(scope.chrome.getSnapshot());let sessionSeen,scopeSeen;
 scope.getSnapshot().controller.getPlanProps().session.subscribeInvalidation(()=>{sessionSeen=scope.chrome.getSnapshot();throw Error('session observer');});
 scope.subscribe(()=>{scopeSeen=scope.chrome.getSnapshot();throw Error('scope observer');});
 scope.dispose();assert.equal(sessionSeen.opening,null);assert.equal(sessionSeen.retired,true);assert.equal(scopeSeen,sessionSeen);assert.equal(scope.getSnapshot().controller,null);
});
test('a reentrant replacement App retains its own new opening through old cleanup',t=>{
 const win=windowModel(),old=api.createMayaApplicationScope(win);t.after(old.dispose);
 old.chrome.open(old.chrome.getSnapshot());const captured=old.chrome.getSnapshot();let next;
 old.chrome.subscribe(()=>{if(!next&&old.chrome.getSnapshot().retired){next=api.createMayaApplicationScope(win);next.chrome.open(next.chrome.getSnapshot());}});
 old.dispose();assert.ok(next);t.after(next.dispose);const current=next.chrome.getSnapshot();old.chrome.close(captured);
 assert.equal(next.chrome.getSnapshot(),current);assert.ok(current.opening);assert.ok(next.getSnapshot().controller);
});
