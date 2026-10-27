import {createCheckinDraftState} from '../features/checkins/draft-state.js';
const featureState=()=>({
 pending:null,pendingFormKey:null,quoteDraft:null,forms:new Map(),uploads:new Map(),selectedOptions:new Map(),closed:false,
 hasUnsent(){return !this.closed&&(this.pending!==null||this.quoteDraft!==null||this.forms.size>0);},
 dispose(){this.closed=true;this.pending=null;this.pendingFormKey=null;this.quoteDraft=null;this.forms.clear();this.uploads.clear();this.selectedOptions.clear();}
});
/** One owner/session's UI memory only. The host disposes it at authoritative teardown. */
export function createClientTaskState(){
 const checkins=createCheckinDraftState(),payments=featureState(),service=featureState();
 return {navigationKey:crypto.randomUUID(),checkins,payments,service,closed:false,
  hasUnsent(){return !this.closed&&(checkins.hasUnsent()||payments.hasUnsent()||service.hasUnsent());},
  dispose(){this.closed=true;checkins.dispose();payments.dispose();service.dispose();}
 };
}
