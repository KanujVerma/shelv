import {safeReturnPath} from './portal-routes.js';
const views=new Set(['recommendations','routine','checkins','payments','service','about','history']);
const tasks=new Set(['overview','draft','payments','checkins','history','service']);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const product=/^(?:card|step|routine):[a-zA-Z0-9_-]{1,100}$|^legacy:[a-zA-Z0-9_-]{1,100}:[a-zA-Z0-9_-]{1,100}$/;
/** Navigation only. This never grants access or selects an authenticated owner. */
export function portalReturnPath(value,audience){
 const invalid=()=>{throw new TypeError('Invalid portal return path');};
 if(!['client','advisor'].includes(audience))return invalid();
 if(value===undefined)return '/?workspace='+audience;
 if(typeof value!=='string'||value.length>600||!value.startsWith('/')||value.startsWith('//')||value.includes('#')||value.includes('\\')||/[\u0000-\u0020\u007f]/.test(value))return invalid();
 if(!value.startsWith('/?'))return safeReturnPath(value,audience)??invalid();
 let url;try{url=new URL(value,'https://portal.invalid');}catch{return invalid();}
 if(url.origin!=='https://portal.invalid'||url.pathname!=='/'||url.hash)return invalid();
 const keys=audience==='client'?['workspace','clientView','product']:['workspace','advisorClient','advisorTask'];
 for(const key of url.searchParams.keys())if(!keys.includes(key)||url.searchParams.getAll(key).length!==1)return invalid();
 if(url.searchParams.get('workspace')!==audience)return invalid();
 if(audience==='client'){
  const view=url.searchParams.get('clientView'),ref=url.searchParams.get('product');
  if(view!==null&&!views.has(view)||ref!==null&&(!['recommendations','routine'].includes(view)||!product.test(ref)))return invalid();
 }else{
  const id=url.searchParams.get('advisorClient'),task=url.searchParams.get('advisorTask');
  if(id!==null&&!uuid.test(id)||task!==null&&(!id||!tasks.has(task)))return invalid();
 }
 return url.pathname+url.search;
}
export function navigationReturnTo(redirect,audience,origin=globalThis.location?.origin){
 if(!redirect)return undefined;
 const url=new URL(redirect,origin||'https://portal.goshelv.com');
 if(url.origin!==(origin||'https://portal.goshelv.com')||url.username||url.password||url.hash)throw new TypeError('Invalid portal return origin');
 const path=portalReturnPath(url.pathname+url.search,audience);
 return url.pathname!=='/'||[...url.searchParams.keys()].some(key=>key!=='workspace')?path:undefined;
}
/** Build only a known route from an existing UI URL; unrelated parameters are omitted. */
export function portalLoginRedirect(location,audience){
 const source=new URL(location.href),semantic=source.pathname!=='/',target=new URL(semantic?source.pathname:'/?workspace='+audience,source.origin);
 const keys=semantic?(source.pathname==='/plan'||source.pathname.startsWith('/plan/')?['routine']:source.pathname.startsWith('/advisor/clients/')?['task']:[]):audience==='client'?['clientView','product']:['advisorClient','advisorTask'];
 for(const key of keys)if(source.searchParams.getAll(key).length===1)target.searchParams.set(key,source.searchParams.get(key));
 try{return source.origin+portalReturnPath(target.pathname+target.search,audience);}catch{return source.origin+'/?workspace='+audience;}
}
