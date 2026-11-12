import { useNavigate } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ArrowUpDown,
  CalendarDays,
  ChartNoAxesCombined,
  CircleCheck,
  CreditCard,
  Download,
  PiggyBank,
  ReceiptText,
  Users,
  Wallet,
} from 'lucide-react'

const features = [
  {
    icon: ChartNoAxesCombined,
    title: 'Dashboard e comparação mensal',
    description:
      'Veja um resumo das finanças, alertas e despesas por dependente. Compare o mês atual com o anterior para entender o que mudou.',
  },
  {
    icon: ReceiptText,
    title: 'Contas e categorias',
    description:
      'Cadastre contas fixas, organize por categoria e acompanhe vencimentos e status de pagamento.',
  },
  {
    icon: CalendarDays,
    title: 'Calendário de vencimentos',
    description:
      'Consulte próximos vencimentos de contas e faturas em uma visão organizada por data.',
  },
  {
    icon: CreditCard,
    title: 'Cartões e faturas',
    description:
      'Acompanhe faturas e compras à vista, parceladas ou recorrentes em cada cartão.',
  },
  {
    icon: ArrowUpDown,
    title: 'Parcelas e projeções',
    description:
      'Consulte a projeção de até 12 meses das compras parceladas e recorrentes da fatura.',
  },
  {
    icon: Wallet,
    title: 'Fluxo de caixa',
    description:
      'Registre entradas e saídas recorrentes e acompanhe os lançamentos previstos.',
  },
  {
    icon: ArrowUpRight,
    title: 'Valores a pagar e receber',
    description:
      'Organize dívidas entre pessoas, acompanhe parcelas e marque pagamentos recebidos ou realizados.',
  },
  {
    icon: PiggyBank,
    title: 'Reserva de emergência',
    description:
      'Defina uma meta, registre depósitos e retiradas e acompanhe seu progresso.',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Orçamento por categoria',
    description:
      'Estabeleça limites mensais por categoria e acompanhe o consumo ao longo do mês.',
  },
  {
    icon: Users,
    title: 'Finanças em família',
    description:
      'Cadastre dependentes e associe contas, cartões e lançamentos para uma visão familiar.',
  },
  {
    icon: Download,
    title: 'Exportação para Excel',
    description:
      'Exporte os dados financeiros organizados em uma planilha para guardar ou analisar.',
  },
]

