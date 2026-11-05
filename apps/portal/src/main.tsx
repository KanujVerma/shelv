import {StrictMode} from 'react';
import type {ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import {OverlayProvider} from './ui/overlay.tsx';
import './ui/foundation.css';
import './shell/shell.css';
import {startPortalApplication} from './app/start.tsx';

/** Shared mount retained for the foundation gallery and application. */
export function mountPortal(element: HTMLElement, content: ReactNode) {
  const root=createRoot(element);
  root.render(<StrictMode><OverlayProvider>{content}</OverlayProvider></StrictMode>);
  return ()=>root.unmount();
}
const previewRoot=document.querySelector<HTMLElement>('[data-foundation-preview]');
if (previewRoot) {
  void import('./shell/__preview.tsx').then(({FoundationPreview})=>mountPortal(previewRoot,<FoundationPreview/>));
}

const applicationRoot=document.querySelector<HTMLElement>('[data-portal-application]');
if(applicationRoot)startPortalApplication(applicationRoot,window,mountPortal);
