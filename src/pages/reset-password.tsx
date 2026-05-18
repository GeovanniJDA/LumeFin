import { useState, useEffect } from 'react'
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
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'

const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorrectos.',
  'Password should be at least 6 characters':
    'A senha deve ter pelo menos 6 caracteres.',
  'New password should be different from the old password':
    'A nova senha deve ser diferente da senha atual.',
}

const getAuthError = (message: string): string =>
  AUTH_ERRORS[message] ?? message

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

const getPasswordStrength = (pwd: string): number => {
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 10 && /\d/.test(pwd)) score++
  if (pwd.length >= 12 && /[^a-zA-Z0-9]/.test(pwd)) score++
  if (pwd.length >= 14) score++
  return score
}

const strengthColors = ['#EF4444', '#F97316', '#F59E0B', '#10B981']
const strengthLabels = ['Fraca', 'Razoável', 'Boa', 'Forte']

export default function ResetPassword() {
  const navigate = useNavigate()
  const [isValidToken, setIsValidToken] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [session, setSession] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [checking, setChecking] = useState(true)

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const passwordValue = form.watch('password')
  const strength = getPasswordStrength(passwordValue)

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event from Supabase (triggered by the link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sess) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsValidToken(true)
          setSession(sess)
          setChecking(false)
        }
      }
    )

    // Also check current session (e.g. page refresh after recovery link clicked)
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (sess) {
        setIsValidToken(true)
        setSession(sess)
      }
      setChecking(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const onSubmit = async (values: ResetPasswordValues) => {
    setIsSubmitting(true)
    setFormError(null)

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    })

    setIsSubmitting(false)

    if (error) {
      setFormError(getAuthError(error.message))
      return
    }

    setSuccess(true)
    setTimeout(() => navigate('/app'), 2000)
  }

  // Loading spinner while checking token
  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
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
            Crie uma senha<br />
            <span className="text-amber-400">segura</span><br />
            e memorável.
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Uma senha forte protege suas finanças pessoais
            e das pessoas que você ama.
          </p>

          <div className="flex flex-col gap-2">
            {[
              'Mínimo 8 caracteres',
              'Combine letras, números e símbolos',
              'Evite senhas óbvias',
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

          {/* Success screen */}
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="font-syne font-black text-white text-2xl">
                Senha alterada!
              </h2>
              <p className="text-white/50">
                Redirecionando para o aplicativo...
              </p>
            </div>
          ) : !isValidToken ? (
            /* Invalid / expired token */
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <h2 className="text-2xl font-black text-white">
                Link inválido ou expirado
              </h2>
              <p className="text-white/50">
                Este link de recuperação é inválido ou já expirou.
              </p>
              <button
                onClick={() => navigate('/auth/forgot-password')}
                className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
              >
                Solicitar novo link
              </button>
            </div>
          ) : (
            /* Reset form */
            <>
              {/* Back button */}
              <button
                onClick={() => navigate('/auth/forgot-password')}
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              {/* Header */}
              <div>
                <h2 className="text-2xl font-black text-white">
                  Nova senha
                </h2>
                <p className="text-white/40 text-sm mt-1">
                  Escolha uma senha segura para sua conta
                  {session?.user?.email ? ` (${session.user.email})` : ''}
                </p>
              </div>

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
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-sm font-medium">
                          Nova senha
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className="bg-white/4 border-white/10 text-white placeholder:text-white/25 h-11 rounded-xl focus:border-amber-400/50 focus:ring-amber-400/20 transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />

                        {/* Password strength indicator */}
                        {passwordValue.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4].map((bar) => (
                                <div
                                  key={bar}
                                  className="flex-1 h-1 rounded-full transition-all duration-300"
                                  style={{
                                    backgroundColor:
                                      bar <= strength
                                        ? strengthColors[strength - 1]
                                        : 'rgba(255,255,255,0.1)',
                                  }}
                                />
                              ))}
                            </div>
                            {strength > 0 && (
                              <p
                                className="text-xs"
                                style={{ color: strengthColors[strength - 1] }}
                              >
                                Senha {strengthLabels[strength - 1]}
                              </p>
                            )}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-sm font-medium">
                          Confirmar senha
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            autoComplete="new-password"
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
                    Salvar nova senha
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
