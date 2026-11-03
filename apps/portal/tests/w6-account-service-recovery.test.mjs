// Closed HTTP through actual ApplicationSession/cookie and Root service codecs.
// Synthetic namespace registration is explicit in the source-only build packet.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createAccountServiceController} from '../src/features/account/service/controller.ts';
import {readClientServiceCommand} from '../../../src/contracts/PortalClientServiceValidation.ts';

test('a lost cancellation can resolve the exact original after absent status and a changed current basis', async t => {
  const actor='11111111-1111-4111-8111-111111111111',calls=[];
  let current={schemaVersion:1,serviceRevision:7,basisHash:'a'.repeat(64),asOfDay:'2026-11-03',
    coverage:{status:'active',period:{startOn:'2026-11-01',endOn:'2026-12-01'},paidSupportEndsOn:'2027-01-01',pendingPublication:false},
    cancellation:null,periodEndCancellation:{state:'available',supportEndsOn:'2027-01-01',readOnlyEndsOn:'2027-01-31'}};
  let sends=0;
  const originalFetch=globalThis.fetch;globalThis.fetch=async()=>{throw Error('unexpected global network');};t.after(()=>{globalThis.fetch=originalFetch;});
  const runtime=createApplicationSession({audience:'client',now:()=>Date.parse('2026-11-03T12:00:00Z'),locks:{request:async(_name,_options,run)=>run()},
    fetcher:async(url,init)=>{
      if(url==='/api/client/session')return Response.json({signedIn:true,ownerId:actor,generation:1,csrf:'synthetic-service-recovery',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
      assert.equal(url,'/api/client/account-service');
      const command=readClientServiceCommand(JSON.parse(init.body));calls.push({command,wire:init.body});
      if(command.action==='read_client_service_v1')return Response.json(current);
      if(command.action==='client_service_request_status_v1')return Response.json({schemaVersion:1,requestId:command.requestId,state:'absent'});
      sends++;
      return Response.json({code:sends===1?'unavailable':'revision_conflict'},{status:sends===1?503:409});
    }});
  await runtime.restore();runtime.cookie.channel?.unref?.();t.after(()=>runtime.dispose());
  const controller=createAccountServiceController(runtime);t.after(()=>controller.dispose());
  assert.equal(await controller.load(),true);assert.equal(controller.openCancellation(controller.getSnapshot().current),true);
  const review=controller.getSnapshot().draft;await controller.confirmCancellation(review);
  const original=controller.getSnapshot().original,wire=calls.find(call=>call.command.action==='cancel_client_service_period_end_v1').wire;
  assert.ok(original);assert.equal(sends,1);await runtime.restore();
  current={...current,serviceRevision:8,basisHash:'b'.repeat(64),coverage:{...current.coverage,paidSupportEndsOn:'2027-02-01'},periodEndCancellation:{state:'available',supportEndsOn:'2027-02-01',readOnlyEndsOn:'2027-03-03'}};
  assert.equal(await controller.readOriginalStatus(original),true);
  assert.equal(controller.getSnapshot().originalStatus.state,'absent');assert.equal(sends,1,'status never resends');
  assert.equal(controller.getSnapshot().canRetry,true,'exact original recovery must reach server idempotency/CAS even after basis drift');
  await controller.retryOriginal(original);
  assert.equal(sends,2);assert.equal(calls.filter(call=>call.command.action==='cancel_client_service_period_end_v1')[1].wire,wire);
  assert.equal(controller.getSnapshot().writeState,'conflict');
  assert.equal(controller.discardCancellation(review),true);await controller.readCurrent();
  assert.equal(controller.openCancellation(controller.getSnapshot().current),true);assert.equal(controller.getSnapshot().canConfirm,true);
  assert.equal(sends,2,'a new cancellation still needs a separate deliberate confirmation');
});
