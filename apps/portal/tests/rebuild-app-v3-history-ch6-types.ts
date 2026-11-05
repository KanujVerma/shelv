import {createHistoryUpdateReader} from '../src/app/client-composition.ts';
import type {HistoryController} from '../src/features/history/types.ts';
import type {AppHistoryRestorationScope} from '../src/app/client-composition.ts';
// @ts-expect-error predecessor bookkeeping is private, not an admission capability
import {predecessorCancellation} from '../src/app/client-composition.ts';
export function replacementReaderInputs(controller:HistoryController,scope:AppHistoryRestorationScope){
 const reader=createHistoryUpdateReader(controller,scope,_result=>{});
 // @ts-expect-error callers cannot suppress ownership notifications
 createHistoryUpdateReader(controller,scope,_result=>{}, {ignoreIdle:true});
 // @ts-expect-error callers cannot supply predecessor references or startup authority
 void reader.read({predecessorCancellation:controller.getSnapshot()});
 // @ts-expect-error the reader exposes no mutable ownership field
 reader.retired=false;
 return reader;
}
