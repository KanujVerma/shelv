import {useSyncExternalStore} from 'react';
import type {ReactNode} from 'react';
import {PortalShell} from '../shell/PortalShell.tsx';
import {Dialog,StatusNotice} from '../ui/index.ts';
import type {MayaChromeController} from './maya-chrome.ts';

/** Public demo chrome carries only exact local opening identity. Actual client
 * navigation, contact destinations and business promises never enter it. */
export function MayaClientChrome({chrome,children}:{chrome:MayaChromeController;children:ReactNode}){
 const state=useSyncExternalStore(chrome.subscribe,chrome.getSnapshot,chrome.getSnapshot);
 if(state.retired)return <StatusNotice title="page unavailable"/>;
 return <>
  <PortalShell identity="Maya · fictional demo" mode="public-demo"
   contact={{availability:'service',onContact:()=>chrome.open(state)}}
   publicDemoNavigation={{onPlan:()=>chrome.showPlan(state)}}>
   {children}
  </PortalShell>
  <Dialog open={state.opening!==null} title="contact shelv" onOpenChange={open=>{if(!open)chrome.close(state);}}>
   <p>this is Maya’s fictional sample. no message is sent and no reply is requested.</p>
  </Dialog>
 </>;
}
