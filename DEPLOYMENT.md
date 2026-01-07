# Deployment Guide

## Production Checklist

### 1. Environment Variables
Ensure all environment variables are set in your production environment:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (if using)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXTAUTH_URL` - Your production URL
- `NEXTAUTH_SECRET` - Strong random secret
- `STORAGE_BUCKET_NAME` - Cloud storage bucket name
- `STORAGE_PROJECT_ID` - Cloud storage project ID

### 2. Database Setup
1. Run all SQL migration files in order:
   - `lib/db/schema.sql`
   - `lib/db/schema-work-orders.sql`
   - `lib/db/schema-inventory.sql`

2. Create initial admin user:
```sql
INSERT INTO users (email, name, role, region)
VALUES ('admin@example.com', 'Administrator', 'admin', NULL);
```

3. Set up 7 warehouses:
```sql
INSERT INTO warehouses (nombre, codigo, region) VALUES
('Bodega Quito', 'BOD-QUI', 'QUITO'),
('Bodega Guayaquil', 'BOD-GYE', 'DURAN/GYE'),
('Bodega La Libertad', 'BOD-LIB', 'LA LIBERTAD'),
-- Add remaining 4 warehouses
```

### 3. Build and Deploy

#### Vercel (Recommended)
```bash
npm run build
vercel deploy --prod
```

#### Self-hosted
```bash
npm run build
npm start
```

### 4. PWA Configuration
- Ensure `manifest.json` is accessible at `/manifest.json`
- Service worker should be at `/sw.js`
- Add icons:
  - `/public/icon-192.png` (192x192)
  - `/public/icon-512.png` (512x512)

### 5. Cloud Storage Setup
Configure your cloud storage provider:
- **Supabase Storage**: Already integrated
- **AWS S3**: Update upload functions
- **GCP Storage**: Update upload functions

### 6. Security
- Enable HTTPS (required for PWA)
- Set up Row Level Security (RLS) policies in PostgreSQL
- Configure CORS if needed
- Set up rate limiting
- Enable audit logging

### 7. Performance
- Enable CDN for static assets
- Configure image optimization
- Set up database connection pooling
- Enable caching for reports

### 8. Monitoring
- Set up error tracking (Sentry, etc.)
- Configure logging
- Set up uptime monitoring
- Database performance monitoring

## Scaling Considerations

### Database
- Use connection pooling (PgBouncer recommended)
- Set up read replicas for reporting
- Index frequently queried fields
- Archive old location history data

### Application
- Use Next.js ISR for static pages
- Implement API caching
- Use edge functions for high-traffic endpoints
- Consider microservices for heavy operations

### Mobile PWA
- Optimize service worker cache strategy
- Compress images before upload
- Limit offline data size
- Implement data expiration

## Backup Strategy

1. **Database Backups**
   - Daily automated backups
   - Point-in-time recovery
   - Test restore procedures

2. **File Storage**
   - Enable versioning
   - Cross-region replication
   - Regular backup verification

3. **Configuration**
   - Version control all configs
   - Document all environment variables
   - Keep deployment scripts in repo

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review and optimize slow queries
- Clean up old location history
- Archive completed work orders
- Review and update security policies

### Monitoring
- Track API response times
- Monitor database performance
- Watch for error rates
- Track user activity
- Monitor storage usage

