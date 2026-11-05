import test, {before} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {carePlan, summary} from './rebuild/care-fixture.mjs';

let render;
before(async () => {
  const result = await build({
    stdin: {
      contents: `
        import {createElement as h} from 'react';
        import {renderToStaticMarkup} from 'react-dom/server';
        import {ClientPlan} from './src/features/plan/ClientPlan.tsx';
        import {NavigationProvider} from './src/navigation/react.tsx';
        import {OverlayProvider} from './src/ui/overlay.tsx';
        export function render(view,options={}) {
          const navigation={getSnapshot:()=>'/plan',subscribe:()=>()=>{},navigate(){},back(){},backDestination:()=>null};
          const memory=new Map();
          const props={view,mode:'client',session:{key:'w3-test',isCurrent:()=>true,subscribeInvalidation:()=>()=>{},memory:{get:key=>memory.get(key),set:(key,value)=>memory.set(key,value),delete:key=>memory.delete(key)}},ports:{read:{execute(){}},decision:{execute(){}},care:{execute(){}}},onViewChange(){},...options};
          return renderToStaticMarkup(h(NavigationProvider,{navigator:navigation},h(OverlayProvider,null,h(ClientPlan,props))));
        }`,
      loader: 'tsx', resolveDir: new URL('../', import.meta.url).pathname,
    },
    bundle: true, write: false, format: 'cjs', platform: 'node',
    tsconfig: new URL('../tsconfig.frontend.json',import.meta.url).pathname,
    outfile: '/virtual/w3-plan.cjs', loader: {'.css':'empty'},
  });
  const module={exports:{}};
  new Function('require','module','exports',Buffer.from(result.outputFiles[0].contents).toString())(createRequire(import.meta.url),module,module.exports);
  ({render}=module.exports);
});

function approvedPlan() {
  const view=carePlan();
  view.plan.content.decisions=view.plan.content.decisions.filter(decision=>decision.id==='maya-card-treatments');
  view.decisions=[{decisionId:'maya-card-treatments',choice:'approved',reason:null}];
  view.decisionRevision=1;
  return view;
}

test('an approved unstarted product remains reachable from the plan without entering its active routine', () => {
  const html=render(approvedPlan());
  assert.match(html,/class="[^"]*plan-proposal/,'the approved option must remain discoverable');
  assert.match(html,/>approved option</);
  assert.match(html,/>view recommendation</);
  assert.match(html,/>record actual use</);
  assert.match(html,/start not recorded/);
  assert.doesNotMatch(html,/<article[^>]*data-product-id="ordinary-azelaic-10"/);
});

test('declining a product does not keep it as an outstanding next action', () => {
  const view=approvedPlan();view.decisions[0].choice='declined';
  const html=render(view);
  assert.doesNotMatch(html,/class="[^"]*plan-proposal/);
});

test('an approved product with an explicit reported Start leaves the proposal area', () => {
  const view=approvedPlan(), use=view.use.planProducts.find(row=>row.product.productId==='ordinary-azelaic-10');
  use.state='using';use.latestEvent=summary(use.product,'started');
  const html=render(view);
  assert.doesNotMatch(html,/class="[^"]*plan-proposal/);
});

for(const state of ['paused','stopped','using_differently','unreviewed'])test(`reported ${state} is not relabeled as awaiting its first Start`, () => {
  const view=approvedPlan(),use=view.use.planProducts.find(row=>row.product.productId==='ordinary-azelaic-10');
  use.state=state;use.latestEvent=summary(use.product,state==='using_differently'?'different':state==='unreviewed'?'unreviewed_added':state);
  assert.doesNotMatch(render(view),/class="[^"]*plan-proposal/);
});

for(const mode of ['historical','advisor-preview','public-demo','private-walkthrough'])test(`${mode} cannot acquire live use reporting from an approved option`, () => {
  const html=render(approvedPlan(),{mode});
  assert.match(html,/>approved option</);
  assert.doesNotMatch(html,/>record actual use</);
});

test('read-only approved option remains viewable without a care-write control', () => {
  const view=approvedPlan();view.access='read_only';
  const html=render(view);
  assert.match(html,/>view recommendation</);
  assert.doesNotMatch(html,/>record actual use</);
});

test('an unresolved current-use record retains its clarification instead of asserting a missing Start', () => {
  const view=approvedPlan();view.use.planProducts.find(row=>row.product.productId==='ordinary-azelaic-10').contradiction=true;
  const html=render(view),card=html.slice(html.indexOf('class="shelv-panel plan-proposal'));
  assert.match(card,/product and use need clarification/);
});
