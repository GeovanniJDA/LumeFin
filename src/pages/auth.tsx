import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authSchema, type AuthFormValues } from '../lib/schemas';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorrectos.',
  'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
  'User already registered': 'Este email já está cadastrado.',
  'Password should be at least 6 characters':
    'A senha deve ter pelo menos 6 caracteres.',
  'Signup is disabled': 'Cadastro desactivado temporariamente.',
  'Email rate limit exceeded': 'Limite de emails atingido. Tente mais tarde.',
}

const getAuthError = (message: string): string =>
  AUTH_ERRORS[message] ?? message

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' }
  });

  const toggleMode = () => {
    setIsLogin(!isLogin);
    form.reset({ email: '', password: '' });
    setAuthError(null);
  };

  const onSubmit = async (data: AuthFormValues) => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        });

        if (error) {
          setAuthError(getAuthError(error.message));
        } else {
          navigate('/app');
        }
      } else {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password
        });

        if (error) {
          setAuthError(getAuthError(error.message));
          return;
        }

        // If session exists immediately — confirmation disabled
        if (signUpData.session) {
          navigate('/app');
          return;
        }

        // If no session — confirmation still enabled
        // (fallback message in case admin re-enables it)
        setAuthError('Verifique seu e-mail para confirmar a conta.');
      }
    } catch (err) {
      setAuthError('Ocorreu um erro inesperado. Por favor, tente novamente.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left panel — brand (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-start justify-between p-12"
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #1a0f00 50%, #000000 100%)'
        }}
      >
        {/* Amber radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 30% 50%, rgba(245,158,11,0.12) 0%, transparent 60%)'
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
            Organize as finanças<br />
            <span className="text-amber-400">da sua família</span><br />
            em um só lugar.
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Contas, cartões, dependentes e transações —
            tudo sob controle com clareza e simplicidade.
          </p>

          {/* 3 feature pills */}
          <div className="flex flex-col gap-2">
            {[
              'Múltiplos dependentes',
              'Alertas de vencimento',
              'Controle de cartões'
            ].map(f => (
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

      {/* Right panel — auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative"
        style={{ background: 'rgba(5,5,5,1)' }}
      >
        {/* Subtle top amber line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)'
          }}
        />

        <div className="w-full max-w-sm space-y-8">

          {/* Mobile logo — only visible on mobile */}
          <div className="lg:hidden text-center">
            <h1 className="text-3xl font-black text-amber-400">LumeFin</h1>
            <p className="text-white/40 text-sm mt-1">
              Clareza financeira para toda a família
            </p>
          </div>

          {/* Form header */}
          <div>
            <h2 className="text-2xl font-black text-white">
              {isLogin ? 'Bem-vindo de volta' : 'Criar conta'}
            </h2>
            <p className="text-white/40 text-sm mt-1">
              {isLogin
                ? 'Entre com suas credenciais para continuar'
                : 'Preencha os dados para criar sua conta'
              }
            </p>
          </div>

          {/* Error message */}
          {authError && (
            <div className="p-3 rounded-xl border border-red-400/30 bg-red-400/10 text-red-400 text-sm">
              {authError}
            </div>
          )}

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4">

              {/* Email field */}
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

              {/* Password field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70 text-sm font-medium">
                      Senha
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                        className="bg-white/4 border-white/10 text-white placeholder:text-white/25 h-11 rounded-xl focus:border-amber-400/50 focus:ring-amber-400/20 transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl font-bold text-black bg-amber-400 hover:bg-amber-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isLogin ? 'Entrar' : 'Criar conta'}
              </Button>
            </form>
          </Form>

          {/* Toggle mode */}
          <div className="text-center">
            <p className="text-white/40 text-sm">
              {isLogin
                ? 'Não tem uma conta? '
                : 'Já tem uma conta? '
              }
              <button
                type="button"
                onClick={toggleMode}
                className="text-amber-400 hover:text-amber-300 font-semibold transition-colors underline-offset-2 hover:underline"
              >
                {isLogin ? 'Cadastre-se' : 'Entre aqui'}
              </button>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-white/20 text-xs">
            Ao continuar, você concorda com os termos de uso do LumeFin.
          </p>
        </div>
      </div>
    </div>
  );
}