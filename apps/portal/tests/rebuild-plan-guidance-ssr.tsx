import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ClientPlan} from '../src/features/plan/ClientPlan.tsx';
import {NavigationProvider} from '../src/navigation/react.tsx';
import {OverlayProvider} from '../src/ui/index.ts';
import type {ClientPlanReadView,PlanRoute,PlanSessionBoundary} from '../src/features/plan/types.ts';
export function renderPlan(view:ClientPlanReadView,route:PlanRoute,extra={}){
 const memory=new Map();const session:PlanSessionBoundary={key:'ssr-synthetic',isCurrent:()=>true,subscribeInvalidation:()=>()=>{},memory:{get:k=>memory.get(k),set:(k,v)=>memory.set(k,v),delete:k=>memory.delete(k)}};
 const navigator={getSnapshot:()=>'/plan',subscribe:()=>()=>{},navigate(){},back(){},backDestination:()=>null,dispose(){}};
 return renderToStaticMarkup(h(OverlayProvider,null,h(NavigationProvider,{navigator},h(ClientPlan,{view,session,mode:'client',navigation:{route,navigate(){},back(){}},...extra}))));
}
