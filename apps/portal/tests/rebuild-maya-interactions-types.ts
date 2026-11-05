import type {ClientPlanPorts,DemoChoicePort,DemoUsePort,DemoMemoryResult} from '../src/features/plan/types.ts';
import type {CareCommand,CareWriteResult} from '../../../src/contracts/PortalCare.ts';
declare const use:DemoUsePort;
declare const choice:DemoChoicePort;
declare const result:DemoMemoryResult;
declare const command:CareCommand;
// @ts-expect-error A memory use capability cannot execute authenticated Care operations.
const liveCare:NonNullable<ClientPlanPorts['care']>=use;
// @ts-expect-error A memory choice capability cannot execute authenticated decisions.
const liveDecision:ClientPlanPorts['decision']=choice;
// @ts-expect-error No read or decision OperationPort ABI exists on the memory pair.
const livePorts:ClientPlanPorts={read:use,decision:choice};
// @ts-expect-error No business receipt is issued by a memory result.
const receipt:CareWriteResult=result;
// @ts-expect-error The form-intent API accepts no RPC command.
use.report(command);
// @ts-expect-error The memory choice API has no request identity/receipt protocol.
choice.choose({decisionId:'maya-card-treatments',choice:'approved',requestId:'synthetic'});
void liveCare;void liveDecision;void livePorts;void receipt;
