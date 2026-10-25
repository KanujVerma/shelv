import {mountWalkthroughViewer} from './viewer.js';

const root=document.querySelector('#portal-root');
let cleanup=null,generation=0;
const unavailable=()=>{cleanup?.();cleanup=null;root.innerHTML='<main class="advisor-login-shell"><section class="advisor-login-card"><h1>Walkthrough unavailable</h1><p>This link cannot be opened. Ask the person who shared it for a new link.</p></section></main>';};
function access(){const fragment=new URLSearchParams(location.hash.slice(1));const values=fragment.getAll('access');if(values.length!==1||!/^[A-Za-z0-9_-]{43}$/.test(values[0]))throw Error('unavailable');return values[0];}
async function authorize(){
 const response=await fetch('/api/walkthroughs/view',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audience:'walkthrough',token:access()}),credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer'});
 if(!response.ok)throw Error('unavailable');
 const result=await response.json();if(result?.schemaVersion!==1||!result.snapshot)throw Error('unavailable');return result.snapshot;
}
async function open(){const current=++generation;cleanup?.();cleanup=null;try{const snapshot=await authorize();if(current!==generation)return;cleanup=mountWalkthroughViewer(root,{snapshot,authorize,onUnavailable:unavailable,guided:true});}catch{if(current===generation)unavailable();}}
window.addEventListener('pagehide',()=>{++generation;cleanup?.();cleanup=null;root.replaceChildren();});
window.addEventListener('pageshow',event=>{if(event.persisted)void open();});
void open();
