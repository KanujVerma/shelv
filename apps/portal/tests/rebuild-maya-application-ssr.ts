import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {OverlayProvider} from '../src/ui/index.ts';
import {MayaApplicationContent} from '../src/app/MayaApplication.tsx';
import type {MayaApplicationScope} from '../src/app/MayaApplication.tsx';
export {createMayaApplicationScope} from '../src/app/MayaApplication.tsx';
export {startPortalApplication} from '../src/app/start.tsx';
export {PublicEntry} from '../src/app/Application.tsx';
export {buildRoute,parseRoute} from '../src/navigation/routes.ts';
export {createElement,StrictMode} from 'react';
export {renderToStaticMarkup} from 'react-dom/server';
export function renderMayaApplication(scope:MayaApplicationScope) {
  return renderToStaticMarkup(h(OverlayProvider,{children:h(MayaApplicationContent,{scope})}));
}
