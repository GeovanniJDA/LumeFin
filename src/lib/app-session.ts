import { supabase, setupAuthListener } from './supabase';
import { useProfileStore } from '@/store/profile-store';
import { toast } from 'sonner';

// ponytail: tarefas de sessão saem do bundle inicial — o `App.tsx` só carrega este
// módulo na primeira interação, em link de recuperação/confirmação ou 5 s após o
// `load`. Se alguma tarefa passar a ser necessária para renderizar, não pertence aqui.
const INACTIVITY_LIMIT = 30 * 60 * 1000;

export function startSessionTasks(navigate: (path: string) => void) {
  const auth = setupAuthListener(navigate);

  let timer: ReturnType<typeof setTimeout>;
  const resetTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      await supabase.auth.signOut();
      toast.warning('Sessão encerrada por inactividade.');
    }, INACTIVITY_LIMIT);
  };

  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach((event) => window.addEventListener(event, resetTimer));
  resetTimer();

  const refreshAvatar = async () => {
    const store = useProfileStore.getState();
    if (store.avatarStoragePath && store.profile?.id) {
      await store.refreshAvatarUrl(store.avatarStoragePath);
    }
  };
  window.addEventListener('focus', refreshAvatar);

  return () => {
    auth.data.subscription.unsubscribe();
    clearTimeout(timer);
    events.forEach((event) => window.removeEventListener(event, resetTimer));
    window.removeEventListener('focus', refreshAvatar);
  };
}
