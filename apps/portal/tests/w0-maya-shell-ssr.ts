export * from './rebuild-maya-application-ssr.ts';
import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {OverlayProvider} from '../src/ui/index.ts';
import {NavigationProvider} from '../src/navigation/react.tsx';
import {PortalShell} from '../src/shell/PortalShell.tsx';
import type {MayaApplicationScope} from '../src/app/MayaApplication.tsx';
export function renderClientShellControl(scope:MayaApplicationScope){
 return renderToStaticMarkup(h(OverlayProvider,{children:h(NavigationProvider,{navigator:scope.navigator,
  children:h(PortalShell,{identity:'synthetic client',mode:'client',contact:{availability:'service',onContact(){}},children:'synthetic content'})})}));
}
