/**
 * Test script to verify MVT tile generation for Ecuador
 * Run with: npx tsx scripts/test-mvt-tiles.ts
 */

// Load environment variables - try multiple files
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Calculate tile coordinates for Ecuador
function lonLatToTile(lon: number, lat: number, z: number) {
  const n = Math.pow(2, z);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

async function testTiles() {
  console.log('Testing MVT tile generation for Ecuador...\n');

  // Ecuador center coordinates
  const ecuadorLon = -78.5;
  const ecuadorLat = -0.2;

  // Test different zoom levels
  const zoomLevels = [6, 8, 10];

  for (const z of zoomLevels) {
    const { x, y } = lonLatToTile(ecuadorLon, ecuadorLat, z);
    console.log(`\nTesting tile ${z}/${x}/${y} (Ecuador center):`);

    const { data, error } = await supabase.rpc('get_mvt_tile', {
      z_param: z,
      x_param: x,
      y_param: y,
      status_filter: null,
      type_filter: null,
      region_filter: null,
      warehouse_filter: null,
    });

    if (error) {
      console.error('  ❌ Error:', error.message);
      continue;
    }

    if (!data) {
      console.log('  ⚠️  No data returned (null/undefined)');
      continue;
    }

    if (typeof data === 'string') {
      if (data === '\\x' || data.length <= 2) {
        console.log('  ⚠️  Empty tile (\\x)');
      } else {
        // Parse hex to get size
        const hexString = data.startsWith('\\x') ? data.slice(2) : data;
        const sizeBytes = hexString.length / 2;
        console.log(`  ✅ Tile has data: ${sizeBytes} bytes (hex length: ${hexString.length})`);
        console.log(`     Hex preview: ${hexString.substring(0, 50)}...`);
      }
    } else {
      console.log(`  ⚠️  Unexpected data type: ${typeof data}`);
    }
  }

  // Also test a few tiles around Ecuador to find which ones have data
  console.log('\n\nTesting surrounding tiles at zoom 8:');
  const baseTile = lonLatToTile(ecuadorLon, ecuadorLat, 8);
  
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const x = baseTile.x + dx;
      const y = baseTile.y + dy;
      
      const { data, error } = await supabase.rpc('get_mvt_tile', {
        z_param: 8,
        x_param: x,
        y_param: y,
        status_filter: null,
        type_filter: null,
        region_filter: null,
        warehouse_filter: null,
      });

      if (error) {
        console.log(`  ${x}/${y}: Error - ${error.message}`);
        continue;
      }

      if (data && typeof data === 'string' && data.length > 2) {
        const hexString = data.startsWith('\\x') ? data.slice(2) : data;
        const sizeBytes = hexString.length / 2;
        console.log(`  ${x}/${y}: ✅ ${sizeBytes} bytes`);
      } else {
        console.log(`  ${x}/${y}: Empty`);
      }
    }
  }

  // Check equipment distribution
  console.log('\n\nChecking equipment distribution:');
  let bounds = null;
  try {
    const result = await supabase.rpc('get_equipment_bounds', {});
    bounds = result.data;
  } catch (error) {
    // Function might not exist
  }
  
  if (bounds) {
    console.log('Equipment bounds:', bounds);
  } else {
    // Manual query
    const { data: sample } = await supabase
      .from('equipment')
      .select('placa, longitud, latitud')
      .not('geometry', 'is', null)
      .limit(5);
    
    console.log('Sample equipment coordinates:');
    sample?.forEach((eq) => {
      console.log(`  ${eq.placa}: lon=${eq.longitud}, lat=${eq.latitud}`);
    });
  }
}

testTiles()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
