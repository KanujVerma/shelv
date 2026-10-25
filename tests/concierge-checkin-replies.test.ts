import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCheckinCall} from '../supabase/functions/concierge-checkins/commands.ts';
import {mapCheckinClientView} from '../supabase/functions/concierge-checkins/projection.ts';
import {handleCheckinsRequest} from '../supabase/functions/concierge-checkins/handler.ts';
import type {CheckinPorts} from '../supabase/functions/concierge-checkins/types.ts';
const client='ae000000-0000-4000-8000-000000000001',advisor='ae000000-0000-4000-8000-000000000002';
const report='ae000000-0000-4000-8000-000000000003',requestId='ae000000-0000-4000-8000-000000000004';
const replyId='ae000000-0000-4000-8000-000000000005',createdAt='2026-10-24T20:00:00Z';
const command={action:'send_advisor_reply',clientId:client,checkinId:report,reply:'Public reply <img src=x onerror=alert(1)>',requestId,expectedRevision:4};
const reply={id:replyId,reply:command.reply,authorId:advisor,createdAt};
const row={id:report,submittedAt:createdAt,comfort:'Fine',consistency:'Often',changes:'',photos:[]};

test('reply command preserves exact public intent and rejects author/time/private-note injection and malformed text',()=>{
 assert.deepEqual(buildCheckinCall(command,advisor),{name:'concierge_checkin_write',args:{p_client_id:client,p_action:'send_advisor_reply',p_request_id:requestId,p_expected_revision:4,p_payload:{checkinId:report,reply:command.reply}}});
 for(const patch of [{authorId:client},{createdAt},{note:'private'},{reply:''},{reply:' \t\n'},{reply:'x'.repeat(4001)},{reply:'🙂'.repeat(4001)},{reply:'bad\u0000text'},{reply:'bad\uD800'}])assert.throws(()=>buildCheckinCall({...command,...patch},advisor),/invalid_input/);
 assert.equal(buildCheckinCall({...command,reply:'🙂'.repeat(4000)},advisor).name,'concierge_checkin_write');
});

test('client reply projection keeps only public reply fields and accepts older reports without replies',()=>{
 const mapped=mapCheckinClientView({revision:5,nextCheckinOn:null,reports:[{...row,advisorReplies:[{...reply,note:'PRIVATE_REPLY_EXTRA',access_token:'PRIVATE_TOKEN'}],meetingNotes:['PRIVATE_REPORT']}],meetingNotes:['PRIVATE_ROOT']});
 assert.equal(mapped.ok,true);if(!mapped.ok)return;
 assert.deepEqual(mapped.value.reports[0],{...row,advisorReplies:[reply]});assert.doesNotMatch(JSON.stringify(mapped.value),/PRIVATE_|meetingNotes|access_token/);
 const legacy=mapCheckinClientView({revision:0,nextCheckinOn:null,reports:[row]});assert.equal(legacy.ok,true);
 for(const advisorReplies of [null,{},[{}],[{...reply,authorId:client+'bad'}],[{...reply,reply:'\uD800'}],[reply,reply]])assert.equal(mapCheckinClientView({revision:5,nextCheckinOn:null,reports:[{...row,advisorReplies}]}).ok,false);
});

test('actual HTTP handler maps reply writes and reprojects read responses without private note leakage',async()=>{
 const calls:unknown[]=[];
 const ports:CheckinPorts={allowedOrigins:[],authenticate:async()=>({id:advisor,is_anonymous:false}),rpc:async(_token,call)=>{calls.push(call);return {error:null,data:call.name==='concierge_checkin_write'?{revision:5,operation:'send_advisor_reply',reportId:report,privateNote:'PRIVATE_RECEIPT'}:{revision:5,nextCheckinOn:null,reports:[{...row,advisorReplies:[{...reply,privateNote:'PRIVATE_NESTED'}]}],meetingNotes:['PRIVATE_NOTES']}};},storage:{origin:'https://synthetic.invalid',upload:async()=>{throw Error('unused');},read:async()=>{throw Error('unused');},sign:async()=>{throw Error('unused');}}};
 const http=(body:unknown)=>handleCheckinsRequest(new Request('https://synthetic.invalid/checkins',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'},body:JSON.stringify(body)}),ports);
 const sent=await http(command);assert.equal(sent.status,200);assert.deepEqual(await sent.json(),{revision:5,operation:'send_advisor_reply',reportId:report});
 const read=await http({action:'client_read'});assert.equal(read.status,200);const body=await read.json();assert.deepEqual(body.reports[0].advisorReplies,[reply]);assert.doesNotMatch(JSON.stringify(body),/PRIVATE_|meetingNotes/);
 assert.equal(calls.length,2);
 for(const reportId of [null,'ae000000-0000-4000-8000-000000000099']){
  ports.rpc=async()=>({data:{revision:5,operation:'send_advisor_reply',reportId},error:null});
  assert.equal((await http(command)).status,503,'Wrong-report acknowledgement cannot confirm a public reply');
 }
});
