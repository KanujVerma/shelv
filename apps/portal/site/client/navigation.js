const views=new Set(['recommendations','routine','checkins','payments','service','about','history']);
/** Display-only default. Optional and next-bottle ideas never block an existing routine. */
export function defaultPlanTab(view){
 const plan=view?.plan,cards=plan?.presentation?.categoryCards||[];
 const pending=(plan?.itemStates||[]).some(state=>{
  if(state.received&&!state.startedOn)return true;
  const card=cards.find(card=>card.recommendationId===state.recommendationId);
  return state.choice===null&&!['optional_alternative','finish_then_replace'].includes(card?.kind);
 });
 return pending||!((view?.activeRoutine||[]).length||(view?.routine||[]).length)?'recommendations':'routine';
}
export function readClientLocation(url){
 const value=url.searchParams.get('clientView'),product=url.searchParams.get('product');
 if(!views.has(value))return null;
 return {section:product&&/^(?:card|step|routine):[a-zA-Z0-9_-]{1,100}$|^legacy:[a-zA-Z0-9_-]{1,100}:[a-zA-Z0-9_-]{1,100}$/.test(product)?'product':['recommendations','routine'].includes(value)?'plan':value,planTab:value==='routine'?'routine':'recommendations',productRef:product||null};
}
export function clientLocationHref(url,{section,planTab,productRef}){
 const next=new URL(url);next.searchParams.set('clientView',section==='plan'||section==='product'?planTab:section);
 if(section==='product'&&productRef)next.searchParams.set('product',productRef);else next.searchParams.delete('product');
 return next.pathname+next.search+next.hash;
}
