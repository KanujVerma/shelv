import test from 'node:test';import assert from 'node:assert/strict';
import {parseClientCommand,validateClientUpload} from '../server/client-policy';
import {parseCommand} from '../server/policy';
import {ClientProvider} from '../server/client-upstream';
const quoteId='bf000000-0000-4000-8000-000000000001',optionId='bf000000-0000-4000-8000-000000000002',requestId='bf000000-0000-4000-8000-000000000003',completionRequestId='bf000000-0000-4000-8000-000000000004';
test('client payment upload carries exact V2 option metadata without gaining owner or recipient selectors',()=>{
 const metadata={schemaVersion:2,action:'upload_evidence',requestId,completionRequestId,expectedRevision:2,quoteId,quoteVersion:1,paymentOptionId:optionId};
 assert.deepEqual(validateClientUpload('payments',metadata,new Uint8Array([1]),'image/png').metadata,metadata);
 for(const delta of [{paymentOptionId:'bad'},{recipient:'attacker'},{clientId:quoteId},{phone:'9257191334'}])assert.throws(()=>validateClientUpload('payments',{...metadata,...delta},new Uint8Array([1]),'image/png'));
 assert.throws(()=>parseClientCommand('payments',{action:'confirm_payment',schemaVersion:2}));assert.throws(()=>parseClientCommand('payments',{action:'submit_claim',schemaVersion:2,clientId:quoteId}));
});
test('advisor evidence read remains a view action with no arbitrary upstream or owner-supplied URL',()=>{
 assert.equal(parseCommand('payments',{action:'evidence_url',evidenceId:quoteId,schemaVersion:2}).kind,'command');
 for(const delta of [{url:'https://attacker.invalid'},{authorization:'secret'},{clientId:quoteId}])assert.throws(()=>parseCommand('payments',{action:'evidence_url',evidenceId:quoteId,schemaVersion:2,...delta}));
});
test('V2 owner media proxy negotiates the method contract and rejects malformed option metadata without exposing it',async()=>{
 const owner=quoteId,session=optionId,credentials={access_token:[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:owner,session_id:session,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'synthetic'].join('.'),refresh_token:'synthetic-refresh',expires_at:Date.now()/1000+3600,user:{id:owner},providerSessionId:session};
 let malformed=false;const requests:any[]=[];
 const provider=new ClientProvider('sb_publishable_synthetic',async(input:any,init:any)=>{requests.push({url:String(input),init});if(String(input).includes('/functions/'))return Response.json({schemaVersion:2,paymentOptionId:malformed?'PRIVATE_TOKEN_CANARY':optionId,evidenceId:requestId,signedUrl:`https://snojlbqovlawewwqbviz.supabase.co/storage/v1/object/sign/concierge-payment-evidence/${owner}/${quoteId}/${requestId}.png?token=synthetic`,expiresInSeconds:60});return new Response(new Uint8Array([137,80,78,71]),{headers:{'content-type':'image/png'}});});
 const cap={view:true,edit:false,publish:false,confirmPayments:false},command={kind:'command' as const,channel:'payments' as const,command:{action:'evidence_url',evidenceId:requestId,schemaVersion:2}};
 const first=await provider.perform(credentials,cap,command);assert.match(String((first.body as any).signedUrl),/&v=2$/);assert.equal((first.body as any).paymentOptionId,optionId);
 const bytes=await provider.perform(credentials,cap,{kind:'client-media',media:'evidence',id:requestId,schemaVersion:2});assert.equal(bytes.bytes?.length,4);assert.equal(JSON.parse(requests[1].init.body).schemaVersion,2);assert.equal(new Headers(requests[2].init.headers).has('Authorization'),false);
 malformed=true;await assert.rejects(provider.perform(credentials,cap,command),(error:any)=>error.status===503);
});
