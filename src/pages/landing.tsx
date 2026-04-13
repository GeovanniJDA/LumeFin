import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Receipt,
  CreditCard,
  ArrowRightLeft,
  Bell,
  Shield,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

/* ─── Feature cards data ─────────────────────────────────────────── */
const features = [
  {
    icon: Users,
    title: 'Dependentes',
    description: 'Cadastre cada familiar e associe contas e cartões a eles.',
  },
  {
    icon: Receipt,
    title: 'Contas Fixas',
    description: 'Água, energia, internet — nunca perca um vencimento.',
  },
  {
    icon: CreditCard,
    title: 'Cartões de Crédito',
    description: 'Acompanhe faturas abertas, fechadas e pagas.',
  },
  {
    icon: ArrowRightLeft,
    title: 'Transações',
    description: 'Controle dívidas bidirecionais — quem deve e quem vai receber.',
  },
  {
    icon: Bell,
    title: 'Alertas',
    description: 'Saiba quais contas vencem nos próximos dias.',
  },
  {
    icon: Shield,
    title: 'Seguro',
    description: 'Seus dados protegidos com autenticação e criptografia.',
  },
];

/* ─── Mock dashboard data ────────────────────────────────────────── */
const mockMetrics = [
  { label: 'Contas Pendentes', value: '4', sub: 'R$ 1.248,00', color: '#F59E0B', Icon: Receipt },
  { label: 'Faturas em Aberto', value: '2', sub: 'R$ 3.760,00', color: '#F59E0B', Icon: CreditCard },
  { label: 'A Receber', value: 'R$ 850,00', sub: null, color: '#10B981', Icon: TrendingUp },
  { label: 'A Pagar', value: 'R$ 320,00', sub: null, color: '#EF4444', Icon: TrendingDown },
];

const mockDependents = [
  { name: 'Maria', rel: 'Mãe', bills: 2, balance: 850, positive: true },
  { name: 'João', rel: 'Pai', bills: 1, balance: 320, positive: false },
];

/* ─── Small floating hero cards ─────────────────────────────────── */
const heroCards = [
  {
    delay: '0s',
    content: (
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)' }}>
          <Receipt className="w-4 h-4" style={{ color: '#F59E0B' }} />
        </div>
        <div>
          <p className="text-xs font-semibold text-white/90">Conta de Luz</p>
          <p className="text-[10px] text-white/40">Vence em 3 dias · R$ 187,00</p>
        </div>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
          style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
          Pendente
        </span>
      </div>
    ),
  },
  {
    delay: '0.3s',
    content: (
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.15)' }}>
          <CreditCard className="w-4 h-4" style={{ color: '#10B981' }} />
        </div>
        <div>
          <p className="text-xs font-semibold text-white/90">Nubank — Maria</p>
          <p className="text-[10px] text-white/40">Fatura aberta · R$ 1.420,00</p>
        </div>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
          style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
          Aberta
        </span>
      </div>
    ),
  },
  {
    delay: '0.6s',
    content: (
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)' }}>
          <ArrowRightLeft className="w-4 h-4" style={{ color: '#EF4444' }} />
        </div>
        <div>
          <p className="text-xs font-semibold text-white/90">Empréstimo — João</p>
          <p className="text-[10px] text-white/40">A pagar · 3/6 parcelas</p>
        </div>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
          Pendente
        </span>
      </div>
    ),
  },
];

