import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {start,stop,setup,select} from './rebuild/care-browser.mjs';
import {careHttp} from './rebuild/care-http.mjs';

before(start);after(stop);
for(const width of [1440,390,320])test(`approved self-purchased product remains reachable for explicit Start at ${width}px`,async()=>{
  const http=careHttp();
  const f=await setup('/plan/recommendations/maya-card-treatments',width,async(command,context)=>{
    if(command.action==='record_decision_v1'){
      const view=structuredClone(context.view);
      view.decisionRevision++;
      view.decisions=[...view.decisions.filter(choice=>choice.decisionId!==command.decisionId),{decisionId:command.decisionId,choice:command.choice,reason:command.reason}];
      context.setView(view);
      return {json:{requestId:command.requestId,decisionRevision:view.decisionRevision,publicationVersion:command.publicationVersion,decisionId:command.decisionId,choice:command.choice,reason:command.reason}};
    }
    return http.reply(command,context);
  });
  try {
    const p=f.page;
    await p.getByRole('button',{name:'approve product',exact:true}).click();
    await p.getByText('choice recorded',{exact:true}).waitFor();
    await p.getByRole('button',{name:'back to plan',exact:true}).click();
    const option=p.locator('.plan-proposal').filter({hasText:'approved option'});
    await option.getByRole('button',{name:'view recommendation',exact:true}).waitFor();
    assert.equal(await p.locator('[data-plan-routine] [data-product-id="ordinary-azelaic-10"]').count(),0);
    assert.equal(http.events.length,0,'a product approval must not create use');
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    const action=option.getByRole('button',{name:'record actual use',exact:true});
    await action.focus();await p.keyboard.press('Enter');
    await p.getByRole('heading',{name:'The Ordinary Azelaic Acid Suspension 10%',exact:true}).waitFor();
    await p.getByRole('button',{name:'yes',exact:true}).click();
    await select(p,'what changed?','started earlier');
    await select(p,'when did this happen?','date not known');
    await select(p,'how did you get it?','i bought it myself');
    await p.getByRole('button',{name:'record start',exact:true}).click();
    await p.getByText('use report recorded',{exact:true}).waitFor();
    const report=http.writes.find(command=>command.action==='report_product_use_v1');
    assert.equal(report.product.productId,'ordinary-azelaic-10');
    assert.equal(report.change.kind,'started');
    assert.equal(report.acquisition,'self');
    assert.deepEqual(report.occurredOn,{state:'unknown'});
    assert.ok(f.calls.every(call=>['/api/client/care','/api/client/plans'].includes(call.path)));
    await p.getByRole('button',{name:'back to plan',exact:true}).click();
    assert.equal(await p.locator('.plan-proposal').filter({hasText:'approved option'}).count(),0);
    await p.getByRole('tab',{name:'evening',exact:true}).click();
    await p.locator('[data-plan-routine] [data-product-id="ordinary-azelaic-10"]').waitFor();
  } finally {await f.close();}
});
