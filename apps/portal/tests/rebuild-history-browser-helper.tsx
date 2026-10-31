/** Prepared source for the coordinator's later allocated finite-interception
 * browser lane. Importing this module launches nothing. The coordinator supplies
 * its actual retained Review cookie request; this helper invents no cookie
 * parser, successful port, Auth identity, endpoint, router or persistent store. */
import {StrictMode} from 'react';
import type {ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import type {ApplicationSession} from '../src/app/session.ts';
import type {OperationPort} from '../src/transport/session.ts';
import {ClientHistory,createHistoryController,createHistoryPort} from '../src/features/history/index.ts';
import type {HistoryCommand,HistoryNavigation} from '../src/features/history/index.ts';

export function mountHistoryCandidate({element,runtime,reviewRequest,navigation,screen,wrap=(node)=>node}:{
  element:HTMLElement;
  runtime:ApplicationSession;
  reviewRequest:OperationPort<HistoryCommand,unknown>;
  navigation:HistoryNavigation;
  screen:'history'|'update';
  wrap?:(node:ReactNode)=>ReactNode;
}){
  const boundary=runtime.getSnapshot().boundary;
  if(!boundary?.isCurrent())throw new Error('actual current session required');
  const port=createHistoryPort(runtime,reviewRequest);
  const controller=createHistoryController({session:boundary,mode:'client',port});
  const root=createRoot(element);
  const render=(next:'history'|'update')=>root.render(<StrictMode>{wrap(<ClientHistory controller={controller} screen={next} navigation={navigation}/>)}</StrictMode>);
  render(screen);
  return {controller,render,dispose(){root.unmount();controller.dispose();}};
}
