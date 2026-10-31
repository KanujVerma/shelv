import {useEffect,useRef,useState} from 'react';
import type {ReportedProductsPage} from '../../../../../src/contracts/PortalCare.ts';
import {mapCareResult} from '../../../../../src/contracts/PortalCareMapping.ts';
import {Button,StatusNotice} from '../../ui/index.ts';
import type {ClientPlanProps} from './types.ts';
export function ReportedProducts({props}:{props:ClientPlanProps}){
 const [loading,setLoading]=useState(false),[error,setError]=useState(false),alive=useRef(true),busy=useRef<object|null>(null),latest=useRef(props);
 latest.current=props;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;busy.current=null;};},[]);
 useEffect(()=>{busy.current=null;setLoading(false);},[props.view,props.mode,props.session]);
 const view=props.view;if(view.schemaVersion!==2||!view.use.reportedProducts.nextCursor||props.mode!=='client'||!props.ports?.care||!props.onViewChange)return null;
 async function load(){if(busy.current||!props.session.isCurrent()||view.schemaVersion!==2)return;const operation={},current=()=>alive.current&&props.session.isCurrent()&&latest.current.view===view&&latest.current.mode===props.mode&&latest.current.session===props.session&&busy.current===operation;busy.current=operation;setLoading(true);setError(false);try{const command={schemaVersion:1,action:'read_reported_products_v1',cursor:view.use.reportedProducts.nextCursor,limit:25,expectedUseRevision:view.use.revision,publicationVersion:view.plan?.version??null} as const;const page=mapCareResult(await props.ports!.care!.execute(command),command) as ReportedProductsPage;if(current())props.onViewChange?.({...view,use:{...view.use,reportedProducts:{items:page.items,nextCursor:page.nextCursor}}});}catch{if(current())setError(true);}finally{if(busy.current===operation){busy.current=null;if(alive.current&&latest.current.view===view)setLoading(false);}}}
 return <div className="plan-stack">{error?<StatusNotice title="more reported products unavailable">refresh the current plan if the use record has changed.</StatusNotice>:null}<Button variant="secondary" busy={loading} onClick={()=>void load()}>next reported products</Button></div>;
}