function DashboardPreview() {
  return (
    <div className="relative w-full max-w-xl">
      <div aria-hidden="true" className="absolute -inset-8 -z-10 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.12),transparent_68%)] blur-2xl" />
      <div
        aria-label="Prévia ilustrativa do painel financeiro do LumeFin, com valores de demonstração"
        className="w-full rounded-[1.5rem] border border-white/10 bg-[#14130f]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-7"
      >
        <div className="mb-5 flex items-center justify-between border-b border-white/[0.09] pb-3 sm:mb-7 sm:pb-4">
          <div>
            <p className="text-xs text-white/45">Prévia ilustrativa · valores de demonstração</p>
            <p className="mt-1 font-semibold text-white">Resumo financeiro</p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/65">Este mês</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-xl border-l-2 border-amber-400 bg-white/[0.025] p-3 sm:p-4">
            <p className="text-xs text-white/45">Despesas do mês</p>
            <p className="mt-2 text-lg font-semibold text-white sm:text-2xl">R$ 3.482,90</p>
            <p className="mt-2 flex items-center gap-1 text-[10px] text-emerald-400 sm:mt-3 sm:text-xs"><ArrowDownRight size={14} /> 8,4% vs. mês anterior</p>
          </div>
          <div className="rounded-xl border-l-2 border-white/20 bg-white/[0.025] p-3 sm:p-4">
            <p className="text-xs text-white/45">Orçamento utilizado</p>
            <p className="mt-2 text-lg font-semibold text-white sm:text-2xl">68%</p>
            <div className="mt-3 h-1.5 overflow-hidden bg-white/10 sm:mt-4">
              <div className="h-full w-[68%] rounded-full bg-amber-400" />
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 sm:mt-4 sm:p-4">
          <div className="mb-4 flex items-center justify-between sm:mb-5">
            <p className="text-sm font-medium text-white">Despesas por categoria</p>
            <span className="text-xs text-white/40">Neste mês</span>
          </div>
          {[
            { name: 'Moradia', amount: 'R$ 1.250,00', width: '78%' },
            { name: 'Alimentação', amount: 'R$ 860,00', width: '56%' },
            { name: 'Transporte', amount: 'R$ 420,00', width: '34%' },
          ].map((category) => (
            <div key={category.name} className="mb-3 last:mb-0 sm:mb-4">
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-white/65">{category.name}</span>
                <span className="text-white/45">{category.amount}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full rounded-full bg-amber-400/75" style={{ width: category.width }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 sm:mt-4 sm:p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/[0.07] text-amber-400"><CalendarDays size={17} /></span>
            <div>
              <p className="text-xs font-medium text-white">Próximo vencimento</p>
              <p className="mt-1 text-xs text-white/45">Conta de energia · dia 18</p>
            </div>
          </div>
          <CircleCheck size={17} className="text-amber-400/80" />
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#0b0a08] text-white selection:bg-amber-400/30">
      <div aria-hidden="true" className="landing-ambient pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <span className="landing-ambient__glow landing-ambient__glow--first" />
        <span className="landing-ambient__glow landing-ambient__glow--second" />
      </div>

      <header className="relative border-b border-white/[0.08] bg-[#0b0a08]/75">
        <nav className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-5 sm:px-8" aria-label="Navegação principal">
          <a href="#inicio" className="font-syne text-xl font-bold tracking-tight text-amber-400">LumeFin</a>
          <div className="hidden items-center gap-9 md:flex">
            <a href="#recursos" className="text-sm text-white/60 transition-colors hover:text-white">Recursos</a>
            <a href="#como-funciona" className="text-sm text-white/60 transition-colors hover:text-white">Como funciona</a>
          </div>
          <button onClick={() => navigate('/auth')} className="rounded-full border border-amber-400/45 px-5 py-2.5 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400">Entrar</button>
        </nav>
      </header>

      <section id="inicio" className="relative mx-auto grid max-w-6xl items-center gap-9 px-5 py-14 sm:gap-12 sm:px-8 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-28">
        <div className="max-w-xl">
          <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/85"><span className="h-px w-7 bg-amber-400/65" />Finanças da família, com mais clareza</p>
          <h1 className="font-syne text-[2.4rem] font-bold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-[3.65rem]">Saiba para onde seu dinheiro está indo.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/60 sm:mt-6 sm:text-lg sm:leading-8">Contas, cartões, compromissos e objetivos financeiros organizados em um só lugar — para você entender o mês e planejar o próximo.</p>
          <div className="mt-7 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:items-center sm:gap-4">
            <button onClick={() => navigate('/auth')} className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3.5 font-semibold text-black transition-colors hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200">Acessar o LumeFin <ArrowRight size={17} /></button>
            <a href="#recursos" className="inline-flex items-center gap-2 px-2 py-3 text-sm font-medium text-white/70 transition-colors hover:text-white">Conhecer os recursos <ArrowDownRight size={16} /></a>
          </div>
          <p className="mt-4 text-xs tracking-wide text-white/40 sm:mt-6">Gratuito · Sem anúncios · Open source</p>
        </div>
        <div className="flex justify-center lg:justify-end"><DashboardPreview /></div>
      </section>

      <section className="relative border-y border-white/[0.08] bg-[#100f0c]/85 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3 sm:gap-10">
          {[
            { title: 'Acompanhe', description: 'Veja contas, faturas e lançamentos em uma visão organizada.' },
            { title: 'Compare', description: 'Perceba mudanças nas despesas de um mês para o outro.' },
            { title: 'Planeje', description: 'Defina limites, acompanhe vencimentos e cuide das suas metas.' },
          ].map((item, index) => (
            <article key={item.title} className={`border-l border-amber-400/40 pl-5 sm:pl-6 ${index > 0 ? 'sm:border-l-white/10 sm:pl-7' : ''}`}>
              <h2 className="font-syne text-lg font-semibold text-white">{item.title}</h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-white/55">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="recursos" className="relative px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 border-b border-white/10 pb-10 md:grid-cols-[0.8fr_1.2fr] md:items-end md:gap-12 md:pb-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/85">O que você pode fazer</p>
              <h2 className="mt-4 max-w-lg font-syne text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Sua vida financeira, vista por inteiro.</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/55 md:justify-self-end">Do registro das contas ao acompanhamento das metas: conheça as ferramentas disponíveis no LumeFin para organizar as finanças pessoais e da família.</p>
          </div>

          <div className="mt-8 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }, index) => (
              <article key={title} className="group border-b border-white/[0.08] py-7 sm:py-8">
                <div className="flex items-start gap-4 sm:gap-5">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/[0.06] text-amber-400 transition-colors group-hover:bg-amber-400/10"><Icon size={19} strokeWidth={1.7} /></span>
                  <div>
                    <p className="mb-2 text-[11px] font-medium tracking-[0.12em] text-white/30">{String(index + 1).padStart(2, '0')}</p>
                    <h3 className="font-syne text-lg font-semibold leading-snug text-white">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/55">{description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="relative border-y border-white/[0.08] bg-[#100f0c]/85 px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/85">Um começo simples</p>
            <h2 className="mt-4 font-syne text-3xl font-bold leading-tight sm:text-4xl">Organize no seu ritmo.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-white/55">Comece pelo que é importante para você e amplie o acompanhamento conforme sua rotina.</p>
            <button onClick={() => navigate('/auth')} className="mt-7 inline-flex items-center gap-2 rounded-full border border-amber-400/40 px-5 py-3 font-semibold text-amber-400 transition-colors hover:bg-amber-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400">Começar a usar <ArrowUpRight size={17} /></button>
          </div>
          <ol className="divide-y divide-white/10 border-y border-white/10">
            {[
              { number: '01', title: 'Cadastre suas contas e cartões', description: 'Reúna os compromissos financeiros que quer acompanhar.' },
              { number: '02', title: 'Organize os lançamentos', description: 'Use categorias, dependentes e recorrências para dar contexto aos valores.' },
              { number: '03', title: 'Acompanhe e ajuste', description: 'Consulte resumos, vencimentos, orçamentos e metas conforme o mês avança.' },
            ].map((step) => (
              <li key={step.number} className="grid gap-2 py-6 sm:grid-cols-[3.5rem_1fr] sm:gap-4 sm:py-7">
                <span className="font-syne text-sm font-semibold text-amber-400">{step.number}</span>
                <div><h3 className="font-semibold text-white">{step.title}</h3><p className="mt-2 text-sm leading-6 text-white/50">{step.description}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="relative px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm sm:flex-row">
          <span className="font-syne font-bold text-amber-400">LumeFin</span>
          <p className="text-center text-white/45">Feito para ajudar famílias brasileiras a cuidar melhor do dinheiro.</p>
          <a href="https://github.com/GeovanniJDA/LumeFin" target="_blank" rel="noopener noreferrer" className="text-white/55 transition-colors hover:text-white">GitHub</a>
        </div>
      </footer>
    </main>
  )
}
