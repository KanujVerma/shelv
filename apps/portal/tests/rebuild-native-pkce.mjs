import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {attestFixture} from '../scripts/rebuild-native-fixture.mjs';
import {connectedStack, sourceRoot, artifacts, nodeCookieClient, mailSnapshot, captureCallback} from './rebuild-native-stack.mjs';

assert.equal(process.env.SHELV_REBUILD_NATIVE, '1');
const fixture=await attestFixture(sourceRoot), stack=await connectedStack(fixture);
const result={kind:'genuine-node-http-pkce-cookie-vault',status:'RUNNING',checks:[],realEmails:0,hostedRequests:0};
const pass=label=>result.checks.push(label);
try {
  const client=nodeCookieClient(stack,'advisor');
  let response=await client.request('session');assert.equal(response.status,200);assert.equal(response.value.signedIn,false);
  const flow=response.value.csrf;
  const before=await mailSnapshot();
  response=await client.request('auth/request',{email:fixture.owner.email,remember:false,returnTo:'/advisor/plans'},flow);
  assert.equal(response.status,200, 'Genuine Auth OTP request must pass');
  const callback=await captureCallback(fixture.owner.email,before,'/advisor/plans');result.localEmails=callback.localEmails;
  response=await client.request('auth/complete',{code:callback.code},flow);
  assert.equal(response.status,200,'Actual PKCE exchange/context must pass');
  assert.equal(response.value.signedIn,true);assert.equal(response.value.ownerId,fixture.owner.id);
  assert.equal(stack.issued.size,1);
  assert.match(response.headers.get('set-cookie'),/__Host-shelv_advisor=.*Secure; HttpOnly; SameSite=Lax/);
  assert.doesNotMatch(JSON.stringify(response.value),/access_token|refresh_token|code_verifier/);
  pass('Actual gateway flow, SQLite Vault, local Mailpit verify redirect, genuine GoTrue PKCE and live advisor context');
  const csrf=response.value.csrf;
  response=await client.request('auth/complete',{code:callback.code},flow);assert.equal(response.status,200);
  assert.equal(response.value.csrf,csrf);assert.equal(response.value.ownerId,fixture.owner.id);
  assert.equal(stack.calls.filter(c=>c.path==='/auth/v1/token').length,1);
  pass('Exact complete retry returns the existing session receipt without a second provider token exchange');
  response=await client.request('plans',{schemaVersion:1,action:'list_plans_v1',clientId:null,cursor:null,limit:25},csrf);
  assert.equal(response.status,200,'Actual native plan read must pass');assert.ok(Array.isArray(response.value.drafts));
  response=await client.request('operations',{action:'advisor_list'},csrf);assert.equal(response.status,200,'Actual native directory must pass');assert.ok(Array.isArray(response.value.clients));
  const identities=await fixture.readPrivate('PLAN-IDENTITIES.private.json');
  response=await client.request('payments',{schemaVersion:2,action:'advisor_read',clientId:identities.client.id},csrf);assert.equal(response.status,200,'Actual native payments read must pass');assert.ok(Array.isArray(response.value.quotes));
  pass('Genuine cookie authority reaches unmodified native plan, operations and payments entries through verified TLS/Auth/PostgREST/SQL');
  response=await client.request('plans',{schemaVersion:1,action:'list_plans_v1',clientId:null,cursor:null,limit:25},'wrong-csrf');
  assert.equal(response.status,403);
  pass('Real cookie without matching CSRF refuses business request');
  response=await client.request('logout',{},csrf);assert.equal(response.status,200);
  assert.equal(fixture.sql(`select count(*) from auth.sessions where id='${[...stack.issued.keys()][0]}'`),'0');
  pass('Actual gateway logout reaches supported local provider logout and removes its actual session');
  result.status='PASS';
} catch(error) {result.status='FAIL';result.failure=error instanceof assert.AssertionError?error.message:'native_pkce_failed';}
finally {
  try {result.cleanup=await stack.cleanup();} catch {result.status='FAIL';result.cleanup='FAILED';}
  result.calls=stack.calls;result.errors=stack.errors;result.testBundleSeams=stack.seams;
  await stack.dispose();
  await writeFile(path.join(artifacts,'node-pkce-result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
}
console.log(JSON.stringify(result));
if(result.status!=='PASS')process.exitCode=1;
