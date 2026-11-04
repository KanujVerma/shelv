import {createElement} from 'react';
import type {ReactNode} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MayaWalkthrough} from '../../src/features/walkthrough/maya/view.tsx';
import {createMayaDemoController} from '../../src/features/walkthrough/maya/controller.ts';
import {NavigationProvider} from '../../src/navigation/react.tsx';
import {OverlayProvider} from '../../src/ui/overlay.tsx';

export {createMayaDemoController};
export function renderSlot(controller:ReturnType<typeof createMayaDemoController>,wrap=true){
  const navigator={getSnapshot:()=>'/maya',subscribe:()=>()=>{},navigate(){},back(){},backDestination:()=>null};
  // A visible placement probe, not a replacement shell or authority source.
  const renderClient=wrap?(children:ReactNode)=>createElement('w3-shell-placement-probe',{},children):undefined;
  return renderToStaticMarkup(<NavigationProvider navigator={navigator}><OverlayProvider><MayaWalkthrough controller={controller} renderClient={renderClient}/></OverlayProvider></NavigationProvider>);
}
