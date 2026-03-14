import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authSchema, type AuthFormValues } from '../lib/schemas';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data: AuthFormValues) => {
    setLoading(true);
    setMessage(null);

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email: data.email, password: data.password })
      : await supabase.auth.signInWithPassword({ email: data.email, password: data.password });

    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      if (isSignUp) {
        setMessage({ text: 'Check your email for the confirmation link.', type: 'success' });
      } else {
        navigate('/');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4 font-quicksand">
      <Card className="w-full max-w-md shadow-lg border-0 bg-background">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-4xl font-bold font-caveat text-blue-600 mb-2">Finfolk</CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSignUp ? 'Create an account to manage your family finances' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="email" className="font-semibold text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register('email')}
                className={`mt-1 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2 text-left">
              <Label htmlFor="password" className="font-semibold text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className={`mt-1 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            {message && (
              <div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                {message.text}
              </div>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-semibold text-white transition-colors duration-200 mt-2" disabled={loading}>
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col border-t pt-6 space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
              className="ml-1 text-blue-600 hover:text-blue-800 hover:underline font-semibold transition-colors duration-200"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
