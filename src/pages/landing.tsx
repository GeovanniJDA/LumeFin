import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Receipt, CreditCard, ArrowRightLeft,
  Bell, Shield
} from 'lucide-react'

const useTilt = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return;
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 10
    const y = ((e.clientX - rect.left) / rect.width - 0.5) * -10
    setTilt({ x, y })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
    setHovered(false)
  }

  const style = {
    transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.02 : 1})`,
    transition: hovered
      ? 'transform 0.1s ease'
      : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  }

  return {
    ref,
    style,
    onMouseMove: handleMouseMove,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: handleMouseLeave,
  }
}

const useCountUp = (target: number, duration = 1500, trigger: boolean) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!trigger) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [trigger, target, duration])

  return count
}

const StatCard = ({ value, suffix, label, sub, trigger, delayClass }: any) => {
  const isNumber = !isNaN(Number(value))
  const count = useCountUp(isNumber ? Number(value) : 0, 1500, trigger)
  return (
    <div className={`scroll-reveal reveal text-center ${delayClass}`}>
      <p className="font-syne font-bold text-amber-400 mb-1"
        style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
        {isNumber ? count : value}{suffix}
      </p>
      <p className="text-white font-semibold text-sm">{label}</p>
      <p className="text-white/40 text-xs mt-0.5">{sub}</p>
    </div>
  )
}

const FeatureCard = ({ children, className, style, delayClass }: any) => {
  const tilt = useTilt()
  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseEnter={tilt.onMouseEnter}
      onMouseLeave={tilt.onMouseLeave}
      className={`scroll-reveal reveal ${delayClass || ''} ${className}`}
      style={{ ...style, ...tilt.style }}
    >
      {children}
    </div>
  )
}

const StepCard = ({ item, delayClass }: any) => {
  const tilt = useTilt()
  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseEnter={tilt.onMouseEnter}
      onMouseLeave={tilt.onMouseLeave}
      className={`scroll-reveal reveal ${delayClass} relative flex items-center gap-8 mb-16 last:mb-0 ${item.side === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'}`}
      style={tilt.style}
    >
      <div className="relative shrink-0">
        <div className="w-16 h-16 rounded-full flex items-center justify-center font-syne font-bold text-xl border-2 border-amber-400/40 text-amber-400"
          style={{ background: 'rgba(245,158,11,0.08)' }}>
          {item.step}
        </div>
      </div>
      <div className={`flex-1 p-6 rounded-2xl ${item.side === 'right' ? 'md:text-right' : 'md:text-left'}`}
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="font-syne font-bold text-white text-xl mb-2">{item.title}</h3>
        <p className="text-white/50 leading-relaxed">{item.desc}</p>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [scrollProgress, setScrollProgress] = useState(0)
  
  const ctaRef = useRef<HTMLButtonElement>(null)
  const [ctaOffset, setCtaOffset] = useState({ x: 0, y: 0 })
  const [ctaHovered, setCtaHovered] = useState(false)

  const [statsTrigger, setStatsTrigger] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
      const total = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress((window.scrollY / total) * 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      setMousePos({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Reveal animations
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('visible')
      })
    }, 100)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    document.querySelectorAll('.scroll-reveal').forEach(el => {
      observer.observe(el)
    })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsTrigger(true)
      },
      { threshold: 0.3 }
    )
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  const handleCtaMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = ctaRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left - rect.width / 2) * 0.3
    const y = (e.clientY - rect.top - rect.height / 2) * 0.3
    setCtaOffset({ x, y })
  }

  const handleCtaMouseLeave = () => {
    setCtaOffset({ x: 0, y: 0 })
    setCtaHovered(false)
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      <div
        className="fixed top-0 left-0 z-[100] h-[2px] pointer-events-none"
        style={{
          width: `${scrollProgress}%`,
          background: 'linear-gradient(90deg, #F59E0B, #FDE68A)',
          boxShadow: '0 0 8px rgba(245,158,11,0.8)',
          transition: 'width 0.1s linear'
        }}
      />

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(0,0,0,0.9)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-syne text-xl font-bold text-amber-400 tracking-tight">
            LumeFin
          </span>
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Funcionalidades', href: '#funcionalidades' },
              { label: 'Como funciona', href: '#como-funciona' },
              { label: 'Começar', href: '#comecar' },
            ].map(item => (
              <a key={item.label} href={item.href}
                className="text-sm text-white/60 hover:text-white transition-colors font-medium">
                {item.label}
              </a>
            ))}
          </div>
          <button onClick={() => navigate('/auth')}
            className="px-5 py-2 rounded-full text-sm font-semibold border border-amber-400/40 text-amber-400 hover:bg-amber-400/10 transition-all duration-200 cursor-pointer">
            Entrar
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 pt-16">

        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(245,158,11,0.12) 0%, transparent 60%)',
              animation: 'ambientPulse 8s ease-in-out infinite',
              transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -10}px)`,
              transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px]"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 60%)' }}
          />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
              transform: `translate(${mousePos.x * -5}px, ${mousePos.y * -5}px)`,
              transition: 'transform 2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>

        {/* Eyebrow */}
        <div className="reveal delay-100 flex items-center gap-2 mb-6">
          <div className="h-px w-8 bg-amber-400/60" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80">
            Gestão Financeira Familiar
          </span>
          <div className="h-px w-8 bg-amber-400/60" />
        </div>

        {/* Headline */}
        <h1 className="reveal delay-200 font-syne font-bold text-center leading-[0.9] mb-6 max-w-4xl"
          style={{ 
            fontSize: 'clamp(3rem, 8vw, 7rem)',
            transform: `translate(${mousePos.x * 3}px, ${mousePos.y * 2}px)`,
            transition: 'transform 1s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
          <span className="text-white">Clareza</span>
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #F59E0B 0%, #FDE68A 40%, #F59E0B 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 4s linear infinite'
          }}>
            financeira
          </span>
          <br />
          <span className="text-white">para sua família.</span>
        </h1>

        {/* Subtitle */}
        <p className="reveal delay-300 text-center text-white/50 max-w-lg leading-relaxed mb-10"
          style={{ fontSize: 'clamp(1rem, 2vw, 1.125rem)' }}>
          Organize contas, cartões e dívidas de todos os seus
          familiares em um único lugar.
          Simples, seguro e gratuito.
        </p>

        {/* CTAs */}
        <div className="reveal delay-400 flex flex-col sm:flex-row items-center gap-4 mb-16">
          <button 
            ref={ctaRef}
            onClick={() => navigate('/auth')}
            onMouseMove={handleCtaMouseMove}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={handleCtaMouseLeave}
            className="group relative px-8 py-4 rounded-full font-bold text-black overflow-hidden cursor-pointer"
            style={{ 
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              transform: `translate(${ctaOffset.x}px, ${ctaOffset.y}px) scale(${ctaHovered ? 1.05 : 1})`,
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: ctaHovered
                ? '0 0 60px rgba(245,158,11,0.5), 0 20px 40px rgba(0,0,0,0.4)'
                : '0 0 40px rgba(245,158,11,0.3)'
            }}>
            <span className="relative z-10">Começar gratuitamente →</span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 0.8s ease forwards'
              }}
            />
          </button>
          <a href="#funcionalidades"
            className="px-8 py-4 rounded-full font-semibold text-white/70 border border-white/10 hover:border-white/20 hover:text-white transition-all duration-300">
            Ver funcionalidades
          </a>
        </div>

        {/* Floating mock UI cards */}
        <div className="reveal delay-500 relative w-full max-w-2xl h-64 md:h-80">

          {/* Main dashboard card */}
          <div className="absolute left-1/2 -translate-x-1/2 w-72 md:w-80 z-10"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: 16,
              padding: '20px',
              boxShadow: '0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
              transform: `translate(${mousePos.x * 8}px, ${mousePos.y * 6}px)`,
              transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Total pendente</p>
            <p className="font-syne font-bold text-white text-2xl mb-3">R$ 2.847,00</p>
            <div className="flex gap-2">
              {[
                { label: 'Contas', value: '3', color: '#F59E0B' },
                { label: 'Cartões', value: '2', color: '#10B981' },
                { label: 'Dívidas', value: '1', color: '#EF4444' },
              ].map(item => (
                <div key={item.label} className="flex-1 rounded-lg p-2 text-center"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="font-bold text-sm" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-[9px] text-white/40">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Left floating card */}
          <div className="absolute left-0 md:left-4 top-8 w-44 hidden sm:block"
            style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              backdropFilter: 'blur(16px)',
              borderRadius: 12,
              padding: '14px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
              transform: `translate(${mousePos.x * -14}px, ${mousePos.y * -10}px) rotate(-1deg)`,
              transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <p className="text-[10px] text-amber-400 font-semibold">Vence em 2 dias</p>
            </div>
            <p className="text-xs text-white font-medium">Energia — Mãe</p>
            <p className="text-sm font-bold text-white mt-1">R$ 189,90</p>
          </div>

          {/* Right floating card */}
          <div className="absolute right-0 md:right-4 top-16 w-44 hidden sm:block"
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              backdropFilter: 'blur(16px)',
              borderRadius: 12,
              padding: '14px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
              transform: `translate(${mousePos.x * 18}px, ${mousePos.y * 12}px) rotate(1deg)`,
              transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <p className="text-[10px] text-emerald-400 font-semibold">Pago</p>
            </div>
            <p className="text-xs text-white font-medium">Nubank — Pai</p>
            <p className="text-sm font-bold text-white mt-1">R$ 1.250,00</p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="reveal delay-600 absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <p className="text-xs text-white/30 uppercase tracking-widest">scroll</p>
          <div className="w-px h-8 bg-gradient-to-b from-amber-400/60 to-transparent"
            style={{ animation: 'scrollBounce 2s ease-in-out infinite' }}
          />
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative py-20 border-y border-white/[0.06]">
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.6) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s linear infinite'
          }}
        />
        <div className="max-w-7xl mx-auto px-6">
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {[
              { value: '100', suffix: '%', label: 'Gratuito', sub: 'para sempre' },
              { value: '5', suffix: '+', label: 'Dependentes', sub: 'por família' },
              { value: '∞', suffix: '', label: 'Transações', sub: 'sem limite' },
              { value: '0', suffix: '', label: 'Anúncios', sub: 'jamais' },
            ].map((stat, i) => (
              <StatCard key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} sub={stat.sub} trigger={statsTrigger} delayClass={`delay-${(i + 1) * 100}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="funcionalidades" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="scroll-reveal reveal text-center mb-20">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-400/70 font-semibold mb-4">
              Funcionalidades
            </p>
            <h2 className="font-syne font-bold text-white mb-4"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
              Tudo que sua família precisa
            </h2>
            <p className="text-white/40 max-w-md mx-auto leading-relaxed">
              Cada funcionalidade foi pensada para tornar o controle financeiro familiar simples e claro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

            {/* Large feature */}
            <FeatureCard className="md:col-span-7 relative overflow-hidden rounded-3xl p-8 md:p-10 min-h-[320px] flex flex-col justify-between group"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)',
                border: '1px solid rgba(245,158,11,0.15)',
              }}>
              <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none transition-transform duration-700 group-hover:scale-110"
                style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 60%)' }}
              />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <Users className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="font-syne font-bold text-white text-2xl mb-3">Dependentes</h3>
                <p className="text-white/50 leading-relaxed max-w-sm">
                  Cadastre cada familiar e associe contas, cartões e transações individualmente.
                  Visão completa de cada membro da família.
                </p>
              </div>
              <div className="relative flex gap-2 mt-6">
                {['Mãe', 'Pai', 'Avó', 'Irmã'].map(name => (
                  <span key={name}
                    className="px-3 py-1 rounded-full text-xs font-medium text-white/60 border border-white/10"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {name}
                  </span>
                ))}
              </div>
            </FeatureCard>

            {/* Small features - right */}
            <div className="md:col-span-5 grid grid-cols-1 gap-4">
              {[
                { icon: Receipt, title: 'Contas Fixas', desc: 'Energia, água, internet — nunca perca um vencimento.', color: '#10B981' },
                { icon: CreditCard, title: 'Cartões de Crédito', desc: 'Faturas abertas, fechadas e pagas com histórico.', color: '#3B82F6' },
              ].map((feat, i) => (
                <FeatureCard key={feat.title} delayClass={`delay-${(i + 1) * 200}`}
                  className="relative overflow-hidden rounded-3xl p-6 group transition-all duration-300"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${feat.color}18`, border: `1px solid ${feat.color}30` }}>
                      <feat.icon className="w-5 h-5" style={{ color: feat.color }} />
                    </div>
                    <div>
                      <h3 className="font-syne font-bold text-white mb-1">{feat.title}</h3>
                      <p className="text-white/40 text-sm leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                </FeatureCard>
              ))}
            </div>

            {/* Bottom row */}
            {[
              { icon: ArrowRightLeft, title: 'Transações', desc: 'Controle dívidas bidirecionais com histórico de parcelas.', color: '#8B5CF6' },
              { icon: Bell, title: 'Alertas', desc: 'Saiba quais contas vencem nos próximos dias.', color: '#F59E0B' },
              { icon: Shield, title: 'Seguro', desc: 'Autenticação e RLS — seus dados só para você.', color: '#10B981' },
            ].map((feat, i) => (
              <FeatureCard key={feat.title} delayClass={`delay-${(i + 1) * 150}`}
                className="md:col-span-4 relative overflow-hidden rounded-3xl p-6 group transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${feat.color}18`, border: `1px solid ${feat.color}30` }}>
                  <feat.icon className="w-5 h-5" style={{ color: feat.color }} />
                </div>
                <h3 className="font-syne font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{feat.desc}</p>
              </FeatureCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="como-funciona" className="py-32 px-6 relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(245,158,11,0.04) 0%, transparent 60%)' }}
        />
        <div className="max-w-4xl mx-auto">
          <div className="scroll-reveal reveal text-center mb-20">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-400/70 font-semibold mb-4">
              Como funciona
            </p>
            <h2 className="font-syne font-bold text-white"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
              Em 3 passos simples
            </h2>
          </div>

          <div className="relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px hidden md:block"
              style={{ background: 'linear-gradient(to bottom, rgba(245,158,11,0.4), rgba(245,158,11,0.1), transparent)' }}
            />
            {[
              { step: '01', title: 'Crie sua conta', desc: 'Cadastre-se gratuitamente em menos de 30 segundos. Sem cartão de crédito.', side: 'left' },
              { step: '02', title: 'Adicione sua família', desc: 'Cadastre dependentes — mãe, pai, avós, irmãos. Cada um com seu perfil.', side: 'right' },
              { step: '03', title: 'Organize e acompanhe', desc: 'Adicione contas, cartões e transações. O dashboard mostra tudo em tempo real.', side: 'left' },
            ].map((item, i) => (
              <StepCard key={item.step} item={item} delayClass={`delay-${(i + 1) * 200}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section id="comecar" className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(245,158,11,0.1) 0%, transparent 60%)',
            animation: 'ambientPulse 6s ease-in-out infinite'
          }}
        />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="scroll-reveal reveal">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-400/70 font-semibold mb-6">
              Comece hoje
            </p>
            <h2 className="font-syne font-bold text-white mb-6"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 0.95 }}>
              Sua família merece
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #F59E0B, #FDE68A, #F59E0B)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer 4s linear infinite'
              }}>
                clareza financeira.
              </span>
            </h2>
            <p className="text-white/40 text-lg mb-10 leading-relaxed">
              Gratuito. Sem anúncios. Sem limite de dependentes.
              <br />
              Open source e seguro.
            </p>
            <button onClick={() => navigate('/auth')}
              className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold text-black text-lg overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-2xl cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                boxShadow: '0 0 40px rgba(245,158,11,0.3)'
              }}>
              <span>Criar minha conta — é grátis</span>
              <span className="text-xl group-hover:translate-x-1 transition-transform duration-200">→</span>
            </button>
            <p className="text-white/20 text-sm mt-6">
              Já tem uma conta?{' '}
              <button onClick={() => navigate('/auth')}
                className="text-amber-400/60 hover:text-amber-400 transition-colors underline-offset-2 hover:underline cursor-pointer">
                Entrar
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-syne font-bold text-amber-400">LumeFin</span>
          <p className="text-white/20 text-sm text-center">Feito com ♥ para famílias brasileiras</p>
          <div className="flex items-center gap-6">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
              className="text-white/30 hover:text-white/60 text-sm transition-colors">
              GitHub
            </a>
            <a href="/auth" className="text-white/30 hover:text-white/60 text-sm transition-colors">
              Entrar
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
