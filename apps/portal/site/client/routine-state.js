const list = value => Array.isArray(value) ? value : [];
const sameProduct = (step, card, product) => step.kind === 'product' && step.slot === card.slot && step.productId === product?.id;
const bound = card => typeof card.recommendationId === 'string' && card.recommendationId.length > 0;

/** Display only: never writes or infers receipt, activation or recorded cessation. */
export function routineDisplayState(view) {
  const cards = list(view?.plan?.presentation?.categoryCards), active = list(view?.activeRoutine), stops = [];
  for (const card of cards) {
    const explicitStop = card.decisionLabels?.current?.trim().toUpperCase() === 'STOP';
    const products = card.kind === 'pause' ? [card.currentProduct, card.proposedProduct] : card.kind === 'leave_out' || explicitStop ? [card.currentProduct] : [];
    for (const product of products.filter(Boolean)) {
      const note = explicitStop
        ? ''
        : card.how?.steps?.[0]?.body || card.actions?.[0] || '';
      stops.push({card, product, note, label: explicitStop ? 'Stop' : card.kind === 'pause' ? 'Pause' : 'Leave out'});
    }
  }
  const current = active.filter(step => !stops.some(row => sameProduct(step, row.card, row.product)));
  const proposed = cards.filter(card => ['replace','finish_then_replace','addition','optional_alternative'].includes(card.kind) && card.proposedProduct && !active.some(step => sameProduct(step, card, card.proposedProduct))).map(card => {
    const item = list(view?.plan?.itemStates).find(row => row.recommendationId === card.recommendationId);
    if (!bound(card) && card.kind !== 'finish_then_replace') return {card, label: card.kind === 'optional_alternative' ? 'Optional alternative' : 'Proposed change', note: 'Compare this option and discuss any change with your advisor before buying.', action: 'details'};
    if (!bound(card)) return {card, label: 'Next bottle', note: 'Finish your current bottle first. Discuss the later change with your advisor when it needs replacing.', action: 'details'};
    if (item?.received) return {card, label: 'Received · start date not recorded', note: 'Record your actual start date when you begin.', action: 'review'};
    if (item?.choice === 'approved') return {card, label: 'Approved · receipt not recorded', note: 'Mark it received after it arrives.', action: 'review'};
    if (item?.choice === 'declined') return {card, label: 'Declined', note: 'This product has not been added to your routine. You can review your choice before receipt.', action: 'review'};
    return {card, label: card.kind === 'optional_alternative' ? 'Optional alternative' : 'Proposed change', note: '', action: 'review'};
  });
  return {current, stops, proposed};
}
