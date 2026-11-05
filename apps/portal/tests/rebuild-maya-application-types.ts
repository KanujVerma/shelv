import type {MayaApplicationScope} from '../src/app/MayaApplication.tsx';
import {createMayaApplicationScope,MayaApplication,MayaApplicationContent} from '../src/app/MayaApplication.tsx';
import type {ApplicationSession} from '../src/app/session.ts';
declare const win:Window;
declare const runtime:ApplicationSession;
const scope:MayaApplicationScope=createMayaApplicationScope(win);
MayaApplicationContent({scope});MayaApplication({stage:5});
// @ts-expect-error No operation port or readiness/authority override.
createMayaApplicationScope(win,{runtime,ready:true});
// @ts-expect-error Only canonical public stages.
MayaApplication({stage:6});
// @ts-expect-error Content needs a real lifetime scope, not a controller substitute.
MayaApplicationContent({scope:{navigator:scope.navigator,getSnapshot:scope.getSnapshot,subscribe:scope.subscribe,dispose:scope.dispose}});
