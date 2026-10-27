import test from 'node:test';
import assert from 'node:assert/strict';
import {CredentialEnvelope} from '../server/credential-envelope';

const key=Buffer.alloc(32,41).toString('base64url'); // Fixed synthetic bytes only.
const ring=(active:string,ids:string[])=>JSON.stringify({active,keys:Object.fromEntries(ids.map((id,index)=>[id,Buffer.alloc(32,41+index).toString('base64url')]))});

test('every allowed key identifier remains an own entry for encryption and retained-key rotation',async()=>{
 for(const id of ['fixture','__proto__','constructor','toString']){
  const original=new CredentialEnvelope(ring(id,[id]),'synthetic-object');
  const envelope=await original.seal({value:'synthetic-payload'},'synthetic-owner');
  assert.equal(envelope.keyId,id);
  assert.deepEqual(await original.open(envelope,'synthetic-owner'),{value:'synthetic-payload'});
  const rotated=new CredentialEnvelope(ring('replacement',[id,'replacement']),'synthetic-object');
  assert.deepEqual(await rotated.open(envelope,'synthetic-owner'),{value:'synthetic-payload'});
  await assert.rejects(rotated.open(envelope,'different-owner'));
  await assert.rejects(new CredentialEnvelope(ring('replacement',['replacement']),'synthetic-object').open(envelope,'synthetic-owner'),(error:any)=>error.status===503&&error.code==='configuration_missing');
 }
 assert.equal(Object.hasOwn(Object.prototype,'fixture'),false);
});

test('inherited key names and wrong-length material still fail closed',()=>{
 for(const raw of [JSON.stringify({active:'constructor',keys:{fixture:key}}),JSON.stringify({active:'toString',keys:{fixture:key}}),JSON.stringify({active:'fixture',keys:{fixture:Buffer.alloc(31,41).toString('base64url')}})]){
  assert.throws(()=>new CredentialEnvelope(raw,'synthetic-object'),(error:any)=>error.status===503&&error.code==='configuration_missing');
 }
});
