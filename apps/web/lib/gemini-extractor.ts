/**
 * Server-Side Product Extractor & Perception Adapter
 *
 * Implements Gemini-assisted extraction for public skincare URLs.
 * Crucial Derive Architectural Invariant:
 * "Gemini output is candidate evidence, NOT canonical product truth."
 * Verified catalog entries take precedence; extracted data is explicitly marked.
 */

import { GoogleGenAI } from '@google/genai';
import type { ProductIdentity } from './derive-intelligence';
import { findSampleByUrlOrQuery } from './sample-products';

export interface ExtractionResult {
  success: boolean;
  product?: ProductIdentity;
  sourceType: 'verified_catalog' | 'gemini_page_extraction' | 'heuristic_fallback';
  rawEvidence?: string[];
  error?: string;
  errorRecovery?: {
    message: string;
    canSearchByName: boolean;
    sampleSuggestions: Array<{ label: string; url: string }>;
  };
}

export async function extractProductFromUrl(urlOrQuery: string): Promise<ExtractionResult> {
  const trimmed = urlOrQuery.trim();
  if (!trimmed) {
    return {
      success: false,
      sourceType: 'heuristic_fallback',
      error: 'Empty input',
      errorRecovery: {
        message: 'Please provide a valid product URL or name.',
        canSearchByName: true,
        sampleSuggestions: [
          { label: "Paula's Choice 2% BHA", url: 'https://www.sephora.com/product/paula-s-choice-skin-perfecting-2-bha-liquid-exfoliant-P469854' },
          { label: 'The Ordinary Niacinamide 10%', url: 'https://www.ulta.com/p/niacinamide-10-zinc-1-pimprod2007111' },
          { label: 'CeraVe Hyaluronic Acid Serum', url: 'https://www.target.com/p/cerave-hydrating-hyaluronic-acid-face-serum-1-fl-oz/-/A-75563581' },
        ],
      },
    };
  }

  // 1. High-priority check: Match known verified catalog sample fixtures
  const verifiedSample = findSampleByUrlOrQuery(trimmed);
  if (verifiedSample) {
    return {
      success: true,
      product: verifiedSample.product,
      sourceType: 'verified_catalog',
    };
  }

  // 2. Check for Gemini API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Analyze this skincare product URL or product query: "${trimmed}".
Extract factual information about the skincare product in this JSON format:
{
  "brand": "string (brand name, e.g. Paula's Choice)",
  "name": "string (full product name)",
  "category": "string (one of: cleanser, toner, exfoliant, serum, moisturizer, sunscreen, treatment, mask)",
  "role": "string (succinct description of primary functional purpose)",
  "keyActives": ["string array of active ingredients, e.g. Salicylic Acid 2%"],
  "ingredients": ["string array of full or key ingredients listed on packaging"],
  "phRange": "optional string pH range if known"
}
Rules:
- Be strictly factual based on standard manufacturer packaging.
- Do not invent medical claims or universal ratings.
- If this is NOT a skincare product or cannot be identified, return {"error": "unrecognized_product"}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        if (!parsed.error && parsed.name && parsed.brand) {
          const product: ProductIdentity = {
            brand: String(parsed.brand),
            name: String(parsed.name),
            category: parsed.category || 'serum',
            role: parsed.role || `${parsed.brand} ${parsed.name}`,
            keyActives: Array.isArray(parsed.keyActives) ? parsed.keyActives : [],
            ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
            phRange: parsed.phRange,
            sourceUrl: trimmed.startsWith('http') ? trimmed : undefined,
            isVerifiedCatalog: false, // Explicitly marked as extracted candidate evidence, NOT verified catalog
          };

          return {
            success: true,
            product,
            sourceType: 'gemini_page_extraction',
            rawEvidence: [
              `Extracted via Gemini from: ${trimmed}`,
              `Extracted ${product.keyActives.length} active candidate ingredients`,
            ],
          };
        }
      }
    } catch (err) {
      console.warn('Gemini extraction warning:', err);
      // Fall through to heuristic fallback
    }
  }

  // 3. Fallback: Parse URL slug heuristic
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const urlObj = new URL(trimmed);
      const pathname = urlObj.pathname;
      const slugParts = pathname.split(/[\/\-_]/).filter((p) => p.length > 2 && !/^\d+$/.test(p));

      if (slugParts.length >= 2) {
        // Build a candidate product from the readable slug
        const candidateBrand = slugParts[0].charAt(0).toUpperCase() + slugParts[0].slice(1);
        const candidateName = slugParts.slice(1, 4).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

        return {
          success: true,
          product: {
            brand: candidateBrand,
            name: candidateName,
            category: 'serum',
            role: `Skin formula from ${urlObj.hostname}`,
            keyActives: ['Extracting active profile from package'],
            ingredients: [],
            sourceUrl: trimmed,
            isVerifiedCatalog: false,
          },
          sourceType: 'heuristic_fallback',
        };
      }
    }
  } catch {
    // ignore parse error
  }

  // 4. Graceful failure with helpful recovery options
  return {
    success: false,
    sourceType: 'heuristic_fallback',
    error: 'Could not extract sufficient verified evidence from this page.',
    errorRecovery: {
      message: "We couldn't retrieve enough verified formula details from that link. Skincare retailers often block automated scrapers.",
      canSearchByName: true,
      sampleSuggestions: [
        { label: "Paula's Choice 2% BHA Liquid Exfoliant", url: 'https://www.sephora.com/product/paula-s-choice-skin-perfecting-2-bha-liquid-exfoliant-P469854' },
        { label: 'The Ordinary Niacinamide 10% + Zinc 1%', url: 'https://www.ulta.com/p/niacinamide-10-zinc-1-pimprod2007111' },
        { label: 'CeraVe Hydrating Hyaluronic Acid Serum', url: 'https://www.target.com/p/cerave-hydrating-hyaluronic-acid-face-serum-1-fl-oz/-/A-75563581' },
        { label: 'La Roche-Posay Anthelios SPF 60', url: 'https://www.sephora.com/product/la-roche-posay-anthelios-ultra-light-fluid-face-sunscreen-spf-60-P430154' },
      ],
    },
  };
}
