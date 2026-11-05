import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {start,stop,setup,repo} from './rebuild/care-browser.mjs';
import {actors,attributedCorrection,correctionTime} from './rebuild/care-attribution-fixture.mjs';
import {mapCareResult} from '../../../src/contracts/PortalCareMapping.ts';
import {read} from './rebuild/care-fixture.mjs';

before(start);
after(stop);
const evidence=path.join(repo,'.local-artifacts/portal-rebuild/w3-care-attribution');

async function open(fixture){
  return setup(fixture.route,1440,async command=>{
    if(command.action==='read_client_plan_v2')return {json:fixture.view};
    if(command.action==='read_use_history_v1'){
      assert.deepEqual(command,fixture.command,'history must retain the original exact product/publication');
      return {json:fixture.history};
    }
    return null;
  });
}
function onlyReads(f){
  assert.ok(f.calls.every(call=>call.path==='/api/client/care'&&['read_client_plan_v2','read_use_history_v1'].includes(call.command.action)),'viewing reports cannot emit a write or another channel action');
}
function noInventedIdentity(text){
  for(const id of Object.values(actors))assert.equal(text.includes(id),false,'opaque actor IDs are not customer copy');
  for(const name of ['Kanuj','Sami'])assert.equal(text.includes(name),false,'policy or preparer names are not correction actors');
}

// These fail if the reader omits amendedBy, copies the original recorder, or labels every correction as an advisor.
for(const [actor,label] of [['client','client'],['advisor','advisor'],['otherAdvisor','another advisor']]){
  test('compact and full correction identify '+actor+' from its actual decoded ID',async()=>{
    const fixture=attributedCorrection(actor),f=await open(fixture);
    try{
      const dialog=f.page.getByRole('dialog'),facts=dialog.locator('.plan-use-facts');
      assert.equal(fixture.view.use.planProducts.find(row=>row.product.productId==='cerave-pm').latestEvent.amendment.amendedBy,actors[actor]);
      assert.equal(fixture.history.entries[0].event.amendment.amendedBy,actors[actor]);
      const compact=await facts.innerText();
      assert.match(compact,new RegExp('correction by '+label+' · recorded '+correctionTime));
      assert.match(compact,/reported by client · recorded by advisor · call · original report · occurred 2026-10-29 · recorded 2026-10-30T12:00:00Z/);
      assert.equal(compact.includes('CU3 CURRENT DETAILS'),false,'summary does not pretend to contain the full body');
      assert.deepEqual(f.calls.map(call=>call.command.action),['read_client_plan_v2']);
      await dialog.getByRole('button',{name:'view original report',exact:true}).click();
      await dialog.getByText('CU3 CURRENT DETAILS',{exact:true}).waitFor();
      const full=await facts.innerText(),[original,correction]=full.split('current correction');
      assert.match(original,/CU3 ORIGINAL CALL DETAILS/);
      assert.match(original,/acquisition: unknown/);
      assert.equal(original.includes('CU3 CORRECTION REASON'),false);
      assert.match(correction,new RegExp('correction by '+label+' · amended '+correctionTime));
      for(const text of ['CU3 CORRECTION REASON','CU3 CURRENT DETAILS','frequency: twice a week','amount: not known'])assert.ok(correction.includes(text));
      assert.equal(correction.includes('CU3 ORIGINAL CALL DETAILS'),false);
      assert.equal(await dialog.getByRole('button',{name:'view original report',exact:true}).count(),0);
      noInventedIdentity(full);onlyReads(f);
      await fs.mkdir(evidence,{recursive:true});
      await fs.writeFile(path.join(evidence,'durable-'+actor+'.json'),JSON.stringify({compact,full,view:fixture.view,history:fixture.history,calls:f.calls},null,2));
      await f.page.screenshot({path:path.join(evidence,'durable-'+actor+'.png'),fullPage:true});
    }finally{await f.close();}
  });
}

for(const options of [{differentProduct:true},{selfRecorded:true},{access:'read_only'},{reportedProduct:true}]){
  test('correction actor stays separate with '+JSON.stringify(options),async()=>{
    const fixture=attributedCorrection('otherAdvisor',options),f=await open(fixture);
    try{
      const dialog=f.page.getByRole('dialog');
      await dialog.getByRole('button',{name:'view original report',exact:true}).click();
      await dialog.getByText('CU3 CURRENT DETAILS',{exact:true}).waitFor();
      const text=await dialog.locator('.plan-use-facts').innerText(),[original,correction]=text.split('current correction');
      assert.ok(original.includes('CU3 ORIGINAL CALL DETAILS'));
      assert.match(original,options.selfRecorded?/reported by client · portal/:/reported by client · recorded by advisor · call/);
      assert.match(correction,options.selfRecorded?/correction by advisor/:/correction by another advisor/);
      assert.ok(correction.includes('frequency: twice a week')&&correction.includes('amount: not known'));
      onlyReads(f);noInventedIdentity(text);
    }finally{await f.close();}
  });
}

for(const mode of ['advisor-preview','public-demo','private-walkthrough','historical']){
  test(mode+' retains truthful summary without live details or actions',async()=>{
    const f=await open(attributedCorrection('client'));
    try{
      await f.page.evaluate(mode=>window.__careHarness.setMode(mode),mode);
      await f.page.waitForFunction(mode=>document.querySelector('.shelv-shell')?.getAttribute('data-mode')===mode,mode);
      const dialog=f.page.getByRole('dialog');
      assert.match(await dialog.locator('.plan-use-facts').innerText(),/correction by client · recorded/);
      assert.equal(await dialog.getByRole('button',{name:'view original report',exact:true}).count(),0);
      assert.equal(await dialog.getByText('CU3 CURRENT DETAILS',{exact:true}).count(),0);
      assert.deepEqual(f.calls.map(call=>call.command.action),['read_client_plan_v2']);onlyReads(f);
    }finally{await f.close();}
  });
}

