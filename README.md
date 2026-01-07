# Sistema de Gestión de Mantenimiento de Equipos de Frío

Sistema integral para planificar, ejecutar, controlar y auditar el mantenimiento de equipos de frío instalados en tiendas a nivel nacional.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** PostgreSQL (via Supabase)
- **Storage:** Cloud storage for images
- **Mobile:** PWA (Progressive Web App) with offline-first architecture
- **Auth:** NextAuth.js with role-based access

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Fill in your database and auth credentials
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

- `/app` - Next.js App Router pages and API routes
- `/components` - React components
- `/lib` - Utility functions and database helpers
- `/public` - Static assets

