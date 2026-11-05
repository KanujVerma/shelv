// Prepared source only. Never executed before a separate Parent-bound grant.
// The production main module sees no auto-start sentinel in our HTML.
import {mountPortal} from '../../../apps/portal/src/main.tsx';
import {startPortalApplication} from '../../../apps/portal/src/app/start.tsx';
const element=document.getElementById('w7-application');
if(!element)throw new Error('missing owned mount');
const dispose=startPortalApplication(element,window,mountPortal);
Object.defineProperty(window,'__w7Dispose',{value:dispose,configurable:true});
