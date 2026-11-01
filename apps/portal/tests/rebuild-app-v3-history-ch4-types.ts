import {createHistoryUpdateReader} from '../src/app/client-composition.ts';
import type {HistoryController} from '../src/features/history/types.ts';
import type {AppHistoryRestorationScope} from '../src/app/client-composition.ts';
import type {HistoryRestorationResult} from '../src/features/history/restoration.ts';
export function updateLifetimeInputs(controller:HistoryController,scope:AppHistoryRestorationScope,result:HistoryRestorationResult){
 const reader=createHistoryUpdateReader(controller,scope,_result=>{});
 const admitted:boolean=reader.isAdmitted();reader.startReport();void reader.read();reader.dispose();
 // Admission is earned only by its own actual read. It accepts no witness/current override.
 // @ts-expect-error no supplied readiness may admit an update module
 reader.isAdmitted(result);
 // @ts-expect-error no fabricated admission constructor field
 createHistoryUpdateReader(controller,scope,_result=>{}, {admitted:true});
 // @ts-expect-error initial readiness cannot be passed to the reader
 reader.read(result);
 return admitted;
}
