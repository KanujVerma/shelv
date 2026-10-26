/** Private, memory-only state for one authenticated client workspace.
 * Section/router remounts may reuse it; session/account teardown must dispose it.
 * No storage, network, timers or shared/module-global draft registry.
 */
export function createCheckinDraftState(){
 const draft={comfort:'',consistency:'',changes:''},photos=new Map(),advisorNotes=new Map(),advisorReplies=new Map();
 const clear=()=>{draft.comfort='';draft.consistency='';draft.changes='';photos.clear();advisorNotes.clear();advisorReplies.clear();};
 return {
  draft,photos,advisorNotes,advisorReplies,pending:null,writeLocked:false,closed:false,
  hasUnsent(){return !this.closed&&(this.pending!==null||photos.size>0||Object.values(draft).some(value=>value.length>0)||[...advisorNotes.values(),...advisorReplies.values()].some(value=>value.length>0));},
  reset(){if(this.closed||this.pending!==null)return false;clear();return true;},
  dispose(){this.closed=true;this.pending=null;this.writeLocked=false;clear();}
 };
}
