/**
 * Script to change password for a user
 * 
 * Usage: npx tsx scripts/change-password.ts <email> <new-password>
 * Example: npx tsx scripts/change-password.ts admin@example.com MyNewPassword123
 */

// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import { resolve } from 'path';

// Try loading .env.local first, then fallback to .env
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

// Verify required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables!');
  console.error('\nPlease ensure you have the following in your .env.local file:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key\n');
  process.exit(1);
}

// Now import the client (after env vars are loaded)
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

async function changePassword(email: string, newPassword: string) {
  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Check if user exists
    console.log(`Looking for user: ${email}...`);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.error(`❌ User with email ${email} not found.`);
      console.error('Error:', userError?.message);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || user.email} (${user.id})`);

    // Hash the password
    console.log('Hashing password...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    console.log('✅ Password hashed successfully.');

    // Try to update the password_hash column
    console.log('Updating password in database...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id);

    if (updateError) {
      // Column might not exist
      if (updateError.message.includes('column') || updateError.code === '42703') {
        console.error('\n⚠️  The password_hash column does not exist in the users table.');
        console.error('\nPlease run this SQL in your Supabase SQL Editor first:');
        console.error('\n' + '='.repeat(60));
        console.error('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);');
        console.error('='.repeat(60) + '\n');
        console.error('After running the SQL, execute this script again.');
        process.exit(1);
      } else {
        console.error('❌ Error updating password:', updateError.message);
        process.exit(1);
      }
    }

    console.log(`\n✅ Password successfully changed for ${email}`);
    console.log('You can now use this password to sign in.\n');

  } catch (error) {
    console.error('❌ Error changing password:', error);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.error('Usage: npx tsx scripts/change-password.ts <email> <new-password>');
  console.error('Example: npx tsx scripts/change-password.ts admin@example.com MyNewPassword123');
  process.exit(1);
}

const [email, newPassword] = args;

if (!email || !newPassword) {
  console.error('Both email and password are required.');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error('Password must be at least 6 characters long.');
  process.exit(1);
}

changePassword(email, newPassword);
