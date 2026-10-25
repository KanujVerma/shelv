import {CookieAdvisorSession} from '/adapter.js';
const role=new URL(location.href).searchParams.get('role')??'page',actions=document.querySelector('#actions'),results=document.querySelector('#results');
document.querySelector('#role').textContent=`Test page: ${role}`;
const supported=typeof navigator.locks?.request==='function';document.querySelector('#capability').textContent=`Native Web Locks: ${supported?'available':'unavailable'}`;
await fetch('/report',{method:'POST',body:JSON.stringify({nativeWebLocks:supported})});
const status=()=>fetch('/status').then(r=>r.json()).then(value=>{results.textContent=JSON.stringify(value,null,2);});
const session=new CookieAdvisorSession({fetcher:(path,init)=>fetch(path.replace('/api/advisor','/fixture')+`?role=${role}`,init),timeoutMs:180000});
const run=async(name,work)=>{actions.textContent+=`\n${name}: pending`;try{await work();actions.textContent+=`\n${name}: passed`;}catch(error){actions.textContent+=`\n${name}: failed (${error.status??'error'})`;}await status();};
document.querySelector('#prepare').onclick=()=>run('prepare',()=>session.prepareFlow());
document.querySelector('#release-bootstrap').onclick=()=>run('release bootstrap',()=>fetch('/release-bootstrap',{method:'POST'}));
document.querySelector('#upgrade').onclick=()=>run('synthetic login',()=>session.upgrade({accessToken:'synthetic-native-access',refreshToken:'synthetic-native-refresh'}));
document.querySelector('#logout').onclick=()=>run('logout',()=>session.signOut());
document.querySelector('#release-login').onclick=()=>run('release login',()=>fetch('/release-login',{method:'POST'}));
document.querySelector('#unsupported').onclick=()=>run('unsupported locks',async()=>{
 let sent=0;const denied=new CookieAdvisorSession({locks:null,fetcher:async()=>{sent++;throw Error('unexpected fetch');}});
 try{await denied.prepareFlow();throw Error('unexpected success');}catch(error){if(error.status!==503||sent!==0)throw error;}
 await fetch('/report',{method:'POST',body:JSON.stringify({unsupportedLocksDenied:true})});
});
document.querySelector('#refresh').onclick=status;await status();
