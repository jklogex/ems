import { NextRequest, NextResponse } from 'next/server';
import { BODEGAS } from '@/lib/constants';

/**
 * Get hard-coded bodega values
 * Route: /api/equipment/bodegas
 * 
 * Returns the hard-coded list of bodegas from constants.
 * To update the list, run: npx tsx scripts/extract-bodegas.ts
 */
export async function GET(request: NextRequest) {
  try {
    // Return hard-coded bodegas as an array
    const bodegas = Array.from(BODEGAS);

    return NextResponse.json({
      data: bodegas,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
