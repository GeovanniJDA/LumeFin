import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsSubmitting(true)
    setFormError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setIsSubmitting(false)

    // Security: do NOT reveal if email exists or not
    // Only show real error for rate limiting
    if (
      error?.message?.includes('rate limit') ||
      error?.message?.includes('too many')
    ) {
      setFormError('Muitas tentativas. Aguarde alguns minutos.')
      return
    }

    // Always show success — prevents email enumeration
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left panel — brand (hidden on mobile) */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-start justify-between p-12"
        style={{
          background:
            'linear-gradient(135deg, #000000 0%, #1a0f00 50%, #000000 100%)',
        }}
      >
        {/* Amber radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 30% 50%, rgba(245,158,11,0.12) 0%, transparent 60%)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-amber-400 tracking-tight">
            LumeFin
          </h1>
          <p className="text-white/40 text-sm mt-1 font-medium">
            Clareza financeira para toda a família
          </p>
        </div>

        {/* Central statement */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-black text-white leading-tight">
            Recupere seu<br />
            <span className="text-amber-400">acesso</span><br />
            com segurança.
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Enviaremos um link seguro para o seu email.
            O link expira em 1 hora.
          </p>

          <div className="flex flex-col gap-2">
            {[
              'Link com validade de 1 hora',
              'Criptografia de ponta a ponta',
              'Sem exposição de dados',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-white/60 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/20 text-xs">
            LumeFin © 2026 — Gratuito e open source
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative"
        style={{ background: 'rgba(5,5,5,1)' }}
      >
        {/* Subtle top amber line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)',
          }}
        />

        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <h1 className="text-3xl font-black text-amber-400">LumeFin</h1>
            <p className="text-white/40 text-sm mt-1">
              Clareza financeira para toda a família
            </p>
          </div>

          {submitted ? (
            /* Success screen */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="font-syne font-black text-white text-2xl">
                Email enviado
              </h2>
              <p className="text-white/50 leading-relaxed">
                Se este email estiver cadastrado, você receberá
                um link de recuperação em breve.
              </p>
              <p className="text-white/30 text-sm">
                Verifique também sua pasta de spam.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
              >
                ← Voltar ao login
              </button>
            </div>
          ) : (
            /* Form */
            <>
              {/* Back button */}
              <button
                onClick={() => navigate('/auth')}
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao login
              </button>

              {/* Header */}
              <div>
                <h2 className="text-2xl font-black text-white">
                  Recuperar senha
                </h2>
                <p className="text-white/40 text-sm mt-1">
                  Digite seu email para receber o link de recuperação
                </p>
              </div>

              {/* Rate-limit error */}
              {formError && (
                <div className="p-3 rounded-xl border border-red-400/30 bg-red-400/10 text-red-400 text-sm">
                  {formError}
                </div>
              )}

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-sm font-medium">
                          E-mail
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            autoComplete="email"
                            className="bg-white/4 border-white/10 text-white placeholder:text-white/25 h-11 rounded-xl focus:border-amber-400/50 focus:ring-amber-400/20 transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-xl font-bold text-black bg-amber-400 hover:bg-amber-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Enviar link de recuperação
                  </Button>
                </form>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
