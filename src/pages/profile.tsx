/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { toast } from 'sonner';
import { Loader2, Camera, Trash2, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { PageHeader } from '../components/shared/page-header';
import { useProfileStore } from '@/store/profile-store';
import { 
  usernameSchema, 
  emailSchema, 
  passwordSchema 
} from '../lib/schemas';
import type { 
  UsernameFormValues, 
  EmailFormValues, 
  PasswordFormValues 
} from '../lib/schemas';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ProfilePage() {
  const { profile, update: updateProfile } = useProfileStore();
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [isSubmittingUsername, setIsSubmittingUsername] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usernameForm = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: '' },
  });

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', confirmEmail: '' },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || '');
        emailForm.setValue('email', user.email || '');
        emailForm.setValue('confirmEmail', user.email || '');
        
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              usernameForm.setValue('username', data.username || '');
            }
          });
      }
    });
  }, [emailForm, usernameForm]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Formato inválido. Use JPEG, PNG, WebP ou GIF.');
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error('Imagem muito grande. Máximo 2MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      await updateProfile(userId, { avatar_url: filePath });
      toast.success('Avatar atualizado.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar avatar.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!userId) return;
    setIsRemovingAvatar(true);
    try {
      const storagePath = useProfileStore.getState().avatarStoragePath;
      if (storagePath) {
        await supabase.storage.from('avatars').remove([storagePath]);
      }
      await updateProfile(userId, { avatar_url: null });
      toast.success('Avatar removido.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover avatar.');
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  const onSubmitUsername = async (values: UsernameFormValues) => {
    if (!userId) return;
    setIsSubmittingUsername(true);
    try {
      await updateProfile(userId, { username: values.username });
      toast.success('Nome atualizado.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar nome.');
    } finally {
      setIsSubmittingUsername(false);
    }
  };

  const onSubmitEmail = async (values: EmailFormValues) => {
    setIsSubmittingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: values.email });
      if (error) throw error;
      toast.success('Email de confirmação enviado.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar email.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const onSubmitPassword = async (values: PasswordFormValues) => {
    setIsSubmittingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      toast.success('Senha actualizada com sucesso!');
      passwordForm.reset();
      setPasswordChanged(true);
      setTimeout(() => setPasswordChanged(false), 4000);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao actualizar senha.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const watchedPassword = passwordForm.watch('password') ?? '';

  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 10 && /\d/.test(pwd)) score++;
    if (pwd.length >= 12 && /[^a-zA-Z0-9]/.test(pwd)) score++;
    if (pwd.length >= 14) score++;
    const labels = ['Fraca', 'Razoável', 'Boa', 'Forte'];
    const colors = ['#EF4444', '#F97316', '#F59E0B', '#10B981'];
    return { score, label: labels[score - 1] ?? '', color: colors[score - 1] ?? '' };
  };

  const pwdStrength = getPasswordStrength(watchedPassword);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Meu Perfil"
        description="Gerencie suas informações pessoais e configurações de conta."
      />

      <div className="flex flex-col md:flex-row gap-8">
        {/* Avatar Section */}
        <div className="w-full md:w-1/3 flex flex-col items-center space-y-4">
          <div className="relative group rounded-full overflow-hidden border border-[rgba(255,255,255,0.1)] shadow-xl glass bg-[rgba(255,255,255,0.05)] w-[120px] h-[120px] flex items-center justify-center">
            {profile?.avatar_url ? (
               <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
               <span className="text-4xl text-[rgba(255,255,255,0.8)] font-bold uppercase">
                 {(profile?.username || userEmail).charAt(0)}
               </span>
            )}
            
            <div 
              className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingAvatar ? <Loader2 className="w-8 h-8 animate-spin text-white" /> : <Camera className="w-8 h-8 text-white" />}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarUpload} 
            />
          </div>

          {profile?.avatar_url && (
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={handleRemoveAvatar} 
               disabled={isRemovingAvatar}
               className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
             >
               {isRemovingAvatar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
               Remover Avatar
             </Button>
          )}
        </div>

        {/* Forms Section */}
        <div className="w-full md:w-2/3 space-y-6">
          
          {/* Form A - Username */}
          <div className="glass p-6 rounded-2xl border border-[rgba(255,255,255,0.05)] space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Nome de Usuário</h3>
              <p className="text-sm text-[rgba(255,255,255,0.5)]">Como você gostaria de ser chamado.</p>
            </div>
            <Form {...usernameForm}>
              <form onSubmit={usernameForm.handleSubmit(onSubmitUsername)} className="space-y-4">
                <FormField
                  control={usernameForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome" {...field} className="glass-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmittingUsername || !usernameForm.formState.isDirty} className="w-full sm:w-auto">
                  {isSubmittingUsername && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Nome
                </Button>
              </form>
            </Form>
          </div>

          {/* Form B - Email */}
          <div className="glass p-6 rounded-2xl border border-[rgba(255,255,255,0.05)] space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Email</h3>
              <p className="text-sm text-[rgba(255,255,255,0.5)]">
                Email atual: <span className="text-white font-medium">{userEmail}</span>
              </p>
            </div>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Novo Email</FormLabel>
                        <FormControl>
                          <Input placeholder="novo@email.com" {...field} className="glass-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={emailForm.control}
                    name="confirmEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Novo Email</FormLabel>
                        <FormControl>
                          <Input placeholder="novo@email.com" {...field} className="glass-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <Button type="submit" disabled={isSubmittingEmail || !emailForm.formState.isDirty} className="w-full sm:w-auto">
                    {isSubmittingEmail && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Atualizar Email
                  </Button>
                  <p className="text-xs text-[rgba(255,165,0,0.8)]">Um email de confirmação será enviado.</p>
                </div>
              </form>
            </Form>
          </div>

          {/* Form C - Password */}
          <div
            className="rounded-2xl border space-y-5 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.04) 0%, rgba(0,0,0,0) 60%)',
              borderColor: 'rgba(245,158,11,0.25)',
              boxShadow: '0 0 32px rgba(245,158,11,0.06)'
            }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
                >
                  <Lock className="w-5 h-5" style={{ color: '#F59E0B' }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Mudar Senha</h3>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Escolha uma senha forte para proteger sua conta.</p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              {passwordChanged && (
                <div
                  className="flex items-center gap-2 p-3 rounded-xl mb-4"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-sm text-emerald-400 font-medium">Senha alterada com sucesso!</p>
                </div>
              )}

              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70">Nova Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showNewPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              {...field}
                              className="glass-input pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        {/* Strength indicator */}
                        {watchedPassword.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4].map(bar => (
                                <div
                                  key={bar}
                                  className="flex-1 h-1 rounded-full transition-all duration-300"
                                  style={{
                                    backgroundColor: bar <= pwdStrength.score
                                      ? pwdStrength.color
                                      : 'rgba(255,255,255,0.08)'
                                  }}
                                />
                              ))}
                            </div>
                            {pwdStrength.score > 0 && (
                              <p className="text-xs" style={{ color: pwdStrength.color }}>
                                Senha {pwdStrength.label}
                              </p>
                            )}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70">Confirmar Nova Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              {...field}
                              className="glass-input pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmittingPassword || !passwordForm.formState.isDirty}
                      className="w-full sm:w-auto font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        color: '#000',
                        opacity: (!passwordForm.formState.isDirty || isSubmittingPassword) ? 0.5 : 1
                      }}
                    >
                      {isSubmittingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar Nova Senha
                    </Button>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Mínimo 6 caracteres
                    </p>
                  </div>
                </form>
              </Form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
