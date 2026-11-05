import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createApplicationSession} from '../src/app/session.ts';
import {createNotificationViewLease} from '../src/app/notification-owner.ts';
import {fixture,ids} from './rebuild/advisor-fixture.mjs';
const api=await import('./helpers/publication-notification-fixture.mjs').catch(error=>{
 if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;return{};
});
test('the shared finite fixtures can classify only the committed publication delivery read',()=>{
 assert.equal(typeof api.publicationDeliveryReadUnavailable,'function');
});
if(api.publicationDeliveryReadUnavailable){
 const csrf='SYNTHETIC-notification-fixture',publication={notificationEventId:ids.event};
 const input=()=>({pathname:'/api/advisor/notifications',method:'POST',csrf,
  command:{schemaVersion:1,action:'read_event_deliveries_v1',eventId:ids.event,cursor:null,limit:50}});
 const read=(request=input(),...receipts)=>api.publicationDeliveryReadUnavailable(request,{csrf,publication:receipts.length?receipts[0]:publication});
 test('the expected read yields only a finite not-found response, never delivery facts',()=>{
  assert.deepEqual(read(),{status:404,json:{code:'not_found'}});
 });
 test('no publication acknowledgement means no notification allowance',()=>{
  assert.equal(read(input(),null),null);assert.equal(read(input(),undefined),null);
 });
 for(const patch of [{pathname:'/api/client/notifications'},{pathname:'/api/advisor/plans'},{method:'GET'},{method:'DELETE'},{csrf:'foreign'},{csrf:undefined}])
  test('different path, method or CSRF remains outside the exact fixture allowance '+JSON.stringify(patch),()=>{
   assert.equal(read({...input(),...patch}),null);
  });
 for(const patch of [{action:'list_inbox_v1'},{action:'mark_seen_v1'},{action:'retry_failed_email_v1'},{action:'request_status_v1'},
  {eventId:ids.other},{cursor:'another-page'},{limit:25},{clientId:ids.client},{actorId:ids.actor},{schemaVersion:2}])
  test('unknown or mismatched notification intent stays trapped '+JSON.stringify(patch),()=>{
   const request=input();assert.equal(read({...request,command:{...request.command,...patch}}),null);
  });
 test('malformed or accessor commands are not evaluated or accepted',()=>{
  let calls=0;const request=input();
  const command={...request.command,get eventId(){calls++;return ids.event;}};
  assert.equal(read({...request,command}),null);assert.equal(calls,0);
  assert.equal(read({...request,command:null}),null);
 });
 test('the actual Root notification SDK consumes the precise read denial without a write or session suspension',async t=>{
  const f=fixture({ready:true}),target=f.getView().target;
  const command={schemaVersion:1,action:'publish_plan_v1',requestId:ids.receipt,target,approvalId:ids.approval,firstServiceClaimId:null};
  const receipt=await f.options.ports.plans.execute(command),calls=[];
  const runtime=createApplicationSession({audience:'advisor',locks:{request:async(_name,options,run)=>run(options.signal)},fetcher:async(url,init)=>{
   if(url==='/api/advisor/session')return Response.json({signedIn:true,ownerId:ids.actor,generation:1,csrf,
    capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'});
   const request={pathname:url,method:init.method,csrf:new Headers(init.headers).get('X-Shelv-CSRF'),command:JSON.parse(init.body)};
   const response=api.publicationDeliveryReadUnavailable(request,{csrf,publication:receipt});
   assert.ok(response,'unexpected fixed request remains rejected');calls.push(request.command);
   return Response.json(response.json,{status:response.status});
  }});
  await runtime.restore();const lease=createNotificationViewLease(runtime);t.after(()=>{lease.dispose();runtime.dispose();});
  assert.equal(lease.start(),true);await lease.controller.openPublication(command,receipt);
  assert.deepEqual(calls,[{schemaVersion:1,action:'read_event_deliveries_v1',eventId:receipt.notificationEventId,cursor:null,limit:50}]);
  assert.equal(runtime.cookie.status,'ready');assert.equal(lease.controller.getSnapshot().deliveries,null);
  assert.equal(lease.controller.getSnapshot().phase,'error');assert.equal(lease.controller.getSnapshot().pending,null);
 });
}

const helperImport='import { publicationDeliveryReadUnavailable } from "./helpers/publication-notification-fixture.mjs";\n';
const helperRead=`      const deliveryRead = publicationDeliveryReadUnavailable({
        pathname: url.pathname, method: request.method(),
        csrf: request.headers()["x-shelv-csrf"],
        command: url.pathname === "/api/advisor/notifications" && request.method() === "POST" ? request.postDataJSON() : null,
      }, {
        csrf: s.csrf,
        publication: [...s.receipts.values()].filter(value => value.command.action === "publish_plan_v1").at(-1)?.result,
      });
      if (deliveryRead) {
        const command = request.postDataJSON();
        s.calls.push({ url: url.pathname, command, bytes: request.postData() });
        expectedStatuses.push(deliveryRead.status);
        return route.fulfill({ status: deliveryRead.status, json: deliveryRead.json });
      }
`;
const appRead=`      const deliveryRead = publicationDeliveryReadUnavailable({
        pathname: url.pathname, method: request.method(),
        csrf: request.headers()["x-shelv-csrf"], command,
      }, { csrf: s.csrf, publication: s.publicationNotificationReceipt });
      if (deliveryRead)
        return route.fulfill({ status: deliveryRead.status, json: deliveryRead.json });
`;
const captured=`          if (actions.includes(command.action)) {
            const result = await s.f.options.ports.plans.execute(command);
            if (command.action === "publish_plan_v1") s.publicationNotificationReceipt = structuredClone(result);
            return route.fulfill({ json: result });
          }
`;
const original=`          if (actions.includes(command.action))
            return route.fulfill({
              json: await s.f.options.ports.plans.execute(command),
            });
`;
function replaceOne(source,from,to=''){
 assert.equal(source.split(from).length,2,'only the exact allocated clause may be reversed');
 return source.replace(from,to);
}
const digest=value=>createHash('sha256').update(value).digest('hex');
test('the entire original dependencies-browser helper is restored by only reversing its import and exact read allowance',()=>{
 let source=readFileSync(new URL('./rebuild-advisor-dependencies-browser-helper.mjs',import.meta.url),'utf8');
 source=replaceOne(source,helperImport);source=replaceOne(source,helperRead);
 assert.equal(digest(source),'f391334cd6ce99618aedda9a61deb5e1cad72988481dc40ed317b79296d8f327');
});
test('the entire original app-browser suite is restored by only reversing its import, receipt capture and exact read allowance',()=>{
 let source=readFileSync(new URL('./rebuild-app-browser.test.mjs',import.meta.url),'utf8');
 source=replaceOne(source,helperImport);source=replaceOne(source,appRead);source=replaceOne(source,captured,original);
 assert.equal(digest(source),'26dba35a7a4f25040da6b9890a0a5be5c8a98b6aeb1c291bc5f02a3c97eff02b');
});
