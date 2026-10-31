import type {HistoryController,HistoryProps} from '../src/features/history/types.ts';
import type {HistoryRestorationResult,HistoryRestorationAttempt,HistoryTimelineMetadata} from '../src/features/history/restoration.ts';
declare const controller:HistoryController;
declare const metadata:HistoryTimelineMetadata;
const api=controller.restoration;
if(api){
 const attempt:HistoryRestorationAttempt=api.restore(null);
 attempt.cancel();
 void attempt.ready.then(result=>{if(api.isCurrent(result)&&result.state==='restored'){const id:string|null=result.anchorId;void id;}});
 api.setFilter('changes');api.capture({kind:'entry',entryKey:'publication:1'});
 // @ts-expect-error restoration takes only a selected version, never caller heads/permission
 api.restore({heads:metadata.basis.heads,current:true});
 // @ts-expect-error arbitrary raw filter/body is not a restoration preference
 api.setFilter('private-source');
}
const props:Pick<HistoryProps,'restoration'|'filter'|'onFilterChange'>={filter:'all',onFilterChange(filter){const choice:'all'|'checkins'|'changes'=filter;void choice;},restoration:{version:null,onReady(result:HistoryRestorationResult){
 // @ts-expect-error navigation restoration never grants a clinical or publication permission
 const permission:boolean=result.canPublish;void permission;
 if(result.state==='unavailable'){
  const absent:null=result.basis;void absent;
 }else{const useHead:number=result.basis.heads.useHead;void useHead;}
}}};void props;
