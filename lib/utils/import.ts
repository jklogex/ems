import Papa from 'papaparse';
import { supabase, getSupabaseServerClient } from '@/lib/db/client';
import { mapCSVRowToEquipment, mapCSVRowToClient, CSVEquipmentRow } from './csv-mapper';
import type { Equipment, Client } from '@/lib/db/types';

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  equipmentIds: string[];
}

export async function importEquipmentFromCSV(
  csvContent: string,
  userId?: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    totalRows: 0,
    successful: 0,
    failed: 0,
    errors: [],
    equipmentIds: [],
  };

  try {
    // Parse CSV
    const parseResult = Papa.parse<CSVEquipmentRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      result.errors.push(
        ...parseResult.errors.map((err) => ({
          row: err.row || 0,
          error: `Parse error: ${err.message}`,
        }))
      );
    }

    result.totalRows = parseResult.data.length;
    const supabaseClient = getSupabaseServerClient();

    // Process in batches of 1000
    const batchSize = 1000;
    const batches: CSVEquipmentRow[][] = [];

    for (let i = 0; i < parseResult.data.length; i += batchSize) {
      batches.push(parseResult.data.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const clientMap = new Map<string, Client>();
      const equipmentData: Array<Omit<Equipment, 'id' | 'created_at' | 'updated_at' | 'current_client_id' | 'location_changed_at'>> = [];
      const locationHistoryData: Array<{
        equipment_placa: string;
        client_codigo: string;
        longitud: number | null;
        latitud: number | null;
        ubicacion: string | null;
        ubicacion_especifica: string | null;
        region_taller: string | null;
        bodega_nueva: string | null;
        start_date: string;
      }> = [];

      // Process each row in the batch
      for (let rowIndex = 0; rowIndex < batch.length; rowIndex++) {
        const row = batch[batchIndex * batchSize + rowIndex];
        const actualRowNumber = batchIndex * batchSize + rowIndex + 2; // +2 for header and 1-based index

        try {
          // Validate required fields
          if (!row.PLACA || !row.CODIGO) {
            result.errors.push({
              row: actualRowNumber,
              error: 'Missing required fields: PLACA or CODIGO',
            });
            result.failed++;
            continue;
          }

          // Map to equipment
          const equipment = mapCSVRowToEquipment(row);
          equipmentData.push(equipment);

          // Map to client (for upsert)
          const client = mapCSVRowToClient(row);
          clientMap.set(row.CODIGO.trim(), client as Client);

          // Prepare location history data
          if (equipment.fecha_entrega || equipment.longitud || equipment.latitud) {
            locationHistoryData.push({
              equipment_placa: equipment.placa,
              client_codigo: row.CODIGO.trim(),
              longitud: equipment.longitud,
              latitud: equipment.latitud,
              ubicacion: equipment.ubicacion,
              ubicacion_especifica: equipment.ubicacion_especifica,
              region_taller: equipment.region_taller,
              bodega_nueva: equipment.bodega_nueva,
              start_date: equipment.fecha_entrega || new Date().toISOString().split('T')[0],
            });
          }
        } catch (error) {
          result.errors.push({
            row: actualRowNumber,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          result.failed++;
        }
      }

      // Upsert clients
      for (const [codigo, client] of clientMap.entries()) {
        try {
          const { error: clientError } = await supabaseClient
            .from('clients')
            .upsert(
              {
                ...client,
                codigo,
              },
              {
                onConflict: 'codigo',
                ignoreDuplicates: false,
              }
            );

          if (clientError) {
            console.error(`Error upserting client ${codigo}:`, clientError);
          }
        } catch (error) {
          console.error(`Error processing client ${codigo}:`, error);
        }
      }

      // Get client IDs for equipment
      const clientCodes = Array.from(clientMap.keys());
      const { data: clients } = await supabaseClient
        .from('clients')
        .select('id, codigo')
        .in('codigo', clientCodes);

      const clientIdMap = new Map<string, string>();
      clients?.forEach((c) => {
        clientIdMap.set(c.codigo, c.id);
      });

      // Insert equipment
      for (const equipment of equipmentData) {
        try {
          const clientId = clientIdMap.get(equipment.codigo) || null;

          const { data: insertedEquipment, error: equipmentError } = await supabaseClient
            .from('equipment')
            .upsert(
              {
                ...equipment,
                current_client_id: clientId,
                location_changed_at: equipment.fecha_entrega
                  ? new Date(equipment.fecha_entrega).toISOString()
                  : new Date().toISOString(),
              },
              {
                onConflict: 'placa',
                ignoreDuplicates: false,
              }
            )
            .select('id')
            .single();

          if (equipmentError) {
            throw equipmentError;
          }

          if (insertedEquipment) {
            result.equipmentIds.push(insertedEquipment.id);
            result.successful++;

            // Create location history record
            const locationHistory = locationHistoryData.find(
              (lh) => lh.equipment_placa === equipment.placa
            );

            if (locationHistory) {
              const locationClientId = clientIdMap.get(locationHistory.client_codigo) || null;

              await supabaseClient.from('equipment_location_history').insert({
                equipment_id: insertedEquipment.id,
                client_id: locationClientId,
                longitud: locationHistory.longitud,
                latitud: locationHistory.latitud,
                ubicacion: locationHistory.ubicacion,
                ubicacion_especifica: locationHistory.ubicacion_especifica,
                region_taller: locationHistory.region_taller,
                bodega_nueva: locationHistory.bodega_nueva,
                start_date: locationHistory.start_date,
                end_date: null, // Current location
                moved_by: userId || null,
              });
            }
          }
        } catch (error) {
          result.errors.push({
            row: equipmentData.indexOf(equipment) + batchIndex * batchSize + 2,
            error: error instanceof Error ? error.message : 'Unknown error inserting equipment',
          });
          result.failed++;
        }
      }
    }

    result.success = result.failed === 0;
    return result;
  } catch (error) {
    result.errors.push({
      row: 0,
      error: error instanceof Error ? error.message : 'Unknown error during import',
    });
    return result;
  }
}

