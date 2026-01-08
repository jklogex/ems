/**
 * One-time script to extract all unique bodegas from the equipment table
 * 
 * This script queries the 'bodega_nueva' field from the 'equipment' table,
 * extracts all unique values, filters out null/empty values, and generates
 * a TypeScript constant format for hard-coding in lib/constants.ts
 * 
 * Usage: npx tsx scripts/extract-bodegas.ts
 * 
 * Make sure your .env.local file has the Supabase credentials:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

// Load environment variables FIRST - before any imports
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl, supabaseUrl ? '(set)' : '(missing)');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey, supabaseServiceKey ? '(set)' : '(missing)');
  console.error('\nPlease create a .env.local file with:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

async function extractBodegas() {
  try {
    console.log('Fetching bodegas from equipment table...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Fetch all bodega_nueva values from the equipment table using pagination
    console.log('Querying equipment table for bodega_nueva field...');
    
    let allData: Array<{ bodega_nueva: string | null }> = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error, count } = await supabase
        .from('equipment')
        .select('bodega_nueva', { count: 'exact' })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error('Error fetching bodegas:', error);
        process.exit(1);
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        console.log(`Fetched page ${page + 1}: ${data.length} records (total so far: ${allData.length})`);
        
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`\nTotal records fetched: ${allData.length}`);
    const data = allData;

    // Show sample of raw data - show both first and some random samples
    if (data && data.length > 0) {
      console.log('\nSample of raw bodega_nueva values (first 10):');
      data.slice(0, 10).forEach((item, idx) => {
        const value = item.bodega_nueva;
        const type = typeof value;
        const isNa = typeof value === 'string' && (value === '#N/A' || value.toUpperCase() === '#N/A');
        console.log(`  ${idx + 1}. [${type}] ${JSON.stringify(value)}${isNa ? ' (#N/A)' : ''}`);
      });
      
      // Also check for any non-#N/A values
      const nonNaValues = data.filter(item => {
        const value = item.bodega_nueva;
        return value !== null && 
               value !== undefined && 
               typeof value === 'string' && 
               value.trim() !== '' && 
               value !== '#N/A' && 
               value.toUpperCase() !== '#N/A';
      });
      
      if (nonNaValues.length > 0) {
        console.log(`\nFound ${nonNaValues.length} records with non-#N/A values. Sample:`);
        nonNaValues.slice(0, 10).forEach((item, idx) => {
          console.log(`  ${idx + 1}. ${JSON.stringify(item.bodega_nueva)}`);
        });
      }
    }

    // Count different types of values
    const allValues = (data || []).map((item) => item.bodega_nueva);
    const nullCount = allValues.filter(v => v === null).length;
    const undefinedCount = allValues.filter(v => v === undefined).length;
    const emptyStringCount = allValues.filter(v => typeof v === 'string' && v.trim() === '').length;
    const naCount = allValues.filter(v => typeof v === 'string' && (v === '#N/A' || v.toUpperCase() === '#N/A')).length;
    const validCount = allValues.filter(v => 
      v !== null && 
      v !== undefined && 
      typeof v === 'string' && 
      v.trim() !== '' && 
      v !== '#N/A' && 
      v.toUpperCase() !== '#N/A'
    ).length;

    console.log('\nValue statistics:');
    console.log(`  null: ${nullCount}`);
    console.log(`  undefined: ${undefinedCount}`);
    console.log(`  empty string: ${emptyStringCount}`);
    console.log(`  #N/A: ${naCount}`);
    console.log(`  valid (non-empty, non-#N/A): ${validCount}`);

    // Extract unique values, filter out null/empty/#N/A, and sort
    const uniqueBodegas = Array.from(
      new Set(
        (data || [])
          .map((item) => item.bodega_nueva)
          .filter((bodega): bodega is string => 
            bodega !== null && 
            bodega !== undefined && 
            typeof bodega === 'string' && 
            bodega.trim() !== '' &&
            bodega !== '#N/A' &&
            bodega.toUpperCase() !== '#N/A'
          )
      )
    ).sort();

    console.log(`\nFound ${uniqueBodegas.length} unique bodegas:\n`);
    console.log('Bodegas list:');
    uniqueBodegas.forEach((bodega, index) => {
      console.log(`  ${index + 1}. ${bodega}`);
    });

    // Generate TypeScript constant format
    console.log('\n\n=== TypeScript Constant Format ===\n');
    console.log('export const BODEGAS = [');
    uniqueBodegas.forEach((bodega) => {
      console.log(`  '${bodega}',`);
    });
    console.log('] as const;');
    console.log('\nexport type Bodega = typeof BODEGAS[number];\n');

    // Generate JSON format
    console.log('\n=== JSON Format ===\n');
    console.log(JSON.stringify(uniqueBodegas, null, 2));

    console.log('\n✅ Extraction complete!');
    console.log('Copy the TypeScript constant format above into lib/constants.ts (replace the BODEGAS array)');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

extractBodegas();
