/**
 * Derive Skincare Intelligence & Decision Policy Engine
 *
 * Implements canonical Derive decision rules:
 * - Level 1: WebQuickRead (evidence-bound product facts, role, stacking notes, unknowns)
 * - Level 2: WebPersonalFitPreview (deterministic decision policy based on S-FREE-2)
 *
 * Grounded in conservative cosmetic product intelligence.
 * No universal numerical score. No medical diagnosis.
 */

export interface ProductIdentity {
  brand: string;
  name: string;
  category: 'cleanser' | 'toner' | 'exfoliant' | 'serum' | 'moisturizer' | 'sunscreen' | 'treatment' | 'mask';
  role: string;
  keyActives: string[];
  ingredients: string[];
  phRange?: string;
  sourceUrl?: string;
  isVerifiedCatalog: boolean;
}

export interface WebQuickRead {
  id: string;
  product: ProductIdentity;
  summary: string;
  primaryRole: string;
  targetConcerns: string[];
  keyFormulaFindings: Array<{
    title: string;
    description: string;
    type: 'active' | 'support' | 'vehicle';
  }>;
  stackingConsiderations: string[];
  unknowns: string[];
  nextStepPrompt: string;
}

export type PersonalFitLabel = 'COULD_WORK' | 'USE_WITH_CAUTION' | 'NOT_ENOUGH_INFORMATION';

export interface EphemeralProfile {
  goals: string[]; // 'breakouts' | 'dark_spots' | 'dryness' | 'oiliness' | 'texture' | 'redness' | 'fine_lines'
  reactivity: 'reacts_easily' | 'generally_tolerates' | 'unsure';
  currentTreatments: Array<'topical_retinoid' | 'benzoyl_peroxide' | 'exfoliating_acid' | 'other_prescription' | 'none'>;
}

export interface WebPersonalFitPreview {
  label: PersonalFitLabel;
  headline: string;
  explanation: string;
  actionGuidance: string; // "What I'd do"
  reasons: string[];
  evidenceUsed: string[];
  missingEvidence: string[];
  sources: string[];
}

const RETINOID_TERMS = ['retinol', 'retinal', 'retinaldehyde', 'retinyl', 'tretinoin', 'adapalene', 'tazarotene'];
const EXFOLIANT_TERMS = ['glycolic acid', 'lactic acid', 'salicylic acid', 'mandelic acid', 'bha', 'aha', 'gluconolactone'];
const BENZOYL_PEROXIDE = 'benzoyl peroxide';

function textMatches(list: string[], terms: string[]): boolean {
  const haystack = list.map((s) => s.toLowerCase()).join(' ');
  return terms.some((term) => haystack.includes(term.toLowerCase()));
}

