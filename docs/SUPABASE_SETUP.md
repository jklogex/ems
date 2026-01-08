# Supabase Database Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project Name**: `ems` (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development
5. Click "Create new project"
6. Wait 2-3 minutes for project to be created

## Step 2: Get Your Connection Details

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (`https://abfqicrehnxawdhqcbdw.supabase.co`)
   - **anon/public key** (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZnFpY3JlaG54YXdkaHFjYmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjQ3MzYsImV4cCI6MjA4MzMwMDczNn0.GhrHHDvDR2XEHuqZUfSOMc7OPuT7tg7a11GEdRmfEWQ`)
   - **service_role key** (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZnFpY3JlaG54YXdkaHFjYmR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNDczNiwiZXhwIjoyMDgzMzAwNzM2fQ.vck41k0OBoDAgjvKDcY9FMeC4npSBIMR0m1CYZYzlIE`)

3. Go to **Settings** → **Database**
4. Find **Connection string** section
5. Copy the **URI** connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)
   - Replace `[]` with the password you created in Step 1

## Step 3: Run Database Schemas

**Easiest Method - Use the combined script:**

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Open the file `scripts/setup-supabase.sql` from this project
4. Copy the entire contents and paste into SQL Editor
5. Click "Run" (or press Ctrl+Enter)
6. Wait for success message - this creates all tables, indexes, triggers, and initial data

**Alternative - Run schemas separately:**

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the contents of `lib/db/schema.sql`
4. Click "Run" (or press Ctrl+Enter)
5. Wait for success message
6. Repeat for:
   - `lib/db/schema-work-orders.sql`
   - `lib/db/schema-inventory.sql`

**Alternative: Using Supabase CLI**
```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 4: Verify Setup

After running the setup script, verify everything is correct:

1. In Supabase SQL Editor, create a new query
2. Open and run `scripts/verify-supabase-setup.sql`
3. Check that all tables show ✓ status
4. Verify admin user exists
5. Verify all 7 warehouses are created

**Note:** The setup script (`scripts/setup-supabase.sql`) already creates:
- Initial admin user (admin@example.com)
- All 7 warehouses
- All tables, indexes, and triggers

## Step 6: Configure Environment Variables

Update your `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database (use Supabase connection string)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here

# Cloud Storage (Supabase Storage)
STORAGE_BUCKET_NAME=equipment-images
STORAGE_PROJECT_ID=your_project_id
```

## Step 7: Set Up Supabase Storage (for Images)

1. In Supabase dashboard, go to **Storage**
2. Click "Create bucket"
3. Name: `equipment-images`
4. Make it **Public** (or set up RLS policies)
5. Click "Create bucket"

## Step 8: Enable Row Level Security (RLS)

For production, you should set up RLS policies. For development, you can temporarily disable RLS:

```sql
-- Temporarily disable RLS for development (NOT for production!)
ALTER TABLE equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
```

**For Production:** Set up proper RLS policies based on user roles.

## Step 9: Test Connection

Run your Next.js app:
```bash
npm run dev
```

Check the browser console and terminal for any connection errors.

## Troubleshooting

### Connection Issues
- Verify your password in the connection string
- Check that your IP is allowed (Supabase allows all by default)
- Ensure you're using the correct project URL

### Schema Errors
- Make sure you run schemas in order (schema.sql first)
- Check for duplicate table errors (tables might already exist)
- Verify all foreign key references are correct

### Authentication Issues
- Ensure `NEXTAUTH_SECRET` is set
- Check that `NEXTAUTH_URL` matches your app URL
- Verify Supabase keys are correct

## Next Steps

1. Import equipment from CSV using the bulk import feature
2. Create parts catalog
3. Set up preventive maintenance schedules
4. Configure user authentication

## Useful Supabase Links

- **Dashboard**: https://app.supabase.com
- **Documentation**: https://supabase.com/docs
- **SQL Editor**: In your project dashboard → SQL Editor
- **Table Editor**: In your project dashboard → Table Editor (to view data)

