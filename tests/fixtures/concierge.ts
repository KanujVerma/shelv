import type { ConciergeClientView } from '../../src/contracts/ConciergePortal.ts';

export const ownerId = '00000000-0000-4000-8000-000000000001';
export const otherId = '00000000-0000-4000-8000-000000000002';
export const requestId = '00000000-0000-4000-8000-000000000003';
export const recommendation = {
  id: 'moisturizer-v2', slot: 'moisturizer', currentProductId: 'original',
  proposedProductId: 'replacement', priceCents: 1600, currency: 'USD' as const,
  rationale: 'One selected replacement for the stated goal.',
};

/** Synthetic R1 wire shapes; no client records or payment information. */
export function clientFixture(): ConciergeClientView {
  return {
    revision: 4,
    plan: {
      version: 2, recommendations: [{ ...recommendation }],
      itemStates: [{ recommendationId: 'moisturizer-v2', choice: 'approved', reason: null, received: false, startedOn: null }],
    },
    history: [{ version: 1, recommendations: [{ ...recommendation, id: 'moisturizer-v1' }] }],
    orderProposal: {
      kind: 'proposal', currency: 'USD', items: [{ ...recommendation }], subtotalCents: 1600,
      payable: false, shippingAndTaxConfirmed: false,
    },
    routine: [{ slot: 'moisturizer', productId: 'original' }],
    routineHistory: [],
  };
}

export function emptyClientFixture(): ConciergeClientView {
  return {
    revision: 0, plan: null, history: [],
    orderProposal: { kind: 'proposal', currency: 'USD', items: [], subtotalCents: 0, payable: false, shippingAndTaxConfirmed: false },
    routine: [], routineHistory: [],
  };
}