export function generateQuickRead(product: ProductIdentity): WebQuickRead {
  const hasSalicylic = product.keyActives.some((a) => a.toLowerCase().includes('salicylic') || a.toLowerCase().includes('bha'));
  const hasRetinoid = textMatches([...product.keyActives, ...product.ingredients], RETINOID_TERMS);
  const hasAha = textMatches([...product.keyActives, ...product.ingredients], ['glycolic acid', 'lactic acid', 'mandelic acid']);
  const hasNiacinamide = product.keyActives.some((a) => a.toLowerCase().includes('niacinamide'));
  const hasHyaluronic = product.keyActives.some((a) => a.toLowerCase().includes('hyaluronic') || a.toLowerCase().includes('sodium hyaluronate'));
  const isSunscreen = product.category === 'sunscreen';

  const findings: WebQuickRead['keyFormulaFindings'] = [];
  const stacking: string[] = [];
  const unknowns: string[] = [
    'Your skin type, current routine, and personal tolerance',
    'Exact manufacturing batch and preservative degradation over time',
  ];

  if (!product.isVerifiedCatalog) {
    unknowns.unshift('Exact ingredient concentrations (only verified package formulas prove concentration)');
  }

  if (hasSalicylic) {
    findings.push({
      title: 'Oil-Soluble BHA Exfoliant',
      description: 'Salicylic acid penetrates lipid-rich sebum within pores to dissolve keratinized dead skin and sebum plugs.',
      type: 'active',
    });
    stacking.push('Stacking with a prescription retinoid or AHA increases cumulative irritation burden.');
    stacking.push('Apply to completely dry skin after cleansing to minimize stinging.');
  }

  if (hasRetinoid) {
    findings.push({
      title: 'Vitamin A Cellular Turnover Active',
      description: 'Promotes epidermal cell renewal and supports collagen integrity; requires gradual introduction.',
      type: 'active',
    });
    stacking.push('Do not layer at the same time of day with strong exfoliating acids or benzoyl peroxide.');
  }

  if (hasNiacinamide) {
    findings.push({
      title: 'Niacinamide (Vitamin B3)',
      description: 'Supports epidermal barrier lipid synthesis and assists in sebum regulation.',
      type: 'active',
    });
  }

  if (hasHyaluronic) {
    findings.push({
      title: 'Multi-weight Humectant Complex',
      description: 'Binds moisture to the stratum corneum; best applied to slightly damp skin and sealed with an occlusive moisturizer.',
      type: 'support',
    });
  }

  if (isSunscreen) {
    findings.push({
      title: 'Broad-Spectrum UV Protection',
      description: 'Essential photoprotection against UVA/UVB damage, photoaging, and post-inflammatory erythema.',
      type: 'active',
    });
    stacking.push('Apply as the final step of morning routine before makeup; allow 15 minutes before sun exposure.');
  }

  if (stacking.length === 0) {
    stacking.push('Perform a patch test behind the ear or on inner forearm before full-face application.');
  }

  let concerns = ['General maintenance'];
  if (hasSalicylic) concerns = ['Congested pores', 'Active breakouts', 'Surface roughness'];
  else if (hasRetinoid) concerns = ['Fine lines', 'Uneven tone', 'Cellular turnover'];
  else if (hasNiacinamide) concerns = ['Excess oiliness', 'Uneven tone', 'Pore appearance'];
  else if (hasHyaluronic) concerns = ['Dehydration', 'Tightness', 'Barrier recovery'];
  else if (isSunscreen) concerns = ['UV protection', 'Photoaging prevention', 'Hyperpigmentation defense'];

  return {
    id: `qr_${Date.now()}`,
    product,
    summary: `${product.brand} ${product.name} is formulated primarily as a ${product.role.toLowerCase()}. It delivers ${product.keyActives.slice(0, 2).join(' and ')} to address ${concerns.slice(0, 2).join(' and ').toLowerCase()}.`,
    primaryRole: product.role,
    targetConcerns: concerns,
    keyFormulaFindings: findings,
    stackingConsiderations: stacking,
    unknowns,
    nextStepPrompt: 'Does this product make sense for your skin?',
  };
}

