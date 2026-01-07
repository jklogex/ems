import { NextRequest, NextResponse } from 'next/server';
import {
  calculateMTTR,
  calculatePreventiveCompliance,
  getEquipmentStatus,
} from '@/lib/utils/kpi-calculations';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    const [mttr, compliance, equipmentStatus] = await Promise.all([
      calculateMTTR(startDate || undefined, endDate),
      calculatePreventiveCompliance(
        startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate
      ),
      getEquipmentStatus(),
    ]);

    return NextResponse.json({
      data: {
        mttr,
        preventiveCompliance: compliance,
        equipmentStatus,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

