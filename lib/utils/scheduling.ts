import { getSupabaseServerClient } from '@/lib/db/client';

export interface ScheduleConfig {
  equipmentId: string;
  frequencyDays: number;
  scheduleType: 'preventive' | 'inspection';
  checklistTemplateId?: string;
}

/**
 * Create or update a preventive maintenance schedule
 */
export async function createSchedule(config: ScheduleConfig): Promise<string> {
  const supabase = getSupabaseServerClient();

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + config.frequencyDays);

  const { data, error } = await supabase
    .from('schedules')
    .upsert(
      {
        equipment_id: config.equipmentId,
        schedule_type: config.scheduleType,
        frequency_days: config.frequencyDays,
        next_maintenance_date: nextDate.toISOString().split('T')[0],
        checklist_template_id: config.checklistTemplateId || null,
        is_active: true,
      },
      {
        onConflict: 'equipment_id,schedule_type',
        ignoreDuplicates: false,
      }
    )
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create schedule: ${error.message}`);
  }

  return data.id;
}

/**
 * Generate work orders for due preventive maintenance
 */
export async function generateDueWorkOrders(): Promise<number> {
  const supabase = getSupabaseServerClient();
  const today = new Date().toISOString().split('T')[0];

  // Find all schedules that are due
  const { data: dueSchedules, error: scheduleError } = await supabase
    .from('schedules')
    .select('*, equipment(*)')
    .eq('is_active', true)
    .lte('next_maintenance_date', today);

  if (scheduleError) {
    throw new Error(`Failed to fetch due schedules: ${scheduleError.message}`);
  }

  if (!dueSchedules || dueSchedules.length === 0) {
    return 0;
  }

  let createdCount = 0;

  for (const schedule of dueSchedules) {
    // Check if work order already exists for this schedule
    const { data: existingWO } = await supabase
      .from('work_orders')
      .select('id')
      .eq('equipment_id', schedule.equipment_id)
      .eq('type', schedule.schedule_type === 'preventive' ? 'preventive' : 'inspection')
      .eq('status', 'created')
      .gte('scheduled_date', today)
      .single();

    if (existingWO) {
      continue; // Skip if work order already exists
    }

    // Create work order
    const { error: woError } = await supabase.from('work_orders').insert({
      equipment_id: schedule.equipment_id,
      type: schedule.schedule_type === 'preventive' ? 'preventive' : 'inspection',
      priority: 'medium',
      status: 'created',
      scheduled_date: schedule.next_maintenance_date,
    });

    if (!woError) {
      createdCount++;

      // Update schedule with next maintenance date
      const nextDate = new Date(schedule.next_maintenance_date);
      nextDate.setDate(nextDate.getDate() + schedule.frequency_days);

      await supabase
        .from('schedules')
        .update({
          last_maintenance_date: schedule.next_maintenance_date,
          next_maintenance_date: nextDate.toISOString().split('T')[0],
        })
        .eq('id', schedule.id);
    }
  }

  return createdCount;
}

/**
 * Get technician workload (number of assigned work orders)
 */
export async function getTechnicianWorkload(technicianId: string): Promise<number> {
  const supabase = getSupabaseServerClient();

  const { count, error } = await supabase
    .from('work_orders')
    .select('*', { count: 'exact', head: true })
    .eq('technician_id', technicianId)
    .in('status', ['assigned', 'in_progress']);

  if (error) {
    throw new Error(`Failed to get workload: ${error.message}`);
  }

  return count || 0;
}

