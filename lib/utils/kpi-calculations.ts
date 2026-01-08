import { getSupabaseServiceClient } from '@/lib/db/client';

/**
 * Calculate Mean Time To Repair (MTTR)
 */
export async function calculateMTTR(
  startDate?: string,
  endDate?: string
): Promise<number> {
  const supabase = getSupabaseServiceClient();

  let query = supabase
    .from('work_orders')
    .select('start_time, end_time')
    .eq('type', 'corrective')
    .eq('status', 'closed')
    .not('start_time', 'is', null)
    .not('end_time', 'is', null);

  if (startDate) {
    query = query.gte('end_time', startDate);
  }
  if (endDate) {
    query = query.lte('end_time', endDate);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return 0;
  }

  const totalTime = data.reduce((sum, wo) => {
    const start = new Date(wo.start_time).getTime();
    const end = new Date(wo.end_time).getTime();
    return sum + (end - start);
  }, 0);

  return totalTime / (data.length * 3600000); // Convert to hours
}

/**
 * Calculate Mean Time Between Failures (MTBF)
 */
export async function calculateMTBF(
  equipmentId: string,
  startDate?: string,
  endDate?: string
): Promise<number> {
  const supabase = getSupabaseServiceClient();

  let query = supabase
    .from('work_orders')
    .select('end_time')
    .eq('equipment_id', equipmentId)
    .eq('type', 'corrective')
    .eq('status', 'closed')
    .not('end_time', 'is', null)
    .order('end_time', { ascending: true });

  if (startDate) {
    query = query.gte('end_time', startDate);
  }
  if (endDate) {
    query = query.lte('end_time', endDate);
  }

  const { data, error } = await query;

  if (error || !data || data.length < 2) {
    return 0;
  }

  const intervals: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const prev = new Date(data[i - 1].end_time).getTime();
    const curr = new Date(data[i].end_time).getTime();
    intervals.push(curr - prev);
  }

  const totalInterval = intervals.reduce((sum, interval) => sum + interval, 0);
  return totalInterval / (intervals.length * 3600000); // Convert to hours
}

/**
 * Calculate preventive maintenance compliance
 */
export async function calculatePreventiveCompliance(
  startDate: string,
  endDate: string
): Promise<number> {
  const supabase = getSupabaseServiceClient();

  // Get all preventive work orders scheduled in the period
  const { data: scheduled, error: scheduledError } = await supabase
    .from('work_orders')
    .select('id')
    .eq('type', 'preventive')
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate);

  if (scheduledError || !scheduled) {
    return 0;
  }

  // Get completed preventive work orders
  const { data: completed, error: completedError } = await supabase
    .from('work_orders')
    .select('id')
    .eq('type', 'preventive')
    .eq('status', 'closed')
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate);

  if (completedError || !completed) {
    return 0;
  }

  if (scheduled.length === 0) {
    return 100;
  }

  return (completed.length / scheduled.length) * 100;
}

/**
 * Get equipment operational status
 */
export async function getEquipmentStatus(): Promise<{
  total: number;
  operational: number;
  outOfService: number;
}> {
  const supabase = getSupabaseServiceClient();

  // Get total count - count all equipment records
  const { count: total, error: totalError } = await supabase
    .from('equipment')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    console.error('Error fetching total equipment count:', totalError);
    return { total: 0, operational: 0, outOfService: 0 };
  }

  // Get operational count - equipment that is not out of service
  // Filter: baja is null or empty, and status_neveras is not "FUERA DE SERVICIO"
  const { count: operational, error: operationalError } = await supabase
    .from('equipment')
    .select('*', { count: 'exact', head: true })
    .or('baja.is.null,baja.eq.')
    .not('status_neveras', 'is', null)
    .neq('status_neveras', 'FUERA DE SERVICIO');

  if (operationalError) {
    console.error('Error fetching operational equipment count:', operationalError);
    // If operational query fails, return total with 0 operational
    return { total: total || 0, operational: 0, outOfService: total || 0 };
  }

  return {
    total: total || 0,
    operational: operational || 0,
    outOfService: (total || 0) - (operational || 0),
  };
}

