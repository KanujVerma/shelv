import {createContext, useContext, useRef} from 'react';
import type {ReactNode} from 'react';
import type {ClientPlanProps} from './types.ts';

type ContextProps=Pick<ClientPlanProps,'view'|'mode'|'session'>;
interface ReviewScope {token:object;epoch:number}
export interface ReviewBasis extends ReviewScope {
    view:ClientPlanProps['view'];
    version:number;
    decisionRevision:number;
    mode:ClientPlanProps['mode'];
    session:ClientPlanProps['session'];
}
const Context=createContext<ReviewScope>({token:{},epoch:0});
/** One scope across feature routes. Any enclosing view/mode round trip, session
 * replacement or full renderer remount invalidates a previously reviewable read. */
export function DecisionReviewBoundary({props,children}:{props:ContextProps;children:ReactNode}) {
    const scope=useRef({token:{},epoch:0,view:props.view,mode:props.mode});
    if(scope.current.view!==props.view || scope.current.mode!==props.mode)
        scope.current={...scope.current,view:props.view,mode:props.mode,epoch:scope.current.epoch+1};
    return <Context.Provider value={scope.current}>{children}</Context.Provider>;
}
export const useReviewScope=()=>useContext(Context);
export function fetchedBasis(props:ContextProps,scope:ReviewScope,view:ClientPlanProps['view']):ReviewBasis|null {
    return view.access==='active' && view.plan ? {token:scope.token,epoch:scope.epoch+Number(view!==props.view),view,version:view.plan.version,decisionRevision:view.decisionRevision,mode:props.mode,session:props.session} : null;
}
export function isReviewable(props:ContextProps,scope:ReviewScope,basis:ReviewBasis|null|undefined):boolean {
    return !!basis && props.session.isCurrent() && basis.session===props.session && basis.mode===props.mode && basis.token===scope.token && basis.epoch===scope.epoch && basis.view===props.view && props.view.access==='active' && props.view.plan?.version===basis.version && props.view.decisionRevision===basis.decisionRevision;
}
export function sameFetchedRevision(basis:ReviewBasis,view:ClientPlanProps['view']):boolean {
    return view.access==='active' && view.plan?.version===basis.version && view.decisionRevision===basis.decisionRevision;
}
