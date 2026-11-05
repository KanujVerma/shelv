import type {PlanDirectoryV2Command,PlanDirectoryV2RpcCall,PlanDirectoryV2View} from './PortalPlanDirectoryV2.ts';
import {readPlanDirectoryV2Command,readPlanDirectoryV2View} from './PortalPlanDirectoryV2Validation.ts';
export function buildPlanDirectoryV2Rpc(input:unknown):PlanDirectoryV2RpcCall{
 return Object.freeze({name:'concierge_plan_directory_v2',args:Object.freeze({p_command:readPlanDirectoryV2Command(input)})});
}
export function mapPlanDirectoryV2Result(input:unknown,command:PlanDirectoryV2Command):PlanDirectoryV2View{
 try{return readPlanDirectoryV2View(input,readPlanDirectoryV2Command(command));}catch{throw Error('unavailable');}
}
