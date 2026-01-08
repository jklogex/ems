import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/db/client';
import { calculatePreventiveCompliance, getEquipmentStatus } from '@/lib/utils/kpi-calculations';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    
    // Calculate date range for preventive compliance (last 30 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch all metrics in parallel
    const [
      equipmentStatus,
      clientsResult,
      activeWorkOrdersResult,
      compliance,
    ] = await Promise.all([
      getEquipmentStatus(),
      supabase
        .from('clients')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['created', 'assigned', 'in_progress']),
      calculatePreventiveCompliance(startDate, endDate),
    ]);

    // Handle errors
    if (clientsResult.error) {
      console.error('Error fetching clients:', clientsResult.error);
    }
    if (activeWorkOrdersResult.error) {
      console.error('Error fetching active work orders:', activeWorkOrdersResult.error);
    }

    return NextResponse.json({
      data: {
        totalEquipment: equipmentStatus.total,
        operationalEquipment: equipmentStatus.operational,
        totalClients: clientsResult.count || 0,
        activeWorkOrders: activeWorkOrdersResult.count || 0,
        preventiveCompliance: Math.round(compliance),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
