# Next Steps After Database Setup

## ✅ Database Setup Complete!

Your Supabase database is now set up with all tables, indexes, and initial data.

## Step 1: Verify Setup (Optional but Recommended)

Run the verification script in Supabase SQL Editor:
1. Open `scripts/verify-supabase-setup.sql`
2. Copy and paste into SQL Editor
3. Run it to confirm all tables exist

You should see:
- ✓ All 16 tables created
- ✓ Admin user exists
- ✓ All 7 warehouses created

## Step 2: Configure Environment Variables

Make sure your `.env.local` file has all the required values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
```

**Important:** Replace all placeholder values with your actual Supabase credentials.

## Step 3: Set Up Supabase Storage (for Images)

1. In Supabase dashboard → **Storage**
2. Click **"Create bucket"**
3. Name: `equipment-images`
4. Make it **Public** (for now, you can restrict later with RLS)
5. Click **"Create bucket"**

## Step 4: Test the Application

1. Install dependencies (if not already done):
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser:
   - Main app: http://localhost:3000
   - Sign in: http://localhost:3000/auth/signin

## Step 5: Initial Data Setup

### Create Your First User (if needed)

The script created an admin user with email `admin@example.com`, but you'll need to set up authentication. For now, you can:

1. Go to Supabase → **Table Editor** → **users**
2. Verify the admin user exists
3. You can create more users directly in the database or set up Supabase Auth

### Import Equipment from CSV

1. Go to http://localhost:3000/equipment
2. Click **"Importar CSV"**
3. Upload your `ef.csv` file
4. The system will:
   - Create equipment records
   - Create/update clients based on CODIGO
   - Create initial location history records

### Create Parts Catalog

1. Go to http://localhost:3000/inventory/parts
2. Click **"Nuevo Repuesto"**
3. Add your parts catalog

## Step 6: Test Key Features

### Equipment Management
- ✅ View equipment list
- ✅ Search and filter equipment
- ✅ View equipment details
- ✅ View location history
- ✅ Import from CSV

### Work Orders
- ✅ Create work orders
- ✅ Assign to technicians
- ✅ View work order details
- ✅ Calendar view

### Mobile PWA
- ✅ Access at http://localhost:3000/mobile
- ✅ View assigned work orders
- ✅ Works offline (after first load)

### Inventory
- ✅ View inventory by warehouse
- ✅ Low stock alerts
- ✅ Parts catalog

## Troubleshooting

### "Cannot connect to database"
- Verify `DATABASE_URL` has correct password
- Check Supabase project is active
- Verify connection string format

### "Authentication error"
- Check `NEXTAUTH_SECRET` is set
- Verify Supabase keys are correct
- Try signing in with admin@example.com

### "Tables don't exist"
- Run verification script to check
- Re-run setup script if needed

### Import CSV errors
- Check CSV format matches `ef.csv`
- Verify all required fields are present
- Check browser console for specific errors

## What's Working Now

✅ Complete database schema
✅ Equipment management
✅ Client management
✅ Work order system
✅ Inventory management
✅ Mobile PWA (offline-capable)
✅ Location history tracking
✅ CSV import functionality
✅ Basic reporting

## Ready for Production?

Before going to production:
1. Set up proper authentication (Supabase Auth or NextAuth with real passwords)
2. Configure Row Level Security (RLS) policies
3. Set up cloud storage for images
4. Configure environment variables for production
5. Set up backups
6. Test all workflows
7. Load test with sample data

## Need Help?

- Check `SETUP.md` for detailed setup instructions
- Check `SUPABASE_SETUP.md` for Supabase-specific help
- Check `DEPLOYMENT.md` for production deployment

