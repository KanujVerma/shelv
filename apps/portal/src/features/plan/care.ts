import type {ClientPlanViewV2} from '../../../../../src/contracts/PortalCare.ts';
import {mapCareResult} from '../../../../../src/contracts/PortalCareMapping.ts';
import type {ClientPlanProps,ClientPlanReadView} from './types.ts';
/** Never reduce a v2 current-use read to the legacy Start-only projection. */
export async function readCurrentPlan(props:ClientPlanProps):Promise<ClientPlanReadView>{
 if(props.mode==='client'&&props.ports?.care){const command={schemaVersion:1,action:'read_client_plan_v2',version:null} as const;return mapCareResult(await props.ports.care.execute(command),command) as ClientPlanViewV2;}
 if(props.view.schemaVersion===2)throw new Error('current care read unavailable');
 const port=props.mode==='client'?props.ports:props.mode==='public-demo'&&props.demoPorts?.mode==='public-demo'?props.demoPorts:undefined;
 if(!port)throw new Error('plan read unavailable');
 return port.read.execute({schemaVersion:1,action:'read_client_plan_v1',version:null});
}