export function evaluatePersonalFit(product: ProductIdentity, profile: EphemeralProfile): WebPersonalFitPreview {
  const formulaIngredients = [...product.keyActives, ...product.ingredients];
  const hasRetinoid = textMatches(formulaIngredients, RETINOID_TERMS);
  const hasExfoliant = textMatches(formulaIngredients, EXFOLIANT_TERMS);
  const hasBenzoylPeroxide = textMatches(formulaIngredients, [BENZOYL_PEROXIDE]);
  const hasActive = hasRetinoid || hasExfoliant || hasBenzoylPeroxide;

  const currentTreatments = new Set(profile.currentTreatments);
  const isUsingRetinoid = currentTreatments.has('topical_retinoid');
  const isUsingAcid = currentTreatments.has('exfoliating_acid');
  const isUsingBp = currentTreatments.has('benzoyl_peroxide');
  const isUsingPrescription = currentTreatments.has('other_prescription');

  // Rule 1: Active Overlap / Stacking Clash Caution
  const isRetinoidAndExfoliantClash = (hasRetinoid && isUsingAcid) || (hasExfoliant && isUsingRetinoid);
  const isDuplicateActive =
    (hasRetinoid && isUsingRetinoid) ||
    (hasExfoliant && isUsingAcid) ||
    (hasBenzoylPeroxide && isUsingBp);

  if (isRetinoidAndExfoliantClash || isDuplicateActive) {
    const reasonText = isRetinoidAndExfoliantClash
      ? hasExfoliant
        ? 'an exfoliating active onto your existing retinoid regimen'
        : 'a retinoid onto your existing exfoliating acid regimen'
      : hasRetinoid
      ? 'another retinoid'
      : hasExfoliant
      ? 'another exfoliating acid'
      : 'another benzoyl peroxide active';

    return {
      label: 'USE_WITH_CAUTION',
      headline: 'Active Routine Overlap Detected',
      explanation: `You're already using an active treatment (${
        isUsingRetinoid ? 'retinoid' : isUsingAcid ? 'exfoliating acid' : 'topical active'
      }) and this formula contains ${product.keyActives[0] || 'another strong active'}. Stacking ${reasonText} significantly increases barrier irritation burden.`,
      actionGuidance: `Keep your current routine unchanged unless there is a specific gap this product needs to solve. If introducing this ${product.brand} product, substitute it on an alternate evening rather than layering it together.`,
      reasons: ['Active overlap with current regimen', 'Compounded irritation potential'],
      evidenceUsed: ['Verified active ingredient profile', 'Reported ongoing topical treatment'],
      missingEvidence: ['Application frequency schedule', 'Current barrier recovery speed'],
      sources: ['https://www.aad.org/public/everyday-care/skin-care-secrets/routine/skin-care-basics'],
    };
  }

  // Rule 2: Easily Reactive Skin + Strong Active
  if (profile.reactivity === 'reacts_easily' && hasActive) {
    return {
      label: 'USE_WITH_CAUTION',
      headline: 'Active Potency on Reactive Barrier',
      explanation: `You noted that your skin reacts easily to new products, and this formula centers on ${product.keyActives[0] || 'a potent active'}. Penetration can trigger transient erythema or stinging before tolerance is established.`,
      actionGuidance: 'Perform a 48-hour patch test. If cleared, start at once every 3 days over a buffering moisturizer rather than applying to bare skin daily.',
      reasons: ['Easily reactive skin tolerance threshold', 'High-potency direct active formulation'],
      evidenceUsed: ['Reported reactivity profile', 'Key formula active classification'],
      missingEvidence: ['Vehicle soothing agent concentrations', 'Personal contact allergy history'],
      sources: ['https://www.aad.org/public/everyday-care/skin-care-secrets/routine/sensitive-skin'],
    };
  }

  // Rule 3: Goal Role Match (e.g. Dryness + Moisturizer / Hydrating Serum, or Breakouts + BHA without overlap)
  const wantsBreakoutHelp = profile.goals.includes('breakouts') || profile.goals.includes('texture');
  const wantsHydration = profile.goals.includes('dryness') || profile.goals.includes('redness');

  if (wantsBreakoutHelp && (hasExfoliant || hasBenzoylPeroxide) && !isUsingRetinoid && !isUsingAcid) {
    return {
      label: 'COULD_WORK',
      headline: 'Supported Match for Your Goals',
      explanation: `This ${product.role.toLowerCase()} aligns directly with your goal to address blemishes and texture. It targets follicular congestion through ${product.keyActives[0] || 'proven actives'} without conflicting with existing strong treatments.`,
      actionGuidance: 'Introduce 2 to 3 nights per week into your evening routine following cleansing. Follow with a non-comedogenic moisturizer.',
      reasons: ['Direct mechanism match for reported breakout concerns', 'No conflicting active treatments reported'],
      evidenceUsed: ['Stated skin goals', 'Product functional role', 'Reported zero-active routine baseline'],
      missingEvidence: ['Individual patch-test response', 'Full day/night product lineup'],
      sources: ['https://www.aad.org/public/diseases/acne/diy/skin-care'],
    };
  }

  if (wantsHydration && (product.category === 'moisturizer' || product.category === 'serum') && !hasActive) {
    return {
      label: 'COULD_WORK',
      headline: 'Constructive Barrier Alignment',
      explanation: `A supportive ${product.category} containing ${product.keyActives[0] || 'hydrating agents'} reinforces moisture retention to address your reported dryness. It introduces minimal irritation burden.`,
      actionGuidance: 'Can be integrated immediately into both morning and evening routines after cleansing.',
      reasons: ['Barrier support alignment with dryness goal', 'Absence of aggressive exfoliating actives'],
      evidenceUsed: ['Reported dryness goal', 'Non-exfoliating formula category'],
      missingEvidence: ['Prior individual sensitivity to specific emulsifiers'],
      sources: ['https://www.aad.org/public/everyday-care/skin-care-secrets/routine/dry-skin'],
    };
  }

  // Default: Not Enough Context to Claim Suitability
  return {
    label: 'NOT_ENOUGH_INFORMATION',
    headline: 'Context Needed for a Clear Fit',
    explanation: `While ${product.brand} ${product.name} is a defined ${product.role.toLowerCase()}, your reported goals do not show a direct mechanical requirement for this step.`,
    actionGuidance: 'Avoid adding products without a distinct functional role in your routine. Check what specific deficiency this product is intended to solve.',
    reasons: ['No verified role necessity for current goals', 'Routine-addition caution'],
    evidenceUsed: ['Formula active profile', 'Stated primary goals'],
    missingEvidence: ['Current step-by-step morning and evening product shelf'],
    sources: ['https://www.aad.org/public/everyday-care/skin-care-secrets/routine/skin-care-basics'],
  };
}
