import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNeutralNotificationEmail,readNeutralNotificationEmail} from '../../../supabase/functions/concierge-notifications/neutralPayload.ts';
import {prepareApplication} from '../src/app/bootstrap.ts';

const origin='https://portal.synthetic.invalid';
const id=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
function attention(){return{
 schemaVersion:1,deliveryId:id(1),leaseId:id(2),recipientId:id(3),idempotencyKey:id(1),
 leaseUntil:'2099-01-01T00:00:00.000Z',recipient:{email:'advisor@synthetic.invalid'},
 event:{eventId:id(4),createdAt:'2026-11-01T00:00:00.000Z',
  source:{kind:'review',recordId:id(5),version:1,eventKind:'goal_reported'},
  destination:{kind:'unavailable',reason:'advisor_review_resolution_unavailable'}},
};}
function emailAt(link){return{
 deliveryId:id(1),to:'advisor@synthetic.invalid',subject:'an update from shelv',link,
 text:`there is an update in your shelv portal. sign in to view it.\n\n${link}`,
};}
function bootstrap(link){return prepareApplication({href:link},{replaceState(){throw Error('no callback or auth work expected');}});}

test('goal-report advisor attention opens the canonical advisor inbox',()=>{
 const email=buildNeutralNotificationEmail(attention(),origin);
 assert.equal(email.link,origin+'/advisor/notifications');
 assert.equal(email.subject,'an update from shelv');
 assert.equal(email.text,emailAt(email.link).text);
 assert.doesNotMatch(email.text,/goal_report|recordId|10000000|photo|PRIVATE/);
});
test('the strict neutral-email decoder accepts the exact advisor inbox',()=>{
 const value=emailAt(origin+'/advisor/notifications');
 assert.deepEqual(readNeutralNotificationEmail(value),value);
});
test('the generated advisor link selects advisor startup without a callback',()=>{
 const actual=bootstrap(buildNeutralNotificationEmail(attention(),origin).link);
 assert.equal(actual.audience,'advisor');assert.deepEqual(actual.route,{name:'advisor-notifications'});
 assert.deepEqual(actual.callback,{kind:null,code:null,error:false});
});
test('client publication links retain their immutable version and client audience',()=>{
 const context=attention();context.event={eventId:id(4),createdAt:'2026-11-01T00:00:00.000Z',
  source:{kind:'publication',publicationVersion:7},destination:{kind:'plan_version',version:7}};
 const value=buildNeutralNotificationEmail(context,origin);
 assert.equal(value.link,origin+'/history/versions/7');assert.deepEqual(readNeutralNotificationEmail(value),value);
 assert.equal(bootstrap(value.link).audience,'client');
});
test('published public-review history links retain their exact record and client audience',()=>{
 const context=attention();context.event={eventId:id(4),createdAt:'2026-11-01T00:00:00.000Z',
  source:{kind:'guidance',recordId:id(5),version:1,eventKind:'review_published'},
  destination:{kind:'public_history',recordKind:'review',recordId:id(5)}};
 const value=buildNeutralNotificationEmail(context,origin);
 assert.equal(value.link,origin+'/history/public_review%3A'+id(5));
 assert.deepEqual(readNeutralNotificationEmail(value),value);assert.equal(bootstrap(value.link).audience,'client');
});
test('the existing client inbox decoder and audience remain compatible',()=>{
 const value=emailAt(origin+'/notifications');assert.deepEqual(readNeutralNotificationEmail(value),value);
 assert.equal(bootstrap(value.link).audience,'client');
});
test('advisor support does not relax unsafe URL, unadmitted route or neutral-text checks',()=>{
 for(const link of ['http://portal.synthetic.invalid/advisor/notifications',
  'https://user:password@portal.synthetic.invalid/advisor/notifications',origin+'/advisor/notifications?next=/private',
  origin+'/advisor/notifications#PRIVATE',origin+'/advisor/reviews/'+id(5),origin+'/private']){
  assert.throws(()=>readNeutralNotificationEmail(emailAt(link)),link);
 }
 assert.throws(()=>readNeutralNotificationEmail({...emailAt(origin+'/advisor/notifications'),text:'PRIVATE'}));
 assert.throws(()=>buildNeutralNotificationEmail(attention(),origin+'/unexpected'));
});
