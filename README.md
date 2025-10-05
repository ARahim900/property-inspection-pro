# Property Inspector Pro

A comprehensive property inspection management system built with Next.js 14, TypeScript, and Supabase.

## Features

- 🏢 **Property Management** - Manage properties and clients
- 📋 **Inspection System** - Create and manage detailed property inspections
- 📄 **Invoice Generation** - Generate and export professional invoices as PDF
- 📊 **Analytics Dashboard** - Track inspection metrics and revenue
- 🔐 **Authentication** - Secure authentication with Supabase
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- 🌙 **Dark Mode** - Built-in dark mode support

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS v4
- **UI Components:** Radix UI
- **Forms:** React Hook Form + Zod
- **PDF Generation:** jsPDF
- **Charts:** Recharts

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ARahim900/property-inspection-pro.git
cd property-inspection-pro
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up the database

Run the migration scripts in your Supabase SQL editor in this order:

1. `scripts/001_create_profiles.sql`
2. `scripts/002_create_clients.sql`
3. `scripts/003_create_properties.sql`
4. `scripts/004_create_inspections.sql`
5. `scripts/005_create_inspection_areas.sql`
6. `scripts/006_create_inspection_items.sql`
7. `scripts/007_create_inspection_photos.sql`
8. `scripts/008_create_invoices.sql`
9. `scripts/009_create_invoice_services.sql`
10. `scripts/010_create_storage_buckets.sql`

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
npm run build
npm start
```

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ARahim900/property-inspection-pro)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables in Vercel project settings
4. Deploy

### Deploy to Netlify

1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables
5. Deploy

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## Project Structure

```
property-inspection-pro/
├── app/                      # Next.js app directory
├── components/               # React components
│   ├── ui/                  # Reusable UI components
│   └── ...                  # Feature components
├── hooks/                    # Custom React hooks
├── lib/                      # Utility functions
│   ├── supabase/           # Supabase client & helpers
│   └── pdf/                # PDF generation utilities
├── scripts/                  # Database migration scripts
├── types.ts                  # TypeScript type definitions
└── middleware.ts            # Next.js middleware (auth)
```

## Security Features

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Authentication required for all routes
- ✅ Secure HTTP headers configured
- ✅ Environment variables for sensitive data
- ✅ Input validation with Zod schemas

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js and Supabase
