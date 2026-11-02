import {useEffect,useRef,useSyncExternalStore} from 'react';
import {ClientPlan} from '../../plan/ClientPlan.tsx';
import {Button,Badge} from '../../../ui/index.ts';
import {PageHeader,Panel} from '../../../shell/PortalShell.tsx';
import {mayaStage} from './model.ts';
import {MAYA_FOLLOW_UP,MAYA_MOISTURIZER,MAYA_TREATMENT} from './fixture.ts';
import type {MayaDemoController} from './controller.ts';
import './maya.css';

/** Mount within the shared NavigationProvider and OverlayProvider. The parent
 * owns /maya and browser-history composition. No live application is created.
 * The rail is a sibling of the real renderer; it never overlays plan controls. */
export function MayaWalkthrough({controller}:{controller:MayaDemoController}) {
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot),stage=mayaStage(state.stage);
  const planProps=controller.getPlanProps();
  const action=(run:()=>void)=>()=>{
    if(!planProps.session.isCurrent()||controller.getSnapshot()!==state)throw Object.assign(Error('demo is no longer available'),{status:403});
    run();
  };
  const heading=useRef<HTMLHeadingElement>(null),launcher=useRef<HTMLButtonElement>(null),previous=useRef(state);
  useEffect(()=>{
    const before=previous.current;previous.current=state;
    if(before.stage!==state.stage||before.guide!==state.guide||before.generation!==state.generation){
      if(state.guide==='open')heading.current?.focus({preventScroll:true});else launcher.current?.focus({preventScroll:true});
    }
  },[state]);
  const guided=state.guide==='open';
  return <div className={`maya-five-stage ${guided?'maya-guide-open':''}`} data-maya-stage={stage.id}>
    <div className="maya-client-canvas">
      <div className="maya-sample-status"><Badge>fictional staged sample</Badge><p>all choices, reports and example receipt states stay in this demo. nothing is sent, purchased or paid.</p>
        {!guided?<Button ref={launcher} variant="secondary" onClick={action(controller.reopen)}>{state.guide==='collapsed'?'show guide':'view tour'}</Button>:null}
        <Button variant="ghost" onClick={action(controller.reset)}>reset demo</Button>
      </div>
      {state.page==='follow-up'?<>
        <PageHeader title="sample follow-up" description="authored example · text exchange and later review"/>
        <Panel><h2>help between reviews</h2><p>this sample exchange happened outside the portal. no message is sent here.</p>{MAYA_FOLLOW_UP.messages.map((m,i)=><blockquote key={i}><p>{m.text}</p><cite>{m.speaker}</cite></blockquote>)}</Panel>
        <Panel><h2>an example review</h2><p>occurred {MAYA_FOLLOW_UP.occurredOn} · staged sample</p><p>{MAYA_FOLLOW_UP.summary}</p><p>{MAYA_FOLLOW_UP.reportedUse}</p><p>{MAYA_FOLLOW_UP.decision}</p><p>sample next review: {MAYA_FOLLOW_UP.nextReviewOn}. this is not a booked call.</p><p>the story’s reported use is separate from reports you try with the sample controls.</p></Panel>
      </>:state.page==='next-step'?<>
        <PageHeader title="what comes next" description="fictional sample · no new purchase required"/>
        <Panel><h2>a plan with follow-through</h2><p>we review what you used, how your skin feels and what to keep or change. updates and photos are optional; text, call or video remain available.</p><p>the service is $100 per monthly period, month to month. products are separate. a product choice, receipt or delivery does not record a start.</p><Button onClick={action(controller.explore)}>explore Maya’s plan</Button><Button variant="secondary" onClick={action(controller.replay)}>replay guide</Button></Panel>
      </>:null}
      {state.page==='plan'&&state.stage===1&&guided?<Panel><h2>start with Maya’s priorities</h2><p>Maya’s comfortable basics stay in place while we simplify the layers that pill. the plan keeps the reasons, practical directions and uncertainty together.</p></Panel>:null}
      {state.page!=='next-step'?<>
        {state.stage===3&&state.page==='plan'?<Panel><div className="maya-sample-controls"><h2>try sample use states</h2><p>use the shared form to try your own sample answers, or explore a preset. both change only demo memory.</p>
          <Button onClick={action(()=>controller.navigate({name:'product-use',productId:MAYA_TREATMENT,routine:state.route.routine}))}>try sample use form</Button>
          <Button variant="secondary" onClick={action(controller.receiveExample)}>try sample receipt</Button>
          <Button variant="secondary" onClick={action(()=>controller.reportExample('started-unknown'))}>try sample start · date unknown</Button>
          <Button variant="secondary" onClick={action(()=>controller.reportExample('stopped-unknown'))}>try sample stop · date unknown</Button>
          <Button variant="secondary" onClick={action(()=>controller.reportExample('stopped-unknown',MAYA_MOISTURIZER))}>try CeraVe stop · date unknown</Button>
          <p>{state.exampleReceipt?'example receipt recorded; actual use remains separate.':'no example receipt recorded.'}</p>
          <p>{state.exampleReports.length} sample use {state.exampleReports.length===1?'report':'reports'} in this demo. reset clears them.</p>
        </div></Panel>:null}
        <ClientPlan {...planProps}/>
        <div className="maya-explore-actions" aria-label="explore the public plan">
          <Button variant="ghost" onClick={action(()=>controller.navigate({name:'plan',routine:'morning'}))}>morning routine</Button>
          <Button variant="ghost" onClick={action(()=>controller.navigate({name:'plan',routine:'evening'}))}>evening routine</Button>
          <Button variant="ghost" onClick={action(()=>controller.navigate({name:'product',productId:MAYA_MOISTURIZER,routine:state.route.routine}))}>CeraVe PM details</Button>
          <Button variant="ghost" onClick={action(()=>controller.navigate({name:'product-evidence',productId:MAYA_TREATMENT,routine:state.route.routine}))}>azelaic directions & evidence</Button>
        </div>
      </>:null}
    </div>
    {guided?<aside className="maya-guide-rail" aria-labelledby="maya-guide-heading" onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();action(controller.exit)();}}}>
      <Panel><p className="maya-stage-count" role="status">stage {state.stage} of 5</p><h2 ref={heading} id="maya-guide-heading" tabIndex={-1}>{stage.title}</h2><p>{stage.body}</p>
        <nav className="maya-guide-actions" aria-label="Maya guide">
          <Button variant="secondary" disabled={state.stage===1} onClick={action(controller.back)}>back</Button>
          <Button onClick={action(controller.next)}>{state.stage===5?'finish guide':'next'}</Button>
          <Button variant="ghost" onClick={action(controller.explore)}>explore on my own</Button>
          <Button variant="ghost" onClick={action(controller.collapse)}>hide guide</Button>
          <Button variant="ghost" onClick={action(controller.exit)}>exit guide</Button>
        </nav>
      </Panel>
    </aside>:null}
  </div>;
}
