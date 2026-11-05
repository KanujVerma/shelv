import type {HistoryCommand,HistoryPort,ReportIntent} from '../src/features/history/index.ts';
import type {AdvisorCareHistoryPage} from '../../../src/contracts/PortalReview.ts';
import type {ApplicationSession} from '../src/app/session.ts';
import {createHistoryPort} from '../src/features/history/port.ts';
function contracts(port:HistoryPort,runtime:ApplicationSession,privateHistory:AdvisorCareHistoryPage){
  // @ts-expect-error client history has no advisor selector/action
  const advisor:HistoryCommand={schemaVersion:1,action:'read_advisor_care_history_v1',clientId:'id',cursor:null,limit:40,version:null};
  // @ts-expect-error no arbitrary RPC
  void port.execute({name:'arbitrary_rpc',args:{}});
  // @ts-expect-error raw/private page is not a command
  void port.execute(privateHistory);
  // @ts-expect-error actual retained session boundary is required
  void createHistoryPort({audience:'client'},port);
  // @ts-expect-error clients cannot author advisor conclusions
  const invented:ReportIntent={kind:'conversation',conclusion:'authored by client'};
  void [advisor,invented,runtime];
}
void contracts;
