import assert from 'node:assert/strict';
import test from 'node:test';
import {TransportError as PureError} from '../apps/portal/src/transport/error.ts';
import {TransportError as SessionError} from '../apps/portal/src/transport/session.ts';
import {createApplicationSession} from '../apps/portal/src/app/session.ts';
function requestLock<T>(name:string,callback:LockGrantedCallback<T>):Promise<Awaited<T>>;
function requestLock<T>(name:string,options:LockOptions,callback:LockGrantedCallback<T>):Promise<Awaited<T>>;
function requestLock<T>(_name:string,options:LockOptions|LockGrantedCallback<T>,callback?:LockGrantedCallback<T>):Promise<Awaited<T>>{
 const run=typeof options==='function'?options:callback;
 if(!run)return Promise.reject(Error('missing lock callback'));
 return Promise.resolve(run(null));
}
test('the actual session transport preserves an error created by the public pure binding',async()=>{
 const runtime=createApplicationSession({audience:'client',locks:{request:requestLock},fetcher:async url=>{
  assert.equal(url,'/api/client/session');return Response.json({signedIn:true,ownerId:'c1000000-0000-4000-8000-000000000001',generation:1,csrf:'synthetic-error-binding',capabilities:{view:true},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'});
 }});
 try{
  await runtime.restore();const original=new PureError(409);assert.equal(PureError,SessionError);
  const port=runtime.transport.bind({kind:'read',invoke:async()=>{throw original;},decode:()=>{throw Error('must not decode');}});
  await assert.rejects(()=>port.execute(null),error=>error===original&&error instanceof SessionError&&error.status===409);
 }finally{runtime.dispose();}
});
