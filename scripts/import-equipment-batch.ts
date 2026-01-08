// Load environment variables FIRST using require (synchronous, before any ES6 imports)
// This must happen before importing any modules that use process.env
const path = require('path');
const dotenv = require('dotenv');

// Try .env.local first (Next.js default), then .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Verify critical env vars are loaded before proceeding
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Required environment variables not found!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  console.error('\n   Please ensure you have a .env.local or .env file in the project root with:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

import Papa from 'papaparse';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import type { Equipment, Client } from '../lib/db/types';
import { CSVEquipmentRow, mapCSVRowToEquipment, mapCSVRowToClient } from '../lib/utils/csv-mapper';

interface ImportStats {
  totalRows: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

async function importEquipmentBatch() {
  console.log('🚀 Starting optimized batch equipment import...\n');

  // Validate required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL environment variable is not set.');
    console.error('   Please ensure you have a .env.local or .env file with your Supabase credentials.');
    process.exit(1);
  }

  if (!supabaseServiceKey) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set.');
    console.error('   Please ensure you have a .env.local or .env file with your Supabase service role key.');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded successfully\n');

  // Create Supabase client directly (avoid importing from lib/db/client.ts which has module-level initialization)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const csvPath = join(process.cwd(), 'public', 'Datos Puntos de Venta.csv');
  
  console.log('📖 Reading CSV file...');
  const csvContent = readFileSync(csvPath, 'utf-8');
  
  console.log('📊 Parsing CSV...');
  const parseResult = Papa.parse<CSVEquipmentRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parseResult.errors.length > 0) {
    console.warn(`⚠️  CSV parse warnings: ${parseResult.errors.length}`);
    if (parseResult.errors.length <= 10) {
      parseResult.errors.forEach(err => {
        console.warn(`  - Row ${err.row}: ${err.message}`);
      });
    }
  }

  const totalRows = parseResult.data.length;
  console.log(`✅ Found ${totalRows} rows in CSV\n`);

  // Display column structure for verification
  if (totalRows > 0) {
    console.log('📋 CSV Column Structure:');
    console.log(`   Columns: ${Object.keys(parseResult.data[0]).join(', ')}\n`);
  }

  const stats: ImportStats = {
    totalRows,
    successful: 0,
    failed: 0,
    errors: [],
  };

  const batchSize = 1000;
  const batches: CSVEquipmentRow[][] = [];

  // Split into batches
  for (let i = 0; i < parseResult.data.length; i += batchSize) {
    batches.push(parseResult.data.slice(i, i + batchSize));
  }

  console.log(`📦 Processing ${batches.length} batch(es) of up to ${batchSize} records each\n`);

  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchNum = batchIndex + 1;
    const startRow = batchIndex * batchSize + 1;
    const endRow = Math.min((batchIndex + 1) * batchSize, totalRows);

    console.log(`\n🔄 Processing batch ${batchNum}/${batches.length} (rows ${startRow}-${endRow})...`);

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

    // Transform data for this batch
    for (let rowIndex = 0; rowIndex < batch.length; rowIndex++) {
      const row = batch[rowIndex];
      const actualRowNumber = batchIndex * batchSize + rowIndex + 2; // +2 for header and 1-based index

      try {
        // Validate required fields
        if (!row.PLACA || !row.CODIGO) {
          stats.errors.push({
            row: actualRowNumber,
            error: 'Missing required fields: PLACA or CODIGO',
          });
          stats.failed++;
          continue;
        }

        // Map to equipment
        const equipment = mapCSVRowToEquipment(row);
        equipmentData.push(equipment);

        // Map to client (for upsert) - collect unique clients
        const client = mapCSVRowToClient(row);
        const codigo = row.CODIGO.trim();
        if (!clientMap.has(codigo)) {
          clientMap.set(codigo, client as Client);
        }

        // Prepare location history data
        if (equipment.fecha_entrega || equipment.longitud || equipment.latitud) {
          locationHistoryData.push({
            equipment_placa: equipment.placa,
            client_codigo: codigo,
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
        stats.errors.push({
          row: actualRowNumber,
          error: error instanceof Error ? error.message : 'Unknown error during transformation',
        });
        stats.failed++;
      }
    }

    console.log(`  ✓ Transformed ${equipmentData.length} equipment records`);
    console.log(`  ✓ Found ${clientMap.size} unique clients`);
    console.log(`  ✓ Prepared ${locationHistoryData.length} location history records`);

    // Batch upsert clients
    if (clientMap.size > 0) {
      try {
        const clientsArray = Array.from(clientMap.entries()).map(([codigo, client]) => ({
          ...client,
          codigo,
        }));

        console.log(`  📤 Upserting ${clientsArray.length} clients...`);
        const { error: clientError } = await supabase
          .from('clients')
          .upsert(clientsArray, {
            onConflict: 'codigo',
            ignoreDuplicates: false,
          });

        if (clientError) {
          console.error(`  ❌ Client upsert error:`, clientError.message);
          stats.errors.push({
            row: startRow,
            error: `Client upsert failed: ${clientError.message}`,
          });
        } else {
          console.log(`  ✅ Clients upserted successfully`);
        }
      } catch (error) {
        console.error(`  ❌ Client upsert exception:`, error);
        stats.errors.push({
          row: startRow,
          error: `Client upsert exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    // Get client IDs for equipment mapping
    const clientCodes = Array.from(clientMap.keys());
    const clientIdMap = new Map<string, string>();
    
    if (clientCodes.length > 0) {
      try {
        const { data: clients, error: fetchError } = await supabase
          .from('clients')
          .select('id, codigo')
          .in('codigo', clientCodes);

        if (fetchError) {
          console.error(`  ⚠️  Error fetching client IDs:`, fetchError.message);
        } else if (clients) {
          clients.forEach((c) => {
            clientIdMap.set(c.codigo, c.id);
          });
          console.log(`  ✓ Mapped ${clientIdMap.size} client IDs`);
        }
      } catch (error) {
        console.error(`  ⚠️  Exception fetching client IDs:`, error);
      }
    }

    // Batch upsert equipment
    if (equipmentData.length > 0) {
      try {
        // Add client IDs and location_changed_at to equipment
        const equipmentWithClientIds = equipmentData.map((equipment) => {
          const clientId = clientIdMap.get(equipment.codigo) || null;
          return {
            ...equipment,
            current_client_id: clientId,
            location_changed_at: equipment.fecha_entrega
              ? new Date(equipment.fecha_entrega).toISOString()
              : new Date().toISOString(),
          };
        });

        console.log(`  📤 Upserting ${equipmentWithClientIds.length} equipment records...`);
        const { data: insertedEquipment, error: equipmentError } = await supabase
          .from('equipment')
          .upsert(equipmentWithClientIds, {
            onConflict: 'placa',
            ignoreDuplicates: false,
          })
          .select('id, placa');

        if (equipmentError) {
          console.error(`  ❌ Equipment upsert error:`, equipmentError.message);
          stats.errors.push({
            row: startRow,
            error: `Equipment upsert failed: ${equipmentError.message}`,
          });
          stats.failed += equipmentData.length;
        } else {
          const insertedCount = insertedEquipment?.length || 0;
          stats.successful += insertedCount;
          console.log(`  ✅ Equipment upserted successfully (${insertedCount} records)`);

          // Create equipment ID map for location history
          const equipmentIdMap = new Map<string, string>();
          insertedEquipment?.forEach((eq) => {
            equipmentIdMap.set(eq.placa, eq.id);
          });

          // Batch insert location history
          if (locationHistoryData.length > 0 && equipmentIdMap.size > 0) {
            try {
              const locationHistoryRecords = locationHistoryData
                .map((lh) => {
                  const equipmentId = equipmentIdMap.get(lh.equipment_placa);
                  if (!equipmentId) return null;

                  const locationClientId = clientIdMap.get(lh.client_codigo) || null;

                  return {
                    equipment_id: equipmentId,
                    client_id: locationClientId,
                    longitud: lh.longitud,
                    latitud: lh.latitud,
                    ubicacion: lh.ubicacion,
                    ubicacion_especifica: lh.ubicacion_especifica,
                    region_taller: lh.region_taller,
                    bodega_nueva: lh.bodega_nueva,
                    start_date: lh.start_date,
                    end_date: null, // Current location
                    moved_by: null,
                    reason: null,
                    notes: null,
                  };
                })
                .filter((record): record is NonNullable<typeof record> => record !== null);

              if (locationHistoryRecords.length > 0) {
                console.log(`  📤 Inserting ${locationHistoryRecords.length} location history records...`);
                const { error: locationError } = await supabase
                  .from('equipment_location_history')
                  .insert(locationHistoryRecords);

                if (locationError) {
                  console.error(`  ⚠️  Location history insert error:`, locationError.message);
                } else {
                  console.log(`  ✅ Location history inserted successfully`);
                }
              }
            } catch (error) {
              console.error(`  ⚠️  Location history insert exception:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`  ❌ Equipment upsert exception:`, error);
        stats.errors.push({
          row: startRow,
          error: `Equipment upsert exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        stats.failed += equipmentData.length;
      }
    }

    // Progress update
    const progress = ((batchNum / batches.length) * 100).toFixed(1);
    console.log(`\n📈 Progress: ${progress}% (${stats.successful} successful, ${stats.failed} failed)`);
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total rows processed: ${stats.totalRows}`);
  console.log(`✅ Successful: ${stats.successful}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`⚠️  Errors: ${stats.errors.length}`);

  if (stats.errors.length > 0 && stats.errors.length <= 20) {
    console.log('\nError details:');
    stats.errors.forEach((err) => {
      console.log(`  Row ${err.row}: ${err.error}`);
    });
  } else if (stats.errors.length > 20) {
    console.log(`\nFirst 20 errors:`);
    stats.errors.slice(0, 20).forEach((err) => {
      console.log(`  Row ${err.row}: ${err.error}`);
    });
    console.log(`  ... and ${stats.errors.length - 20} more errors`);
  }

  console.log('\n' + '='.repeat(60));

  if (stats.failed === 0) {
    console.log('🎉 Import completed successfully!');
    return 0;
  } else {
    console.log('⚠️  Import completed with errors. Please review the errors above.');
    return 1;
  }
}

// Run the import
importEquipmentBatch()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error during import:', error);
    process.exit(1);
  });
