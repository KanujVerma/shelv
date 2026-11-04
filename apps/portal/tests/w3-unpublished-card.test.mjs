import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {sourceModule} from './rebuild-maya-five-stage-build.mjs';
import {mayaPlan} from './rebuild/plan-fixture.mjs';
import {memorySession} from './rebuild-plan-guidance-fixture.mjs';

const require=createRequire(import.meta.url),runtime=require('react/jsx-runtime');
const original={jsx:runtime.jsx,jsxs:runtime.jsxs};let renderCard,renderChoice,buttons=[];
const text=value=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):value?.props?text(value.props.children):'';
before(async()=>{
  for(const key of ['jsx','jsxs'])runtime[key]=(type,props,...rest)=>{
    if(type==='button')buttons.push({label:text(props.children),props});
    return original[key](type,props,...rest);
  };
  ({exports:{renderCard,renderChoice}}=await sourceModule('tests/w3/unpublished-card-render.tsx'));
});
after(()=>Object.assign(runtime,original));
function packet(){
  return {preview:{mode:'advisor-preview',published:false,target:null,content:mayaPlan().plan.content,issues:[]},
    source:{draftId:'33333333-3333-4333-8333-000000000999',contentRevision:1,assignmentRevision:0,target:null},
    decisionId:'maya-card-treatments',session:memorySession()};
}
function render(props){buttons=[];return renderCard(props);}

test('actual choice presentation forwards the original handler and busy/disabled state unchanged',()=>{
  for(const [choice,purchase,label,variant] of [['approved',true,'approve product','primary'],['approved',false,'approve decision','primary'],['deferred',true,'decide later','secondary'],['declined',true,'decline','ghost']]){
    for(const disabled of [false,true]){
      let eventSeen;const handler=event=>{eventSeen=event;};const busy=choice==='approved'&&disabled;
      buttons=[];renderChoice({choice,purchase,disabled,busy,onClick:handler});assert.equal(buttons.length,1);
      const button=buttons[0];assert.equal(button.label,label);assert.equal(button.props.onClick,handler);assert.equal(button.props.disabled,disabled||busy);
      assert.ok(button.props.className.includes('shelv-button-'+variant));
      const event={type:'click'};button.props.onClick(event);assert.equal(eventSeen,event);
    }
  }
});

test('selected canonical unpublished decision shows its own identity/reason and one disabled callback-free approval',()=>{
  const props=packet(),decision=props.preview.content.decisions.find(decision=>decision.id===props.decisionId),html=render(props);
  assert.match(html,/client preview · unpublished/);assert.match(html,/Azelaic Acid/);assert.ok(html.includes(decision.reason));
  assert.equal(buttons.length,1);assert.equal(buttons[0].label,'approve product');assert.equal(buttons[0].props.disabled,true);assert.equal(buttons[0].props.onClick,undefined);
  assert.doesNotMatch(html,/<h1|plan-columns|your current routine|start not recorded|published at|next check-in|recorded choice/);
});

test('runtime extra operations and callbacks never cross the compact adapter',()=>{
  let calls=0;const denied=()=>{calls++;throw Error('operation attempted');};
  const props={...packet(),mode:'client',published:true,ports:{read:{execute:denied},care:{execute:denied}},onApprove:denied,onRecordUse:denied,onSelfPurchase:denied,onExport:denied,navigation:{navigate:denied}};
  const html=render(props);assert.match(html,/Azelaic Acid/);assert.equal(calls,0);
  for(const button of buttons){assert.equal(button.props.disabled,true);assert.equal(button.props.onClick,undefined);}
});

test('null selection never guesses the first decision',()=>{
  const props=packet();props.decisionId=null;const html=render(props);
  assert.match(html,/select a decision to preview/);assert.doesNotMatch(html,/Azelaic Acid/);assert.equal(buttons.length,0);
});

test('an empty draft and missing selection have distinct honest states',()=>{
  const props=packet();props.preview.content.decisions=[];props.decisionId=null;
  assert.match(render(props),/no decision in this draft/);assert.equal(buttons.length,0);
  props.decisionId='absent';assert.match(render(props),/this decision is unavailable/);assert.equal(buttons.length,0);
});

test('an exact product-free decision stays product-free and uses the nonpurchase approval label',()=>{
  const props=packet();props.decisionId='maya-card-sunscreen';const html=render(props);
  assert.match(html,/Sunscreen/);assert.doesNotMatch(html,/plan-product-identity|Azelaic Acid/);
  assert.equal(buttons.length,1);assert.equal(buttons[0].label,'approve decision');assert.equal(buttons[0].props.disabled,true);
});

test('incomplete identity and missing imagery retain the shared neutral fallback',()=>{
  const props=packet(),product=props.preview.content.products.find(product=>product.id==='ordinary-azelaic-10');
  product.name='';product.variant=null;product.imageUrl=null;product.strength={state:'unknown'};product.sizeLabel='';
  const html=render(props);assert.match(html,/product name not recorded/);assert.match(html,/product image unavailable/);assert.doesNotMatch(html,/<img/);
});

for(const fault of ['source-revision','source-extra','private-extra','dangling-product','markup'])test('invalid '+fault+' preview remains unavailable',()=>{
  const props=packet();
  if(fault==='source-revision')props.source.contentRevision=-1;
  if(fault==='source-extra')props.source.content=props.preview.content;
  if(fault==='private-extra')props.preview.privateNotes='PRIVATE_NOT_ALLOWED';
  if(fault==='dangling-product')props.preview.content.products=[];
  if(fault==='markup')props.preview.content.decisions[0].reason='<script>unsafe</script>';
  const html=render(props);assert.match(html,/preview unavailable/);assert.doesNotMatch(html,/PRIVATE_NOT_ALLOWED|Azelaic Acid|unsafe/);assert.equal(buttons.length,0);
});

test('assigned preview binds exact target revisions rather than borrowing publication metadata',()=>{
  const props=packet(),target={draftId:props.source.draftId,clientId:'22222222-2222-4222-8222-222222222222',contentRevision:1,assignmentRevision:0,contentHash:'a'.repeat(64)};
  props.preview.target=target;props.source.target=target;assert.match(render(props),/Azelaic Acid/);
  props.source={...props.source,contentRevision:2};assert.match(render(props),/preview unavailable/);assert.equal(buttons.length,0);
});

test('session invalidation removes preview content before reading it again',()=>{
  const props=packet();assert.match(render(props),/Azelaic Acid/);props.session.end();
  props.preview=new Proxy(props.preview,{get(){throw Error('retired preview read');}});
  const html=render(props);assert.match(html,/session changed/);assert.equal(buttons.length,0);
});

test('a session retired during preview validation cannot render the old decision',()=>{
  const props=packet(),content=props.preview.content;
  Object.defineProperty(props.preview,'content',{enumerable:true,get(){props.session.end();return content;}});
  const html=render(props);assert.match(html,/session changed/);assert.doesNotMatch(html,/Azelaic Acid/);assert.equal(buttons.length,0);
});
