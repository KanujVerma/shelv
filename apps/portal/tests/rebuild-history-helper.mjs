// Pure synthetic value/session boundary helper. No browser, Auth, DB or network.
import {carePlan,owner,uid} from './rebuild/care-fixture.mjs';
import {mapReviewResult} from '../../../src/contracts/PortalReviewMapping.ts';
export {owner,uid};
export const publication={version:1,documentSchemaVersion:3};
export function view(){const v=carePlan();v.plan.content.goals=[{id:'authored-goal',text:'A source-authored goal',factIds:[]}];return mapReviewResult({...v,schemaVersion:3,currentGuidance:{schemaVersion:1,mode:'current_document',instructionSemantics:'current_for_selected_publication',snapshot:{publication,currentPublication:publication,useHead:0,reportHead:0,instructionHead:0,serviceRevision:1,decisionRevision:0,asOfDay:'2026-10-30',manifestHash:'a'.repeat(64)},instructionCount:0},decisionGuidance:[]},{schemaVersion:1,action:'read_client_plan_v3',version:null});}
export function page(){return {schemaVersion:1,audience:'client',version:null,heads:{useHead:0,reportHead:0,instructionHead:0,serviceRevision:1,publicationVersion:1},entries:[],nextCursor:null};}
export function session(){let live=true;const memory=new Map(),listeners=new Set();return {key:uid(700),isCurrent:()=>live,subscribeInvalidation(fn){listeners.add(fn);return()=>listeners.delete(fn);},memory:{get:k=>memory.get(k),set:(k,v)=>memory.set(k,v),delete:k=>memory.delete(k)},end(){live=false;memory.clear();listeners.forEach(fn=>fn());}};}
export function harness(){let response=null;const calls=[],s=session();const port={async execute(c){calls.push(structuredClone(c));if(response)return response(c);return {state:'ok',value:c.action==='read_client_plan_v3'?view():page()};}};return {context:{session:s,mode:'client',port},calls,set(fn){response=fn;},session:s};}
export function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
export function noop(c){return {requestId:c.requestId,action:c.action,outcome:'no_op',reason:'no_observation',revision:c.expectedReportRevision,event:null,amendmentId:null,notificationEventId:null,attentionEventId:null};}
export function receipt(c){return {requestId:c.requestId,action:c.action,event:c.action==='amend_report_v1'?c.event:{kind:'goal_report',id:uid(3)},amendmentId:c.action==='amend_report_v1'?uid(4):null,revision:c.expectedReportRevision+1,recordedAt:'2026-10-30T12:00:00Z',notificationEventId:uid(5),attentionEventId:uid(6)};}