test('summary remains attributed when the care details capability is absent',async()=>{
  const f=await open(attributedCorrection('otherAdvisor'));
  try{
    await f.page.evaluate(()=>window.__careHarness.setCareEnabled(false));
    const dialog=f.page.getByRole('dialog');
    await dialog.getByRole('button',{name:'view original report',exact:true}).waitFor({state:'hidden'});
    assert.match(await dialog.locator('.plan-use-facts').innerText(),/correction by another advisor/);
    assert.deepEqual(f.calls.map(call=>call.command.action),['read_client_plan_v2']);onlyReads(f);
  }finally{await f.close();}
});

test('actual controller replacement updates the actor and retires the prior loaded report',async()=>{
  let current=attributedCorrection('client');
  const f=await setup(current.route,1440,async command=>command.action==='read_client_plan_v2'?{json:current.view}:command.action==='read_use_history_v1'?(assert.deepEqual(command,current.command),{json:current.history}):null);
  try{
    const dialog=f.page.getByRole('dialog');
    await dialog.getByRole('button',{name:'view original report',exact:true}).click();
    await dialog.getByText('CU3 CURRENT DETAILS',{exact:true}).waitFor();
    assert.match((await dialog.innerText()).split('current correction')[1],/correction by client/);
    current=attributedCorrection('otherAdvisor');
    // This calls unchanged createClientPlanController.accept, including finite
    // Root validation, sameCareValue, and original supplied-object preservation.
    await f.page.evaluate(view=>window.__careHarness.setView(view),current.view);
    await dialog.getByRole('button',{name:'view original report',exact:true}).waitFor();
    assert.match(await dialog.locator('.plan-use-facts').innerText(),/correction by another advisor/);
    assert.equal(await dialog.getByText('CU3 CURRENT DETAILS',{exact:true}).count(),0);
    await dialog.getByRole('button',{name:'view original report',exact:true}).click();
    await dialog.getByText('CU3 CURRENT DETAILS',{exact:true}).waitFor();
    assert.match((await dialog.innerText()).split('current correction')[1],/correction by another advisor/);
    onlyReads(f);assert.equal(f.calls.length,3);
  }finally{await f.close();}
});

for(const width of [390,320])test('attributed full report stays readable at '+width+'px',async()=>{
  const fixture=attributedCorrection('otherAdvisor'),f=await setup(fixture.route,width,async command=>command.action==='read_client_plan_v2'?{json:fixture.view}:command.action==='read_use_history_v1'?{json:fixture.history}:null);
  try{
    const dialog=f.page.getByRole('dialog');
    await dialog.getByRole('button',{name:'view original report',exact:true}).click();
    await dialog.getByText('CU3 CURRENT DETAILS',{exact:true}).waitFor();
    assert.match((await dialog.innerText()).split('current correction')[1],/correction by another advisor/);
    assert.ok(await f.page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
    await f.page.screenshot({path:path.join(evidence,'durable-otherAdvisor-'+width+'.png'),fullPage:true});onlyReads(f);
  }finally{await f.close();}
});

test('mode retirement discards a late full correction and permits a fresh exact read',async()=>{
  const fixture=attributedCorrection('client');let release;
  const f=await setup(fixture.route,1440,async command=>command.action==='read_client_plan_v2'?{json:fixture.view}:command.action==='read_use_history_v1'?(assert.deepEqual(command,fixture.command),await new Promise(resolve=>release=()=>resolve({json:fixture.history}))):null);
  try{
    const dialog=f.page.getByRole('dialog');
    await dialog.getByRole('button',{name:'view original report',exact:true}).click();
    await dialog.getByRole('button',{name:'loading report',exact:true}).waitFor();
    assert.equal(typeof release,'function');
    await f.page.evaluate(()=>window.__careHarness.setMode('historical'));
    await f.page.waitForFunction(()=>document.querySelector('.shelv-shell')?.getAttribute('data-mode')==='historical');
    assert.match(await dialog.locator('.plan-use-facts').innerText(),/correction by client · recorded/);
    await release();
    await f.page.evaluate(()=>window.__careHarness.setMode('client'));
    await dialog.getByRole('button',{name:'view original report',exact:true}).waitFor();
    assert.equal(await dialog.getByText('CU3 CURRENT DETAILS',{exact:true}).count(),0);
    await dialog.getByRole('button',{name:'view original report',exact:true}).click();
    await dialog.getByRole('button',{name:'loading report',exact:true}).waitFor();
    await release();
    await dialog.getByText('CU3 CURRENT DETAILS',{exact:true}).waitFor();
    assert.match((await dialog.innerText()).split('current correction')[1],/correction by client/);onlyReads(f);
    assert.deepEqual(f.calls.map(call=>call.command.action),['read_client_plan_v2','read_use_history_v1','read_use_history_v1']);
  }finally{release?.();await f.close();}
});

for(const actor of [null,'not-an-actor-id'])test('Root refuses unavailable actor '+String(actor)+' without a UI identity guess',()=>{
  const fixture=attributedCorrection('client');
  fixture.view.use.planProducts.find(row=>row.product.productId==='cerave-pm').latestEvent.amendment.amendedBy=actor;
  fixture.history.entries[0].event.amendment.amendedBy=actor;
  assert.throws(()=>mapCareResult(fixture.view,read));
  assert.throws(()=>mapCareResult(fixture.history,fixture.command));
});
