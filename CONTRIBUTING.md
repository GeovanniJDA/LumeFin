# Contributing to Finfolk

Thank you for considering a contribution. This document explains how to get started.

---

## Prerequisites

- Node.js 18+
- pnpm
- A Supabase account (free tier)
- Basic knowledge of React, TypeScript, and Supabase

---

## Setup

Follow the [README.md](README.md) getting started steps first.

---

## Rules

### Code

- **No `any` types.** If unsure, use `unknown` and narrow.
- **No localStorage.** All persistence goes through Supabase.
- **No calculated fields persisted.** Derive them at render time.
- **Zod schemas are the single source of truth** for validation. TypeScript types are derived with `z.infer<>`.
- **No store actions called inside render.** Only inside `useEffect` or event handlers.
- **No optimistic updates.** Always refetch from Supabase after mutation.

### Naming

| Context | Convention |
|---|---|
| Files and folders | kebab-case |
| React components | PascalCase |
| Functions and variables | camelCase |
| Database columns | snake_case |
| Zod schemas | camelCase + `Schema` suffix |
| Zustand stores | camelCase + `Store` suffix |

### Components

- All UI components come from `shadcn/ui` first.
- `src/components/ui/` files are **never edited manually** — regenerate with `pnpm dlx shadcn@latest add`.
- All `Select` components must use the `Controller` pattern from React Hook Form.
- All `DialogTrigger` wrapping a `Button` must use `asChild`.

---

## Commit Convention

```
feat: new feature
fix: bug fix
chore: config, deps, tooling
docs: documentation only
refactor: no behavior change
test: tests only
```

Examples:
```
feat: add installment progress to transactions table
fix: category uuid showing in bills edit form
chore: update shadcn dialog component
docs: add supabase setup steps to README
```

---

## Pull Request Process

1. Fork the repository
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes following the rules above
4. Confirm `pnpm run build` passes with no errors
5. Open a PR with a clear description of what changed and why

---

## Adding a New Page

1. Create `src/pages/your-page.tsx`
2. Add a route in `App.tsx` wrapped in `AuthGuard + AppLayout`
3. Add a nav item in `src/components/shared/app-layout.tsx`
4. If new data is needed, create:
   - `src/types/index.ts` — add interface
   - `src/lib/schemas.ts` — add Zod schema
   - `src/store/your-store.ts` — Zustand store
   - `src/hooks/use-your-domain.ts` — custom hook

---

## Database Changes

All schema changes must be:
1. Added as a new numbered file in `supabase/migrations/`
   Example: `005_add_column_to_bills.sql`
2. Never modify existing migration files
3. Always include RLS policies for new tables
4. Never persist calculated fields

---

## Questions

Open an issue on GitHub with the `question` label.