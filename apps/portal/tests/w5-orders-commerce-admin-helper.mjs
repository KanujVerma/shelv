// Closed HTTP/codec fixtures, not actual Auth/SQL or finance acceptance. The
// ApplicationSession, retained cookie factory, transport and W1 codecs are real.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
export const sourceRoot=process.env.W5_COMMERCE_ADMIN_SOURCE_ROOT??fileURLToPath(new URL('../../..',import.meta.url));
export const load=path=>import(pathToFileURL(resolve(sourceRoot,path)).href);
const {createApplicationSession}=await load('apps/portal/src/app/session.ts');
const {createCookieRequest}=await load('apps/portal/site/auth/advisor-cookie-session.js');
const {readCommerceCommand,hashCommerceCommand}=await load('src/contracts/PortalCommerceValidation.ts');
const {isCommerceRead}=await load('src/contracts/PortalCommerceValues.ts');
const {mapCommerceResult}=await load('src/contracts/PortalCommerceMapping.ts');
export const actor='e0000000-0000-4000-8000-000000000001',client='e0000000-0000-4000-8000-000000000002',other='e0000000-0000-4000-8000-000000000003',draftId='e0000000-0000-4000-8000-000000000004',quoteId='e0000000-0000-4000-8000-000000000005';
const known=value=>({state:'known',value}),unknown=()=>({state:'unknown'});
export const day='2026-11-03',instant='2026-11-03T12:00:00Z',publication={version:3,documentSchemaVersion:3};
export const snapshot=()=>({revision:19,paymentRevision:11,serviceRevision:5,asOfDay:day,hash:'c'.repeat(64)});
export const line=()=>({lineId:'line-a',selection:known({publication,decisionId:'decision-a',productId:'product-a'}),identity:{name:'synthetic moisturizer',variant:known('fragrance free'),strength:{state:'not_applicable',reason:'no concentration label'},sizeLabel:known('50 ml')},quantity:known(2),retailer:known('synthetic retailer'),seller:known('synthetic seller'),fulfiller:unknown(),sourceUrl:known('https://example.com/item'),checkedOn:known(day),unitPrice:known({cents:1250,checkedOn:day}),returnTerms:{checkedOn:known(day),sourceUrl:known('https://example.com/returns'),summary:'synthetic checked terms',openedAllowed:known(false),deadline:{kind:'absolute',returnBy:known('2026-12-03'),shipBy:known(null)},returnCost:{kind:'known',cents:known(0)}}});
export const body=()=>({publication:known(publication),lineIds:['line-a'],tax:known({cents:0,checkedOn:day}),shipping:known({cents:500,checkedOn:day}),shippingAddressVersion:known(2),serviceCents:known(0),servicePeriod:null,note:null});
export const draft=()=>({kind:'quote_draft',clientId:client,target:{draftId,revision:7,contentHash:'a'.repeat(64),selectionHash:'b'.repeat(64)},body:body(),savedAt:instant,readyToIssue:true,issues:[]});
export const option=()=>({id:'e0000000-0000-4000-8000-000000000006',recipientVersion:2,recipient:{method:'cash_app',name:'Synthetic Recipient',cashtag:'$synthetic'},available:true});
export const entity=()=>({kind:'quote_draft',id:draftId,revision:7});
export function index(){return {schemaVersion:1,clientId:client,snapshot:snapshot(),entries:[{entity:entity(),label:'synthetic product quote',state:'preparing',recordedAt:instant}],nextCursor:null};}
export const detail=()=>({schemaVersion:1,clientId:client,snapshot:snapshot(),detail:draft()});
export function components(command){return {schemaVersion:1,clientId:client,snapshot:snapshot(),quote:{kind:'draft',target:draft().target},component:command.component,total:1,entries:command.component==='lines'?[line()]:[option()],nextCursor:null};}
export function deferred(){let release;return {promise:new Promise(r=>{release=r;}),release:v=>release(v)};}
export async function receipt(command,overrides={}){
 const issue=command.action==='issue_product_quote_v1',lineSave=command.action==='save_product_quote_line_v1';
 const id=issue?quoteId:lineSave?command.target.draftId:command.draftId??draftId;
 const revision=issue?1:lineSave?command.target.revision+1:command.expectedQuoteDraftRevision+1;
 return {schemaVersion:1,requestId:command.requestId,commandHash:await hashCommerceCommand(command),action:command.action,clientId:client,entity:{kind:issue?'quote':'quote_draft',id,revision},subject:issue||lineSave?{kind:'quote_draft',id:command.target.draftId}:null,quote:issue?{quoteId,quoteVersion:1,termsHash:'d'.repeat(64)}:null,lineId:lineSave?command.body.lineId:null,revision:issue?command.expectedPaymentRevision+1:revision,recordedBy:actor,recordedAt:instant,paymentBasis:null,payment:null,...overrides};
}
export async function fixture(t){
 const broadcast=globalThis.BroadcastChannel;globalThis.BroadcastChannel=undefined;t.after(()=>{globalThis.BroadcastChannel=broadcast;});
 let login={signedIn:true,ownerId:actor,generation:1,csrf:'synthetic-admin-csrf',capabilities:{view:true,edit:true,publish:false,confirmPayments:true},idleExpiresAt:'2026-11-04T12:00:00Z',absoluteExpiresAt:'2026-11-05T12:00:00Z'};
 const calls=[];let reply=async c=>{
  if(c.action==='read_advisor_commerce_v1')return Response.json(index());
  if(c.action==='read_advisor_commerce_detail_v1')return Response.json(detail());
  if(c.action==='read_advisor_quote_components_v1')return Response.json(components(c));
  if(c.action==='request_status_v1')return Response.json({status:'absent'});
  throw Error('test has no synthetic write acknowledgement');
 };
 const runtime=createApplicationSession({audience:'advisor',now:()=>Date.parse(instant),locks:{request:async(_name,_options,run)=>run()},fetcher:async(url,init)=>{
  assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');
  const headers=new Headers(init.headers);assert.equal(headers.has('authorization'),false);assert.equal(headers.has('apikey'),false);
  if(url==='/api/advisor/session')return Response.json(login);
  assert.equal(url,'/api/advisor/commerce','unexpected HTTP forbidden');assert.equal(headers.get('X-Shelv-CSRF'),login.csrf);
  const command=readCommerceCommand(JSON.parse(init.body));calls.push({command,wire:init.body});return reply(command);
 }});
 await runtime.restore();t.after(()=>runtime.dispose());
 // Existing SDK metadata knows Commerce, but the ordinary W0 gateway/namespace
 // remains unadmitted. This finite fixture never registers or grants that route.
 const request={async execute(input,options){
  const command=readCommerceCommand(input),read=isCommerceRead(command.action),hash=read?null:await hashCommerceCommand(command);
  return runtime.transport.bind({kind:read?'read':'write',invoke:createCookieRequest('commerce',runtime.cookie),decode:value=>command.action==='request_status_v1'?value:mapCommerceResult(command,value,{actorId:actor,requestHash:hash})}).execute(command,options);
 }};
 return {runtime,request,calls,setReply(value){reply=value;},setLogin(value){login={...login,...value};}};
}
