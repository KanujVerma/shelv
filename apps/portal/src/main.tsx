import {StrictMode} from 'react';
import type {ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import {OverlayProvider} from './ui/overlay.tsx';
import './ui/foundation.css';
import './shell/shell.css';

/** Composition entry for future real modules. This does not select an audience,
 * initialize auth, invent backend operations or replace the release gateway.
 */
export function mountPortal(element: HTMLElement, content: ReactNode) {
  const root=createRoot(element);
  root.render(<StrictMode><OverlayProvider>{content}</OverlayProvider></StrictMode>);
  return ()=>root.unmount();
}
const previewRoot=document.querySelector<HTMLElement>('[data-foundation-preview]');
if (previewRoot) {
  void import('./shell/__preview.tsx').then(({FoundationPreview})=>mountPortal(previewRoot,<FoundationPreview/>));
}
