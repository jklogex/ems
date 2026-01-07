# Quick Start: Supabase Setup (5 Minutes)

## 🚀 Fast Setup Steps

### 1. Create Supabase Project (2 min)
1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Name: `ems`, choose region, set password
4. Wait for project creation

### 2. Get Your Keys (1 min)
1. Go to **Settings** → **API**
2. Copy:
   - Project URL
   - anon key
   - service_role key
3. Go to **Settings** → **Database**
4. Copy connection string (replace `[YOUR-PASSWORD]` with your password)

### 3. Run Database Setup (1 min)
1. Go to **SQL Editor** in Supabase
2. Click "New query"
3. Open `scripts/setup-supabase.sql` from this project
4. Copy entire file and paste into SQL Editor
5. Click "Run" ✅

### 4. Configure Environment (1 min)
Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any_random_string_32_chars_min
```

### 5. Test It! (30 sec)
```bash
npm run dev
```

Visit http://localhost:3000 - you should see the app!

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Database setup script ran successfully
- [ ] `.env.local` file configured
- [ ] App starts without errors
- [ ] Can access `/equipment` page

## 🆘 Troubleshooting

**"Cannot connect to database"**
- Check DATABASE_URL has correct password
- Verify Supabase project is active

**"Tables don't exist"**
- Re-run `scripts/setup-supabase.sql`
- Check SQL Editor for error messages

**"Authentication error"**
- Verify NEXTAUTH_SECRET is set
- Check Supabase keys are correct

## 📝 Next Steps

1. Import equipment from `ef.csv` using bulk import
2. Create parts catalog
3. Set up preventive maintenance schedules

