export const ADVISOR_TASKS=Object.freeze(['overview','draft','payments','checkins','history','service']);

/** Parse only routing identifiers. Directory membership remains authoritative. */
export function parseAdvisorTaskTarget(search,tasks=ADVISOR_TASKS){
 const params=new URLSearchParams(search);
 if(params.getAll('advisorClient').length!==1||params.getAll('advisorTask').length>1)return null;
 const clientId=params.get('advisorClient'),task=params.get('advisorTask')||'overview';
 return /^[a-zA-Z0-9_-]{1,100}$/.test(clientId||'')&&tasks.includes(task)?{clientId,task}:null;
}

/** Addressable advisor tasks. URLs contain only an opaque client id and a task. */
export function createAdvisorNavigation({tasks,onNavigate,window:win=globalThis.window}){
 const scope=win.location.pathname,key='shelvAdvisorNavigation';
 function read(){
  if(win.location.pathname!==scope||win.location.hash&&!win.location.hash.startsWith('#/advisor'))return null;
  return parseAdvisorTaskTarget(win.location.search,tasks)||{clientId:null,task:'overview'};
 }
 function record(target,{replace=false}={}){
  const url=new URL(win.location.href);
  if(target.clientId){url.searchParams.set('advisorClient',target.clientId);url.searchParams.set('advisorTask',target.task);}
  else {url.searchParams.delete('advisorClient');url.searchParams.delete('advisorTask');}
  const previous=win.history.state&&typeof win.history.state==='object'&&!Array.isArray(win.history.state)?win.history.state:{};
  win.history[replace?'replaceState':'pushState']({...previous,[key]:{version:1,scope,...target}},'',url);
 }
 const changed=()=>{const target=read();if(target)void onNavigate(target);};
 win.addEventListener('popstate',changed);
 return {read,record,dispose(){win.removeEventListener('popstate',changed);}};
}
