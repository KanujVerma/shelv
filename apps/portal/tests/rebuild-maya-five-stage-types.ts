import {createMayaDemoController,MayaWalkthrough} from '../src/features/walkthrough/maya/index.ts';
import type {ClientPlanProps,DemoPlanPorts,PlanNavigationPort} from '../src/features/plan/types.ts';
const controller=createMayaDemoController({initialStage:2});
const props:ClientPlanProps=controller.getPlanProps();
const demo:DemoPlanPorts|undefined=props.demoPorts;
const navigation:PlanNavigationPort|undefined=props.navigation;
void demo;void navigation;void MayaWalkthrough;
// @ts-expect-error a live transport cannot be injected into the demo constructor
createMayaDemoController({ports:props.ports});
// @ts-expect-error a real client/session cannot be injected
createMayaDemoController({session:props.session});
// @ts-expect-error only the approved five stage numbers are accepted
createMayaDemoController({initialStage:6});
controller.dispose();
