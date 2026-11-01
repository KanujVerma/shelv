import {createContext,useContext,useSyncExternalStore} from 'react';
import type {ComponentProps,ReactNode} from 'react';
import {buildRoute,parseRoute} from './routes.ts';
import type {PortalRoute} from './routes.ts';
import type {PortalNavigator} from './history.ts';
import {Button} from '../ui/primitives.tsx';
import {Icon} from '../ui/icons.tsx';
/** Shared links/providers need navigation methods, not deferred-restoration rights. */
export type PortalNavigationCore=Pick<PortalNavigator,'navigate'|'back'|'backDestination'|'getSnapshot'|'subscribe'>;
const NavigationContext=createContext<PortalNavigationCore|null>(null);
export function NavigationProvider({navigator,children}: {navigator: PortalNavigationCore;children: ReactNode}) {return <NavigationContext.Provider value={navigator}>{children}</NavigationContext.Provider>;}
function completeNavigator(value:PortalNavigationCore):value is PortalNavigator {
  if(!('restoration' in value)||!('dispose' in value)||typeof value.dispose!=='function')return false;
  const api=value.restoration;
  return !!api&&typeof api==='object'&&['begin','getSnapshot','read','isCurrent','complete','cancel','capture'].every(name=>typeof Reflect.get(api,name)==='function');
}
/** Returns the actual optional extension; never manufactures restoration methods
 * for a core-only provider. App transport/session authority remains separate. */
export function useCompletePortalNavigator():PortalNavigator|null {
  const navigator=useContext(NavigationContext);
  return navigator&&completeNavigator(navigator)?navigator:null;
}
export function usePortalNavigation() {
  const navigator=useContext(NavigationContext);
  if (!navigator) throw new Error('portal navigation requires NavigationProvider');
  const path=useSyncExternalStore(navigator.subscribe,navigator.getSnapshot,navigator.getSnapshot);
  return {navigator,path,route:parseRoute(path)};
}
export function RouteLink({route,onClick,...props}: Omit<ComponentProps<'a'>,'href'> & {route: PortalRoute}) {
  const {navigator}=usePortalNavigation();
  return <a {...props} href={buildRoute(route)} onClick={event=>{
    onClick?.(event);
    if (!event.defaultPrevented && event.button===0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && (!props.target || props.target==='_self') && !props.download) {event.preventDefault();navigator.navigate(route);}
  }}/>;
}
export function BackButton({children='back',...props}: ComponentProps<typeof Button>) {
  const {navigator}=usePortalNavigation();
  return <Button {...props} variant="ghost" onClick={event=>{props.onClick?.(event);if(!event.defaultPrevented)navigator.back();}}><Icon name="arrow-left"/>{children}</Button>;
}
