import { NextResponse } from 'next/server';
import { extractReceiptTextFromImage } from '@/lib/receipt-ocr';
import { parseReceiptText } from '@/lib/receipt-parse';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Receipt image file is required.' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are supported.' }, { status: 400 });
    }

    try {
      const text = await extractReceiptTextFromImage(file);
      const draft = parseReceiptText(text);
      return NextResponse.json({ draft, degraded: false });
    } catch (ocrError) {
      console.error('OCR failed, returning manual draft fallback:', ocrError);

      const fallback = parseReceiptText('');
      fallback.merchant = file.name?.replace(/\.[a-zA-Z0-9]+$/, '') || 'Receipt';
      fallback.warnings = [
        'OCR failed for this image. Fill in receipt details manually and save.',
      ];

      return NextResponse.json({
        draft: fallback,
        degraded: true,
      });
    }
  } catch (error) {
    console.error('Receipt parse route failed:', error);
    return NextResponse.json(
      { error: 'Failed to parse receipt.' },
      { status: 500 }
    );
  }
}
