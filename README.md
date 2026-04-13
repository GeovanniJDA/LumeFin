# LumeFin

> Open source family financial management web app.

LumeFin is a personal tool to manage finances across multiple family members — tracking bills, credit cards, and bidirectional debts in a single interface.

---

## Features

- **Dependents** — register family members and associate them with bills and cards
- **Bills** — track fixed monthly bills with categories, due dates, and payment status
- **Credit Cards** — manage invoices per card with open/closed/paid status
- **Transactions** — track bidirectional debts (to pay / to receive) with installment support
- **Dashboard** — consolidated view with alerts for overdue and due-soon items
- **Profile** — update username, email, password, and avatar

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript (strict) |
| UI | shadcn/ui + Tailwind CSS |
| State | Zustand |
| Backend | Supabase (Postgres + Auth + Storage + RLS) |
| Forms | React Hook Form + Zod |
| Dates | date-fns |
| Icons | lucide-react |
| Deploy | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A [Supabase](https://supabase.com) account (free tier is sufficient)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/lumefin.git
cd lumefin
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in your Supabase credentials in `.env`:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up the database

Run the following SQL files in order in your Supabase SQL Editor:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_seed_categories.sql`
3. `supabase/migrations/003_rls_policies.sql`
4. `supabase/migrations/004_profiles.sql`

### 5. Set up Supabase Storage

In your Supabase Dashboard:
- Go to **Storage → New bucket**
- Name: `avatars`
- Public: ✅

Then run in SQL Editor:

```sql
create policy "avatar_upload" on storage.objects
  for all using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 6. Start the development server

```bash
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn components — never edit manually
│   ├── shared/       # reusable app components
│   └── sections/     # page-level section components
├── hooks/            # one custom hook per domain
├── lib/
│   ├── supabase.ts   # supabase client
│   ├── schemas.ts    # all Zod schemas (single source of truth)
│   └── utils.ts      # pure utility functions (no side effects)
├── pages/            # one file per route
├── store/            # Zustand stores — one per domain
└── types/            # TypeScript interfaces
supabase/
└── migrations/       # versioned SQL files
```

---

## Domain Model

```
User (Supabase Auth)
├── Dependents (family members)
├── BillCategories (system defaults + custom)
├── Bills → belongs to category, has many dependents
├── CreditCards → optionally linked to a dependent
└── DependentTransactions → linked to a dependent (to_pay | to_receive)
```

---

## Security

- Row Level Security (RLS) enabled on all tables
- All data is scoped to the authenticated user via `auth.uid()`
- Environment variables validated at startup
- Session timeout after 30 minutes of inactivity
- `.env` excluded from version control

---

## License

MIT