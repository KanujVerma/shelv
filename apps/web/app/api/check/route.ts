import { NextResponse } from 'next/server';
import { extractProductFromUrl } from '@/lib/gemini-extractor';
import { generateQuickRead, evaluatePersonalFit, type EphemeralProfile } from '@/lib/derive-intelligence';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, query, ephemeralProfile } = body;
    const target = url || query;

    if (!target || typeof target !== 'string') {
      return NextResponse.json(
        {
          error: 'Please provide a valid product URL or search query.',
          success: false,
        },
        { status: 400 }
      );
    }

    const extraction = await extractProductFromUrl(target);

    if (!extraction.success || !extraction.product) {
      return NextResponse.json(
        {
          success: false,
          error: extraction.error || 'Could not resolve product identity.',
          errorRecovery: extraction.errorRecovery,
        },
        { status: 422 }
      );
    }

    const quickRead = generateQuickRead(extraction.product);

    let personalFit = null;
    if (ephemeralProfile && typeof ephemeralProfile === 'object') {
      personalFit = evaluatePersonalFit(extraction.product, ephemeralProfile as EphemeralProfile);
    }

    return NextResponse.json({
      success: true,
      product: extraction.product,
      quickRead,
      personalFit,
      sourceType: extraction.sourceType,
      rawEvidence: extraction.rawEvidence,
    });
  } catch (err) {
    console.error('API check error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'An internal error occurred while analyzing the product.',
      },
      { status: 500 }
    );
  }
}
