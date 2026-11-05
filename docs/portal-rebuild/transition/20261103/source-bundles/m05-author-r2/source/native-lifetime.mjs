// Internal ownership utility. No browser, permission, session, or authority API.
export class NativeLifetime {
  constructor(timeoutMs=15000){this.timeoutMs=timeoutMs;this.slots=[];this.work=[];this.retired=false;this.cleanupRequested=false;this.errors=[];this.pending=[];}
  fail(label,error){this.errors.push({label,name:error?.name??'Error',message:String(error?.message??error)});}
  assertLive(){if(this.retired)throw new Error('native lifetime retired');}
  watch(label,promise){
    const item={label,settled:false};this.work.push(item);
    item.promise=Promise.resolve(promise).then(value=>{item.settled=true;return value;},error=>{item.settled=true;this.fail(label,error);throw error;});
    item.promise.catch(()=>{});return item.promise;
  }
  acquire(label,run,inverse){
    this.assertLive();const slot={label,raw:undefined,owned:false,settled:false,acquired:false,cleaned:false,inverse};this.slots.push(slot);
    slot.promise=Promise.resolve().then(run).then(raw=>{
      // This raw-success assignment precedes validation or any outer continuation.
      slot.raw=raw;slot.owned=true;slot.settled=true;slot.acquired=true;
      if(this.cleanupRequested)this.clean(slot);
      return raw;
    },error=>{slot.settled=true;this.fail(label+':acquire',error);throw error;});
    slot.promise.catch(()=>{});return slot.promise;
  }
  clean(slot){
    if(!slot.owned||slot.cleanup)return slot.cleanup;
    slot.cleanup=Promise.resolve().then(()=>slot.inverse(slot.raw)).then(()=>{slot.cleaned=true;slot.owned=false;},error=>{this.fail(slot.label+':cleanup',error);throw error;});
    slot.cleanup.catch(()=>{});return slot.cleanup;
  }
  async join(label,promises){
    let timer;try{await Promise.race([Promise.allSettled(promises),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+': join deadline exceeded')),this.timeoutMs);})]);}
    catch(error){this.fail(label,error);this.pending.push(label);}finally{clearTimeout(timer);}
  }
  async close(){
    this.retired=true;
    await this.join('acquisition-join',[...this.slots.map(s=>s.promise),...this.work.map(w=>w.promise)]);
    this.cleanupRequested=true;
    for(const slot of [...this.slots].reverse())this.clean(slot);
    // Include acquisition again: a late raw success must acquire its own inverse.
    await this.join('cleanup-second-join',[...this.slots.map(s=>s.promise.then(()=>s.cleanup,()=>{})),...this.work.map(w=>w.promise)]);
    for(const s of this.slots)if(!s.settled||s.owned)this.pending.push('unjoined native slot: '+s.label);
    for(const w of this.work)if(!w.settled)this.pending.push('unjoined native work: '+w.label);
    return {observations:this.slots.map(s=>({label:s.label,rawAcquired:s.acquired,cleaned:s.cleaned})),errors:[...this.errors],pending:[...this.pending]};
  }
}