/* ─── Component ──────────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white font-quicksand overflow-x-hidden">

      {/* ── Ambient glow ── */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: '-10%',
          right: '-5%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ════════════════════════════════════════
          SECTION 1 — NAVBAR
      ════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(0,0,0,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          height: '64px',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <span className="text-2xl font-extrabold text-amber-400 tracking-tight">LumeFin</span>

          <button
            onClick={() => navigate('/auth')}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              border: '1px solid rgba(245,158,11,0.4)',
              color: '#F59E0B',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.1)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            Entrar
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════════
          SECTION 2 — HERO
      ════════════════════════════════════════ */}
      <section
        className="relative flex flex-col items-center justify-center min-h-screen pt-16 px-6 text-center"
        style={{ zIndex: 1 }}
      >
        {/* Eyebrow */}
        <p
          className="text-xs font-bold tracking-[0.2em] uppercase mb-6"
          style={{ color: '#F59E0B' }}
        >
          Gestão Financeira Familiar
        </p>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 max-w-3xl">
          Clareza financeira
          <br />
          <span style={{ color: '#F59E0B' }}>para toda a família.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl max-w-lg mb-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Organize contas, cartões e dívidas de todos os seus familiares
          em um único lugar. Simples, rápido e seguro.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <button
            id="cta-start"
            onClick={() => navigate('/auth')}
            className="px-8 py-4 rounded-xl text-base font-bold transition-all duration-200 flex items-center gap-2"
            style={{ background: '#F59E0B', color: '#000' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#D97706'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F59E0B'; }}
          >
            Começar agora — é grátis <ChevronRight className="w-4 h-4" />
          </button>

          <button
            id="cta-demo"
            onClick={scrollToFeatures}
            className="px-8 py-4 rounded-xl text-base font-semibold transition-all duration-200"
            style={{
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)';
              (e.currentTarget as HTMLElement).style.color = '#fff';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)';
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)';
            }}
          >
            Ver funcionalidades
          </button>
        </div>

        {/* Floating hero cards */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {heroCards.map((card, i) => (
            <div
              key={i}
              className="glass rounded-2xl px-4 py-3 text-left"
              style={{
                animation: 'heroFloat 3s ease-in-out infinite',
                animationDelay: card.delay,
              }}
            >
              {card.content}
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
          onClick={scrollToFeatures}
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 3 — FEATURES
      ════════════════════════════════════════ */}
      <section id="features" className="relative py-24 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: '#F59E0B' }}>
              Funcionalidades
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              Tudo que sua família precisa
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Cada membro da família tem suas próprias finanças.
              O LumeFin organiza tudo em um só lugar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="glass rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group"
                  style={{ cursor: 'default' }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-300"
                    style={{ background: 'rgba(245,158,11,0.12)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: '#F59E0B' }} />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white">{feat.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 4 — MOCK DASHBOARD PREVIEW
      ════════════════════════════════════════ */}
      <section className="relative py-24 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: '#F59E0B' }}>
              Visual
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              Uma visão completa
              <br />das suas finanças
            </h2>
          </div>

          {/* Mock dashboard container */}
          <div
            className="glass rounded-3xl p-6 md:p-8"
            style={{ border: '1px solid rgba(245,158,11,0.15)' }}
          >
            {/* Page header mock */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Dashboard</h3>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Visão geral financeira e alertas.</p>
              </div>
              <div
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}
              >
                Abril 2026
              </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {mockMetrics.map((m) => {
                const Icon = m.Icon;
                return (
                  <div
                    key={m.label}
                    className="rounded-2xl p-4"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {m.label}
                      </span>
                      <div
                        className="p-1.5 rounded-md"
                        style={{ background: `${m.color}20` }}
                      >
                        <Icon className="w-3 h-3" style={{ color: m.color }} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-white" style={{ color: m.color === '#10B981' || m.color === '#EF4444' ? m.color : 'white' }}>
                      {m.value}
                    </div>
                    {m.sub && (
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.sub}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Alert row */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6"
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderLeft: '3px solid #EF4444',
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#EF4444' }} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: '#EF4444' }}>Conta vence em 2 dias</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Internet Vivo — R$ 119,90 · vence 15/04/2026
                </p>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Dependent summary cards */}
            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Resumo por Dependente
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mockDependents.map((dep) => (
                  <div
                    key={dep.name}
                    className="rounded-2xl p-4"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold text-white">{dep.name}</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
                      >
                        {dep.rel}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="text-base font-bold text-white">{dep.bills}</div>
                        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Contas</p>
                      </div>
                      <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="text-base font-bold text-white">1</div>
                        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Cartões</p>
                      </div>
                      <div
                        className="rounded-lg p-2"
                        style={{ background: dep.positive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}
                      >
                        <div
                          className="text-base font-bold"
                          style={{ color: dep.positive ? '#10B981' : '#EF4444' }}
                        >
                          R${dep.balance}
                        </div>
                        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {dep.positive ? 'A receber' : 'A pagar'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 5 — FINAL CTA
      ════════════════════════════════════════ */}
      <section
        className="relative py-24 px-6"
        style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, transparent 60%)',
          zIndex: 1,
        }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            Comece hoje,
            <br />
            <span style={{ color: '#F59E0B' }}>gratuitamente.</span>
          </h2>
          <p className="text-base mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Sem cartão de crédito. Sem limite de dependentes.
          </p>
          <button
            id="cta-final"
            onClick={() => navigate('/auth')}
            className="px-10 py-4 rounded-xl text-base font-bold transition-all duration-200 inline-flex items-center gap-2"
            style={{ background: '#F59E0B', color: '#000' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#D97706'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F59E0B'; }}
          >
            Criar minha conta <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 6 — FOOTER
      ════════════════════════════════════════ */}
      <footer
        className="relative py-8 px-6"
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          zIndex: 1,
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
            LumeFin © 2026
          </span>
          <span>Feito com ♥ para famílias brasileiras</span>
          <a
            href="#"
            className="transition-colors duration-200 hover:underline"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}
          >
            GitHub
          </a>
        </div>
      </footer>

      {/* ── Float animation keyframes (injected inline) ── */}
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
