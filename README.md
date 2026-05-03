# LumeFin

> Gestão financeira familiar — open source, gratuito e seguro.

[![MIT License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Deploy](https://img.shields.io/badge/deploy-Vercel-black?style=flat-square&logo=vercel)](https://lumefin.vercel.app)
[![Supabase](https://img.shields.io/badge/backend-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)

LumeFin é uma aplicação web para organizar as finanças de toda a família — contas fixas, cartões de crédito, dívidas bidirecionais e compras parceladas, tudo num único lugar com visão consolidada por dependente.

**Demo:** [lumefin.vercel.app](https://lumefin.vercel.app)

---

## Funcionalidades

| Módulo | Descrição |
|---|---|
| **Dashboard** | Visão consolidada com alertas de vencimento e resumo por dependente |
| **Dependentes** | Cadastro de familiares com associação a contas e cartões |
| **Contas** | Controle de contas fixas com categorias, vencimento e status de pagamento |
| **Cartões de Crédito** | Gestão de faturas com compras à vista, parceladas e recorrentes |
| **Fatura Detalhada** | Projeção de 12 meses com linha do tempo de parcelas e recorrentes |
| **Transações** | Controle de dívidas bidirecionais com progresso de parcelas |
| **Perfil** | Atualização de nome, email, senha e avatar |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + TypeScript (strict) |
| UI | shadcn/ui + Tailwind CSS |
| Estado | Zustand |
| Backend | Supabase (Postgres + Auth + Storage + RLS) |
| Formulários | React Hook Form + Zod |
| Datas | date-fns |
| Ícones | lucide-react |
| Deploy | Vercel |
| Testes | Vitest |

---

## Começando

### Pré-requisitos

- Node.js 18+
- pnpm
- Conta no [Supabase](https://supabase.com) (plano gratuito é suficiente)
- Conta no [Vercel](https://vercel.com) (opcional, para deploy)

### 1. Clonar o repositório

```bash
git clone https://github.com/your-username/lumefin.git
cd lumefin
```

### 2. Instalar dependências

```bash
pnpm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env` com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Encontre esses valores em: **Supabase Dashboard → Settings → API**

### 4. Configurar o banco de dados

Execute os arquivos de migration em ordem no **Supabase SQL Editor**:

```
supabase/migrations/001_initial_schema.sql   — tabelas principais
supabase/migrations/002_seed_categories.sql  — categorias padrão do sistema
supabase/migrations/003_rls_policies.sql     — políticas de segurança RLS
supabase/migrations/004_profiles_trigger.sql — perfis de usuário + trigger
supabase/migrations/005_card_purchases.sql   — compras de cartão
```

### 5. Configurar Storage para avatares

No painel do Supabase:

1. Acesse **Storage → New bucket**
2. Nome: `avatars`
3. **Public: desativado** (bucket privado)

Execute no SQL Editor:

```sql
create policy "avatar_upload" on storage.objects
  for all using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 6. Configurar URLs de autenticação

No painel do Supabase, acesse **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:5173` (desenvolvimento) ou sua URL de produção
- **Redirect URLs:** `http://localhost:5173/**`

### 7. Iniciar o servidor de desenvolvimento

```bash
pnpm run dev
```

Acesse [http://localhost:5173](http://localhost:5173).

---

## Scripts disponíveis

```bash
pnpm run dev      # servidor de desenvolvimento
pnpm run build    # build de produção
pnpm run preview  # preview do build
pnpm run test     # executar testes (Vitest)
```

---

## Estrutura do projecto

```
lumefin/
├── src/
│   ├── components/
│   │   ├── ui/           # componentes shadcn — nunca editar manualmente
│   │   ├── shared/       # componentes reutilizáveis (AuthGuard, AppLayout, DatePicker...)
│   │   └── sections/     # componentes de secção (CardPurchasesPanel...)
│   ├── hooks/            # um hook por domínio (use-bills, use-dependents...)
│   ├── lib/
│   │   ├── supabase.ts   # cliente Supabase + setupAuthListener
│   │   ├── schemas.ts    # todos os schemas Zod (fonte única de verdade)
│   │   └── utils.ts      # funções puras sem side effects
│   ├── pages/            # um arquivo por rota
│   ├── store/            # stores Zustand — um por domínio
│   └── types/            # interfaces TypeScript
├── supabase/
│   └── migrations/       # SQL versionado — nunca modificar arquivos existentes
├── .env.example
├── vercel.json           # headers de segurança + rewrite SPA
└── README.md
```

---

## Modelo de domínio

```
User (Supabase Auth)
├── Profile (avatar, username)
├── Dependents (familiares)
│     └── ex: Mãe, Pai, Avó, Irmã, Tia
├── BillCategories
│     ├── System: Energia, Água, Internet, Streaming...
│     └── Custom: categorias criadas pelo usuário
├── Bills
│     ├── belongs to → BillCategory
│     └── has many → Dependents (via bill_dependents)
├── CreditCards
│     ├── optionally linked to → Dependent
│     └── has many → CardPurchases
│           ├── type: cash (à vista)
│           ├── type: installment (parcelado)
│           └── type: recurring (recorrente mensal)
└── DependentTransactions
      ├── linked to → Dependent
      ├── type: to_pay | to_receive
      └── supports: cash | installment (com progresso de parcelas)
```

---

## Segurança

- **RLS activo** em todas as tabelas — dados isolados por `auth.uid()`
- **CHECK constraints** em todos os campos críticos (status, tipo, datas)
- **Variáveis de ambiente** validadas no startup — falha explícita se ausentes
- **Session timeout** após 30 minutos de inactividade
- **Bucket de avatares privado** com URLs assinadas (expiram em 1 hora)
- **Security headers** via `vercel.json` (CSP, X-Frame-Options, X-XSS-Protection)
- **Secure email/password change** activado no Supabase
- **`.env` excluído** do controle de versão

---

## Configurações recomendadas no Supabase

Em **Authentication → Settings**:

| Configuração | Valor recomendado |
|---|---|
| Secure email change | ✅ Activado |
| Secure password change | ✅ Activado |
| Require current password | ✅ Activado |
| Minimum password length | 8 caracteres |
| Rate limit (sign-ups) | 5 / 5 min |

---

## Deploy no Vercel

1. Faça push do repositório para o GitHub
2. Importe o projecto no [Vercel](https://vercel.com)
3. Adicione as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy automático a cada push na branch `main`
5. Após o deploy, actualize a **Site URL** e **Redirect URLs** no Supabase com a URL do Vercel

---

## Contribuindo

Consulte o [CONTRIBUTING.md](CONTRIBUTING.md) para instruções detalhadas.

Resumo rápido:

```bash
# Fork e clone
git clone https://github.com/your-username/lumefin.git

# Instalar e configurar (ver Getting Started acima)

# Criar branch
git checkout -b feat/sua-funcionalidade

# Desenvolver e testar
pnpm run test
pnpm run build

# Commit e PR
git commit -m "feat: descrição da funcionalidade"
git push -u origin feat/sua-funcionalidade
```

### Convenção de commits

```
feat:     nova funcionalidade
fix:      correcção de bug
chore:    configuração, dependências, tooling
docs:     documentação apenas
refactor: sem mudança de comportamento
test:     testes apenas
security: melhorias de segurança
```

---

## Regras de código

- **Sem `any`** — use `unknown` e narrow se necessário
- **Sem localStorage** — toda persistência via Supabase
- **Sem campos calculados persistidos** — derivar em runtime
- **Schemas Zod são a fonte única de verdade** — tipos derivados com `z.infer<>`
- **Sem actions de store no render** — apenas em `useEffect` ou event handlers
- **Sem optimistic update** — sempre refetch após mutação

---

## Roadmap

- [ ] Notificações de vencimento por email (Supabase Edge Functions + Resend)
- [ ] Exportação de fatura em PDF
- [ ] Orçamento por categoria com alertas
- [ ] Modo multi-usuário familiar com convite
- [ ] PWA (Progressive Web App)

---

## Licença

MIT — veja [LICENSE](LICENSE) para detalhes.

---

<p align="center">
  Feito com ♥ para famílias brasileiras
</p>