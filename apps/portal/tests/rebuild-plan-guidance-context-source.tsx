import {renderToStaticMarkup} from 'react-dom/server';
import {ClientPlan} from '../src/features/plan/ClientPlan.tsx';
import {NavigationProvider} from '../src/navigation/react.tsx';
import {OverlayProvider} from '../src/ui/index.ts';
import type {ClientPlanProps,PlanRoute} from '../src/features/plan/types.ts';
export {createGuidanceDecisionController} from '../src/features/plan/guidanceDecision.ts';
/** Actual feature rendering, without DOM, effects, provider or live HTTP. */
export function renderFeature(props:ClientPlanProps,route:PlanRoute={name:'plan',routine:'morning'}){
 const navigator={getSnapshot:()=>'/plan',subscribe:()=>()=>{},navigate(){},back(){},backDestination:()=>({name:'plan',routine:'morning'} as const),dispose(){}};
 return renderToStaticMarkup(<OverlayProvider><NavigationProvider navigator={navigator}><ClientPlan {...props} navigation={{route,navigate(){},back(){}}}/></NavigationProvider></OverlayProvider>);
}
