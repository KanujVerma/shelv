/** Stable fragment state. Capabilities remain opaque and are never copied into paths or queries. */
export function readGuideLocation(hash,stages){
 const params=new URLSearchParams(String(hash||'').replace(/^#/,'')),found=stages.findIndex(stage=>stage.id===params.get('step'));
 return {index:Math.max(0,found),explore:params.get('explore')==='1'};
}
export function guideFragment(hash,{step,explore=false}){
 const params=new URLSearchParams(String(hash||'').replace(/^#/,''));params.set('step',step);if(explore)params.set('explore','1');else params.delete('explore');return '#'+params.toString();
}
/** No timers, scripted clicks or global clock changes. The caller reconstructs each selected step. */
export function createGuideController({stages,onChange,window:surface=globalThis.window,guided=true}){
 if(!Array.isArray(stages)||!stages.length||new Set(stages.map(s=>s.id)).size!==stages.length)throw Error('A guide needs unique stable steps.');
 let disposed=false,state={...readGuideLocation(surface.location.hash,stages)};if(!guided&&!new URLSearchParams(surface.location.hash.slice(1)).has('step'))state.explore=true;
 function notify(){if(!disposed)onChange({...state,stage:stages[state.index],total:stages.length});}
 function select(index,{explore=state.explore,replace=false}={}){
  if(disposed)return;state={index:Math.min(stages.length-1,Math.max(0,index)),explore};const hash=guideFragment(surface.location.hash,{step:stages[state.index].id,explore});
  if(hash!==surface.location.hash)surface.history[replace?'replaceState':'pushState'](surface.history.state,'',surface.location.pathname+surface.location.search+hash);notify();
 }
 const restore=()=>{state=readGuideLocation(surface.location.hash,stages);notify();};surface.addEventListener('popstate',restore);surface.addEventListener('hashchange',restore);
 return {start:()=>select(state.index,{explore:state.explore,replace:true}),next:()=>select(state.index+1,{explore:false}),back:()=>select(state.index-1,{explore:false}),explore:()=>select(state.index,{explore:true}),resume:()=>select(state.index,{explore:false}),restart:()=>select(0,{explore:false}),read:()=>({...state}),dispose:()=>{disposed=true;surface.removeEventListener('popstate',restore);surface.removeEventListener('hashchange',restore);}};
}
