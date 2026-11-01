import {createHistoryUpdateReader} from '../src/app/client-composition.ts';
import type {HistoryController} from '../src/features/history/types.ts';
import type {AppHistoryRestorationScope} from '../src/app/client-composition.ts';
import type {HistoryRestorationResult} from '../src/features/history/restoration.ts';
// @ts-expect-error successful-data inspection is private, not an admission capability
import {dataReady} from '../src/app/client-composition.ts';
export function initialAdmissionInputs(controller:HistoryController,scope:AppHistoryRestorationScope,result:HistoryRestorationResult){
 const reader=createHistoryUpdateReader(controller,scope,_result=>{});
 // @ts-expect-error a typed result cannot be supplied to establish initial admission
 void reader.read(result);
 // @ts-expect-error callers cannot choose whether data is successful
 createHistoryUpdateReader(controller,scope,_result=>{}, {dataReady:()=>true});
 // @ts-expect-error admission remains an owned read-only query without success flags
 reader.isAdmitted({ready:true});
 return reader;
}
