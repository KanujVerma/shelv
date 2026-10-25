import http from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
const events=[];let bootstrapRelease,loginRelease,active=false;
const checks={nativeWebLocks:false,bootstrapSerialized:false,waiterSawAppliedCookie:false,logoutWaitedForCompletion:false,logoutUsedCurrentCookieCsrf:false,unsupportedLocksDenied:false};
const persist=()=>writeFile('evidence/native-browser.json',JSON.stringify({scope:'local native browser with production adapter; synthetic HTTP backend only',checks,events},null,2)+'\n');
const add=(type,extra={})=>{events.push({type,...extra});void persist();};
const view={signedIn:true,ownerId:'11111111-1111-4111-8111-111111111111',generation:1,csrf:'synthetic-session-csrf',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T01:00:00Z',absoluteExpiresAt:'2099-01-01T08:00:00Z'};
function json(res,data,status=200,cookie){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})});res.end(JSON.stringify(data));}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1'),role=url.searchParams.get('role')??'page';
  if(url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'self'; connect-src 'self'"});res.end(await readFile('tests/native-browser.html'));return;}
  if(url.pathname==='/native.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(await readFile('tests/native-browser.js'));return;}
  if(url.pathname==='/adapter.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(await readFile('adapter/advisor-cookie-session.js'));return;}
  if(url.pathname==='/status'){json(res,{checks,events});return;}
  if(url.pathname==='/release-bootstrap'){add('bootstrap-release');bootstrapRelease?.();json(res,{released:true});return;}
  if(url.pathname==='/release-login'){add('login-release');loginRelease?.();json(res,{released:true});return;}
  if(url.pathname==='/report'){
   let raw='';for await(const part of req)raw+=part;if(raw.length>1000)throw Error('fixture report too large');
   const value=JSON.parse(raw);if(value.nativeWebLocks===true)checks.nativeWebLocks=true;if(value.unsupportedLocksDenied===true)checks.unsupportedLocksDenied=true;await persist();json(res,{accepted:true});return;
  }
  if(url.pathname==='/fixture/session'){
   if(req.headers['x-shelv-logout']==='1'){
    checks.logoutWaitedForCompletion=events.some(e=>e.type==='login-response');
    add('logout-context',{activeCookie:(req.headers.cookie??'').includes('native_session=active')});json(res,{csrf:(req.headers.cookie??'').includes('native_session=active')?'synthetic-session-csrf':'synthetic-flow-csrf'});return;
   }
   add('bootstrap-enter',{role,hadAppliedCookie:(req.headers.cookie??'').includes('native_bootstrap=ready')});
   if(role==='holder'&&!bootstrapRelease){await new Promise(resolve=>bootstrapRelease=resolve);}
   if(role==='waiter'){
    checks.bootstrapSerialized=events.findIndex(e=>e.type==='bootstrap-release')<events.findIndex(e=>e.type==='bootstrap-enter'&&e.role==='waiter')&&events.some(e=>e.type==='bootstrap-release');
    checks.waiterSawAppliedCookie=(req.headers.cookie??'').includes('native_bootstrap=ready');
   }
   add('bootstrap-response',{role});json(res,active?view:{signedIn:false,csrf:'synthetic-flow-csrf',flowExpiresAt:'2099-01-01T00:00:00Z'},200,'native_bootstrap=ready; Path=/; HttpOnly; SameSite=Strict');return;
  }
  if(url.pathname==='/fixture/session/upgrade'){
   add('login-enter');await new Promise(resolve=>loginRelease=resolve);active=true;add('login-response');json(res,view,200,'native_session=active; Path=/; HttpOnly; SameSite=Strict');return;
  }
  if(url.pathname==='/fixture/logout'){
   checks.logoutUsedCurrentCookieCsrf=(req.headers.cookie??'').includes('native_session=active')&&req.headers['x-shelv-csrf']==='synthetic-session-csrf';
   if(!checks.logoutUsedCurrentCookieCsrf){json(res,{code:'csrf_rejected'},403);return;}
   active=false;add('logout-confirmed');json(res,{providerRevoked:true},200,'native_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');return;
  }
  res.writeHead(404);res.end();
 }catch{res.writeHead(500);res.end('synthetic fixture failure');}
});
server.listen(0,'127.0.0.1',async()=>{const origin=`http://127.0.0.1:${server.address().port}`;await writeFile('evidence/native-browser-origin.txt',origin+'\n');await persist();process.stdout.write(origin+'\n');});
process.on('SIGINT',()=>{bootstrapRelease?.();loginRelease?.();server.close();});
