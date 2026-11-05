import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ClientPlan} from '../src/features/plan/ClientPlan.tsx';
import {NavigationProvider} from '../src/navigation/react.tsx';
import {OverlayProvider} from '../src/ui/index.ts';
import type {ClientPlanProps} from '../src/features/plan/types.ts';
import {MayaWalkthrough} from '../src/features/walkthrough/maya/view.tsx';
import {createMayaDemoController} from '../src/features/walkthrough/maya/controller.ts';

export function renderSharedPlan(props:ClientPlanProps) {
  const navigator={getSnapshot:()=>'/maya',subscribe:()=>()=>{},navigate(){},back(){},backDestination:()=>({name:'plan',routine:'morning'} as const)};
  return renderToStaticMarkup(h(OverlayProvider,{children:h(NavigationProvider,{navigator,children:h(ClientPlan,props)})}));
}
export function renderMaya(controller:ReturnType<typeof createMayaDemoController>) {
  const navigator={getSnapshot:()=>'/maya',subscribe:()=>()=>{},navigate(){},back(){},backDestination:()=>({name:'plan',routine:'morning'} as const)};
  return renderToStaticMarkup(h(OverlayProvider,{children:h(NavigationProvider,{navigator,children:h(MayaWalkthrough,{controller})})}));
}
export {createMayaDemoController};
