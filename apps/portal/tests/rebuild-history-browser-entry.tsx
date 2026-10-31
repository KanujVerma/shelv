// Synthetic module host: real shared shell, retained session/factory and W4.
// Screen/navigation/connection controls below are finite harness callbacks, not App routing.
import {useSyncExternalStore} from 'react';
import {createApplicationSession} from '../src/app/session.ts';
import {mountHistoryCandidate} from './rebuild-history-browser-helper.tsx';
import {NavigationProvider} from '../src/navigation/react.tsx';
import {PortalShell} from '../src/shell/PortalShell.tsx';
import {Badge,Button,OverlayProvider} from '../src/ui/index.ts';
import '../src/ui/foundation.css';
import '../src/ui/tokens.css';
import '../src/shell/shell.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/instrument-serif/400.css';
import type {PresentationMode,PortalRoute} from '../src/navigation/routes.ts';
import type {ProductRef} from '../../../src/contracts/PortalCare.ts';
declare global {interface Window {__historyHarness:any;__historyConfig:{screen:'history'|'update';labels?:boolean}}}
const runtime=createApplicationSession({audience:'client'});
const events:unknown[]=[],listeners=new Set<()=>void>();
let screen=window.__historyConfig.screen,candidate:ReturnType<typeof mountHistoryCandidate>;
const path=()=>screen==='history'?'/history':'/history/new';
function show(next:'history'|'update'){screen=next;listeners.forEach(f=>f());candidate.render(next);events.push({navigation:next});}
const navigation={openUpdate(){show('update');},back(){show('history');},openVersion(version:number){events.push({openVersion:version});}};
const navigator={getSnapshot:path,subscribe(fn:()=>void){listeners.add(fn);return()=>listeners.delete(fn);},navigate(route:PortalRoute){events.push({route});if(route.name==='history')show('history');else if(route.name==='history-new')show('update');},back:navigation.back,backDestination:()=>({name:'history' as const}),dispose(){listeners.clear();}};
function Shell({children}:{children:React.ReactNode}){const session=useSyncExternalStore(runtime.subscribe,runtime.getSnapshot,runtime.getSnapshot);return <NavigationProvider navigator={navigator}><OverlayProvider><PortalShell identity="synthetic client" mode="client" contact={{onContact(){events.push({contact:true});},availability:'service'}} status={<div data-harness-connection style={{display:'flex',flexWrap:'wrap',minWidth:0,maxWidth:'100%',gap:'var(--space-8)'}}><Badge>synthetic module</Badge><Button variant="ghost" onClick={()=>void runtime.restore()}>check connection</Button><span aria-label="connection state">{session.status}</span></div>}>{children}</PortalShell></OverlayProvider></NavigationProvider>;}
const actors:Record<string,string>={'11111111-1111-4111-8111-111111111111':'Synthetic Client','33333333-3333-4333-8333-000000000090':'Synthetic Recorder','33333333-3333-4333-8333-000000000091':'Synthetic Amender','33333333-3333-4333-8333-000000000092':'Synthetic Publisher'};
const label=(ref:ProductRef)=>ref.kind==='plan_product'?`product ${ref.productId} · plan version ${ref.publication.version}`:`reported product ${ref.reportedProductId} · descriptor version ${ref.version}`;
function mount(){candidate=mountHistoryCandidate({element:document.getElementById('root')!,runtime,navigation,screen,wrap:node=><Shell>{node}</Shell>,publicProps:{actorLabel:window.__historyConfig.labels===false?undefined:id=>actors[id]??null,productLabel:label,onExport(){events.push({export:true});},onContact(){events.push({contact:true});}}});}
await runtime.restore();mount();
window.__historyHarness={runtime,events,get controller(){return candidate.controller;},snapshot:()=>structuredClone(candidate.controller.getSnapshot()),show,async load(version:number|null=null){await candidate.controller.load(version);},setMode(mode:PresentationMode){candidate.setMode(mode);},remount(){candidate.dispose();mount();},dispose(){candidate.dispose();runtime.dispose();navigator.dispose();}};
