import {useEffect,useRef,useState} from 'react';
import type {EffectiveUse,UseHistoryPage,UseHistoryEntry,UseChange} from '../../../../../src/contracts/PortalCare.ts';
import {mapCareResult} from '../../../../../src/contracts/PortalCareMapping.ts';
import type {ClientPlanProps} from './types.ts';
import {Button,StatusNotice} from '../../ui/index.ts';
export const useLabels={not_reported:'use not reported',using:'reported using',paused:'reported paused',stopped:'reported stopped',using_differently:'reported using differently',unreviewed:'unreviewed product'};
export function UseFacts({use,props}:{use:EffectiveUse;props?:ClientPlanProps}){
 const [page,setPage]=useState<UseHistoryPage|null>(null),[error,setError]=useState(false),[loading,setLoading]=useState(false);
 const alive=useRef(true),token=useRef<object|null>(null),context=useRef({use,view:props?.view,mode:props?.mode,session:props?.session,epoch:0});
 if(context.current.use!==use||context.current.view!==props?.view||context.current.mode!==props?.mode||context.current.session!==props?.session){context.current={use,view:props?.view,mode:props?.mode,session:props?.session,epoch:context.current.epoch+1};token.current=null;}
 const epoch=context.current.epoch;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;token.current=null;};},[]);
 useEffect(()=>{setPage(null);setError(false);setLoading(false);},[use,props?.view,props?.mode,props?.session]);
 const event=use.latestEvent,canRead=props?.mode==='client'&&props.ports?.care&&props.session.isCurrent();
 const full=page?.entries.find(e=>e.kind==='use'&&e.event.eventId===event?.eventId||e.kind==='reported_product'&&e.event.initialUse?.eventId===event?.eventId);
 const body=full?.kind==='use'?full.event:full?.kind==='reported_product'?full.event.initialUse:null;
 async function load(cursor:string|null){if(!canRead||!props||!event||token.current)return;const operation={},current=()=>alive.current&&props.session.isCurrent()&&context.current.epoch===epoch&&token.current===operation;token.current=operation;setLoading(true);setError(false);try{const command={schemaVersion:1,action:'read_use_history_v1',product:event.product,cursor,limit:25} as const;const result=mapCareResult(await props.ports!.care!.execute(command),command) as UseHistoryPage;if(current())setPage(prior=>({ ...result,entries:[...(cursor?prior?.entries??[]:[]),...result.entries]}));}catch{if(current())setError(true);}finally{if(token.current===operation){token.current=null;if(alive.current&&context.current.epoch===epoch)setLoading(false);}}}
 return <section className="plan-stack plan-use-facts" data-care-state={use.state}><h3>{useLabels[use.state]}</h3>{use.contradiction?<StatusNotice tone="warning" title="product or reports need clarification">current use and identity are unresolved. published guidance is shown separately for reference.</StatusNotice>:null}
 {use.identity&&use.identity.match!=='yes'?<p>product match: {use.identity.match.replace('_',' ')}. identity remains unresolved.</p>:use.identity?.match==='yes'?<p>you reported a product match. this does not verify the formula.</p>:null}
 {event?<p>latest report: {(event.amendment?.changeKind??event.changeKind)==='different'?'using differently':(event.amendment?.changeKind??event.changeKind)==='unreviewed_added'?'added an unreviewed product':event.amendment?.changeKind??event.changeKind}</p>:null}
 <p className="plan-meta">{use.originalStart.state==='known'?`reported original start: ${use.originalStart.value}`:use.state==='using'||event?'actual start date not known':'start not recorded'}</p>
 {event?<p className="plan-meta">{event.recordedBy===event.reportedBy?'reported by client':'reported by client · recorded by advisor'} · {event.channel.replace('_',' ')} · {event.amendment?'original report · ':null}{event.occurredOn.state==='known'?`occurred ${event.occurredOn.value}`:'occurred date not known'} · recorded {event.recordedAt}</p>:null}
 {event?.amendment?<p className="plan-meta">{correctionAttribution(event.amendment.amendedBy,event)} · recorded {event.amendment.amendedAt} · {event.amendment.occurredOn.state==='known'?`corrected occurred date ${event.amendment.occurredOn.value}`:'corrected occurred date not known'}</p>:null}
 {body?<><h4>original report</h4><ReportBody entry={full!}/>{body.amendment?<><h4>current correction</h4><p>{body.amendment.reason}</p><ChangeBody change={body.amendment.replacement.change}/><p className="plan-meta">{correctionAttribution(body.amendment.amendedBy,body)} · amended {body.amendment.amendedAt}</p></>:null}</>:null}
 {canRead&&event&&!body?<Button variant="ghost" disabled={loading} onClick={()=>void load(page?.nextCursor??null)}>{loading?'loading report':page?.nextCursor?'look in older reports':error?'retry report details':'view original report'}</Button>:null}
 {page&&!body&&!page.nextCursor?<p>the original report is unavailable in this history.</p>:null}{error?<p role="alert">report details unavailable. the current summary above is retained.</p>:null}
 </section>;
}
function correctionAttribution(actor:string,original:{reportedBy:string;recordedBy:string}):string{
 // The care contract attributes reports to the actual client and permits only
 // that client or an eligible human advisor to amend. IDs establish relation,
 // never a person's name or the identity of a plan preparer/publisher.
 if(!actor||!original.reportedBy)return 'correction actor unavailable';
 if(actor===original.reportedBy)return 'correction by client';
 return original.recordedBy!==original.reportedBy&&actor!==original.recordedBy?'correction by another advisor':'correction by advisor';
}
function ChangeBody({change}:{change:UseChange}){return <><p>{change.kind.replaceAll('_',' ')}</p>{'details'in change&&change.details?<p>{change.details}</p>:null}{change.kind==='different'?<><p>frequency: {change.frequency.state==='known'?change.frequency.value:'not known'}</p><p>amount: {change.amount.state==='known'?change.amount.value:'not known'}</p></>:null}</>;}
function ReportBody({entry}:{entry:UseHistoryEntry}){const e=entry.kind==='use'?entry.event:entry.kind==='reported_product'?entry.event.initialUse:null;if(!e)return null;return <><ChangeBody change={e.change}/><p className="plan-meta">acquisition: {e.acquisition.replaceAll('_',' ')}</p></>;}
