import type { ProductIdentity } from './derive-intelligence';

export interface SampleProductItem {
  id: string;
  chipLabel: string;
  url: string;
  retailer: string;
  product: ProductIdentity;
}

export const SAMPLE_PRODUCTS: SampleProductItem[] = [
  {
    id: 'paulas-choice-2-bha',
    chipLabel: "Paula's Choice 2% BHA",
    url: 'https://www.sephora.com/product/paula-s-choice-skin-perfecting-2-bha-liquid-exfoliant-P469854',
    retailer: 'Sephora',
    product: {
      brand: "Paula's Choice",
      name: 'Skin Perfecting 2% BHA Liquid Exfoliant',
      category: 'exfoliant',
      role: 'Leave-on chemical exfoliant for pore clearing and surface texture',
      keyActives: ['Salicylic Acid (BHA) 2%', 'Green Tea Leaf Extract (Camellia Oleifera)'],
      ingredients: [
        'Water (Aqua)',
        'Methylpropanediol',
        'Butylene Glycol',
        'Salicylic Acid',
        'Polysorbate 20',
        'Camellia Oleifera (Green Tea) Leaf Extract',
        'Sodium Hydroxide',
        'Tetrasodium EDTA',
      ],
      phRange: '3.5 - 3.9',
      sourceUrl: 'https://www.sephora.com/product/paula-s-choice-skin-perfecting-2-bha-liquid-exfoliant-P469854',
      isVerifiedCatalog: true,
    },
  },
  {
    id: 'the-ordinary-niacinamide',
    chipLabel: 'The Ordinary Niacinamide 10%',
    url: 'https://www.ulta.com/p/niacinamide-10-zinc-1-pimprod2007111',
    retailer: 'Ulta',
    product: {
      brand: 'The Ordinary',
      name: 'Niacinamide 10% + Zinc 1%',
      category: 'serum',
      role: 'High-strength vitamin and mineral blemish formula',
      keyActives: ['Niacinamide (Vitamin B3) 10%', 'Zinc PCA 1%'],
      ingredients: [
        'Aqua (Water)',
        'Niacinamide',
        'Pentylene Glycol',
        'Zinc PCA',
        'Dimethyl Isosorbide',
        'Tamarindus Indica Seed Gum',
        'Xanthan Gum',
        'Isoceteth-20',
        'Ethoxydiglycol',
        'Phenoxyethanol',
        'Chlorphenesin',
      ],
      phRange: '5.0 - 6.0',
      sourceUrl: 'https://www.ulta.com/p/niacinamide-10-zinc-1-pimprod2007111',
      isVerifiedCatalog: true,
    },
  },
  {
    id: 'cerave-hyaluronic-acid',
    chipLabel: 'CeraVe Hyaluronic Serum',
    url: 'https://www.target.com/p/cerave-hydrating-hyaluronic-acid-face-serum-1-fl-oz/-/A-75563581',
    retailer: 'Target',
    product: {
      brand: 'CeraVe',
      name: 'Hydrating Hyaluronic Acid Serum',
      category: 'serum',
      role: 'Stratum corneum barrier hydration and replenishing daily serum',
      keyActives: ['Hyaluronic Acid', 'Ceramides 1, 3, 6-II', 'Vitamin B5 (Panthenol)'],
      ingredients: [
        'Aqua / Water / Eau',
        'Glycerin',
        'Cetearyl Ethylhexanoate',
        'Dimethicone',
        'Ammonium Polyacryloyldimethyl Taurate',
        'Sodium Hyaluronate',
        'Panthenol',
        'Ceramide NP',
        'Ceramide AP',
        'Ceramide EOP',
        'Carbomer',
        'Cetearyl Alcohol',
        'Behentrimonium Methosulfate',
        'Sodium Hydroxide',
        'Sodium Lauroyl Lactylate',
        'Cholesterol',
        'Phenoxyethanol',
        'Disodium EDTA',
        'Isopropyl Myristate',
        'Caprylyl Glycol',
        'Citric Acid',
        'Xanthan Gum',
        'Phytosphingosine',
        'Ethylhexylglycerin',
      ],
      phRange: '5.5',
      sourceUrl: 'https://www.target.com/p/cerave-hydrating-hyaluronic-acid-face-serum-1-fl-oz/-/A-75563581',
      isVerifiedCatalog: true,
    },
  },
  {
    id: 'la-roche-posay-anthelios',
    chipLabel: 'La Roche-Posay SPF 60',
    url: 'https://www.sephora.com/product/la-roche-posay-anthelios-ultra-light-fluid-face-sunscreen-spf-60-P430154',
    retailer: 'Sephora',
    product: {
      brand: 'La Roche-Posay',
      name: 'Anthelios Ultra Light Fluid SPF 60',
      category: 'sunscreen',
      role: 'Broad-spectrum daily chemical UV photoprotection fluid',
      keyActives: ['Avobenzone 3%', 'Homosalate 10.72%', 'Octisalate 3.21%', 'Octocrylene 6%'],
      ingredients: [
        'Water',
        'Dimethicone',
        'Isododecane',
        'Alcohol Denat.',
        'Trimethylsiloxysilicate',
        'Butylene Glycol',
        'PEG-10 Dimethicone',
        'Perlite',
        'Nylon-12',
        'Silica',
        'Senna Alata Leaf Extract',
        'Maltodextrin',
        'Sodium Chloride',
        'Caprylyl Glycol',
        'Tocopherol',
      ],
      sourceUrl: 'https://www.sephora.com/product/la-roche-posay-anthelios-ultra-light-fluid-face-sunscreen-spf-60-P430154',
      isVerifiedCatalog: true,
    },
  },
];

export function findSampleByUrlOrQuery(input: string): SampleProductItem | null {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;

  for (const sample of SAMPLE_PRODUCTS) {
    if (sample.url.toLowerCase() === normalized) return sample;
    if (sample.id.toLowerCase() === normalized) return sample;
    if (normalized.includes(sample.product.brand.toLowerCase()) && normalized.includes(sample.product.name.split(' ')[0].toLowerCase())) {
      return sample;
    }
  }

  // Check keyword matches
  if (normalized.includes('bha') || (normalized.includes('paula') && normalized.includes('exfoliant'))) {
    return SAMPLE_PRODUCTS[0];
  }
  if (normalized.includes('niacinamide') || normalized.includes('ordinary')) {
    return SAMPLE_PRODUCTS[1];
  }
  if (normalized.includes('cerave') || normalized.includes('hyaluronic')) {
    return SAMPLE_PRODUCTS[2];
  }
  if (normalized.includes('anthelios') || normalized.includes('roche-posay') || normalized.includes('sunscreen') || normalized.includes('spf')) {
    return SAMPLE_PRODUCTS[3];
  }

  return null;
}
