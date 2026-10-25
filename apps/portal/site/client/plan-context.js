const list=value=>Array.isArray(value)?value:[];
const primaryKinds=new Set(['replace','addition']);
function sourceCard(view,step){
 const publication=view.plan?.version===step.source?.publicationVersion?view.plan:list(view.history).find(plan=>plan.version===step.source?.publicationVersion);
 return list(publication?.presentation?.categoryCards).find(card=>card.recommendationId===step.source?.recommendationId&&card.proposedProduct?.id===step.productId);
}
/** Short questions are selected from declared public goals and structured plan
 * decisions, never a client name or an ingredient-based tolerance assumption.
 * Other plans retain neutral questions; overview paragraphs aren't form prompts.
 */
function questionsFor(p,view,active){
 const cards=list(p.categoryCards),primary=cards.find(card=>primaryKinds.has(card.kind)&&card.recommendationId&&card.proposedProduct);
 if(!primary)return null;
 const sections=list(p.consultationSections);
 const goal=sections.find(section=>section.title==='What success looks like')?.body||'';
 const comfortGoal=goal.startsWith('Comfortable application, cheeks that stay comfortable, good wear under your existing sunscreen and makeup,')&&!/\b(?:not|never|without)\b/i.test(goal);
 const marksGoal=sections.some(section=>section.title==='What we’re working on'&&section.body.startsWith('The brown marks that linger after spots are the priority in this plan.'));
 const layeringGoal=sections.some(section=>section.title==='What we’re simplifying'&&section.body.startsWith('Pilling on some serum mornings has been getting in the way of sunscreen and makeup.'));
 const startedStep=active.find(step=>step.slot===primary.slot&&step.productId===primary.proposedProduct.id),started=Boolean(startedStep);
 const periods=startedStep?.usage?.periods||primary.usage?.periods;
 const declined=list(view.plan.itemStates).find(state=>state.recommendationId===primary.recommendationId)?.choice==='declined';
 const name=startedStep?(startedStep.product?.name||startedStep.title||'the recorded product'):primary.proposedProduct.name;
 if(primary.slot==='moisturizer'&&comfortGoal&&list(periods).includes('morning')&&list(periods).includes('evening'))return started?{
  comfort:`Since you started ${name}, have your cheeks stayed comfortable when you apply it and later in the day?`,
  consistency:'How has it fit into your morning and evening routine?',
  changes:'When you’ve worn sunscreen or makeup over it, how has it worn?',
 }:{
  comfort:'How are your cheeks feeling with your current routine?',
  consistency:declined?'Would you like to revisit the moisturizer choice, or is there something else you’d like me to consider?':`Is anything holding up the proposed change to ${name}?`,
  changes:'How are sunscreen and makeup wearing with your current routine?',
 };
 const serumPause=cards.some(card=>card.kind==='pause'&&card.slot==='serums');
 if(primary.slot==='treatments'&&serumPause&&marksGoal&&layeringGoal)return{
  comfort:started?`Since you started ${name}, have you noticed irritation or any change in the marks?`:'How is your current routine feeling?',
  consistency:started?'How often have you been using it? Have you paused or left more time between uses?':declined?`Would you like to revisit ${name}, or is there something else you’d like me to consider?`:`Have you started ${name}? If so, how often have you used it, and have you noticed irritation or any change in the marks? If not, is anything holding up the proposed change?`,
  changes:'If you’ve paused the extra serums, how are your sunscreen and makeup wearing?',
 };
 return null;
}
/** Optional display context from public plan fields and actual routine starts.
 * Approval, receipt and payment never establish use. This does not persist data.
 */
export function planCheckinContext(view){
 const p=view?.plan?.presentation;
 if(p?.schemaVersion!==2)return null;
 const active=list(view.activeRoutine).filter(step=>step.kind==='product'&&step.source?.kind==='activation').slice().sort((a,b)=>Number(!primaryKinds.has(sourceCard(view,a)?.kind))-Number(!primaryKinds.has(sourceCard(view,b)?.kind)));
 const startedProducts=active.map(step=>{
  const record=list(view.routineHistory).filter(row=>row.version===step.source.publicationVersion&&row.recommendationId===step.source.recommendationId&&row.slot===step.slot&&row.productId===step.productId).sort((a,b)=>String(b.startedOn).localeCompare(String(a.startedOn)))[0];
  return {name:step.product?.name||step.title,startedOn:record?.startedOn||null};
 });
 const pendingProducts=list(p.categoryCards).filter(card=>['replace','addition','finish_then_replace'].includes(card.kind)&&card.recommendationId&&card.proposedProduct&&!active.some(step=>step.slot===card.slot&&step.productId===card.proposedProduct.id)&&list(view.plan.itemStates).find(state=>state.recommendationId===card.recommendationId)?.choice!=='declined').map(card=>({name:card.proposedProduct.name}));
 return {startedProducts,pendingProducts,questions:questionsFor(p,view,active)};
}
