# Setup Instructions

## Prerequisites

1. Node.js 18+ installed
2. PostgreSQL database (or Supabase account)
3. Cloud storage account (GCP, AWS S3, or Supabase Storage)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory with the following content:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/ems
DIRECT_URL=postgresql://user:password@localhost:5432/ems

# Supabase Configuration (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key_here_generate_with_openssl_rand_base64_32

# Cloud Storage Configuration
STORAGE_BUCKET_NAME=your_bucket_name
STORAGE_PROJECT_ID=your_project_id
```

**Important:** Replace all placeholder values with your actual credentials:
- Database connection string (PostgreSQL)
- Supabase credentials (if using Supabase)
- NextAuth secret (generate with: `openssl rand -base64 32`)
- Cloud storage credentials

3. Set up the database:
   - Run the SQL schemas in order:
     - `lib/db/schema.sql` (core tables)
     - `lib/db/schema-work-orders.sql` (work orders)
     - `lib/db/schema-inventory.sql` (inventory)

4. Run the development server:
```bash
npm run dev
```

## Database Setup

The system uses PostgreSQL. You can use:
- Supabase (recommended for quick setup)
- AWS RDS
- Self-hosted PostgreSQL

Run the SQL files in this order:
1. `lib/db/schema.sql` - Core tables (users, equipment, clients, location history)
2. `lib/db/schema-work-orders.sql` - Work orders and scheduling
3. `lib/db/schema-inventory.sql` - Inventory and warehouses

## Initial Data

1. Create at least one admin user in the `users` table
2. Import equipment from CSV using the bulk import feature
3. Set up warehouses (7 warehouses as specified)
4. Create parts catalog

## Features Implemented

### Part 1: Core Foundation ✅
- Database schema for equipment, clients, users
- Equipment location history tracking
- CSV import functionality
- Equipment and client management UI
- Search and filtering

### Part 2: Work Orders & Planning ✅
- Work order lifecycle management
- Preventive maintenance scheduling
- Technician assignment
- Checklist system
- Evidence tracking (photos, signatures)
- Parts consumption tracking

### Part 3: Mobile PWA ✅
- Offline-first architecture with IndexedDB
- Service Worker for caching
- Sync manager for offline operations
- Mobile-optimized UI
- GPS navigation integration

### Part 4: Inventory Management & Reports ✅
- Multi-warehouse inventory system
- Parts catalog
- Stock tracking and low stock alerts
- Inventory movements tracking
- Basic reports dashboard

## Next Steps

1. Configure authentication (NextAuth.js)
2. Set up cloud storage for images
3. Customize UI/UX as needed
4. Add more detailed reporting features
5. Implement advanced scheduling algorithms
6. Add real-time notifications

## API Endpoints

### Equipment
- `GET /api/equipment` - List equipment
- `POST /api/equipment` - Create equipment or import CSV
- `GET /api/equipment/[id]` - Get equipment details
- `PATCH /api/equipment/[id]` - Update equipment
- `POST /api/equipment/[id]/location` - Update location
- `GET /api/equipment/[id]/location-history` - Get location history

### Work Orders
- `GET /api/work-orders` - List work orders
- `POST /api/work-orders` - Create work order
- `GET /api/work-orders/[id]` - Get work order details
- `PATCH /api/work-orders/[id]` - Update work order
- `POST /api/work-orders/[id]/items` - Add checklist items
- `POST /api/work-orders/[id]/evidence` - Add evidence
- `POST /api/work-orders/[id]/parts` - Add parts consumed

### Inventory
- `GET /api/inventory` - List inventory
- `POST /api/inventory` - Update inventory
- `GET /api/warehouses` - List warehouses
- `POST /api/warehouses` - Create warehouse

## Mobile App

Access the mobile PWA at `/mobile`. The app:
- Works offline using IndexedDB
- Syncs automatically when online
- Optimized for mobile devices
- Supports GPS navigation

## Notes

- The system is designed to handle 50,000+ equipment units
- Supports 25+ concurrent technicians
- All critical operations are auditable
- Location history is fully tracked
- Images are stored in cloud storage

