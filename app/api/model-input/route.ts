import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Expected an array of session data' }, { status: 400 });
    }
    // Batch insert
    await prisma.modelInput.createMany({ data });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save session batch:', error);
    return NextResponse.json({ error: 'Failed to save session batch' }, { status: 500 });
  }
} 