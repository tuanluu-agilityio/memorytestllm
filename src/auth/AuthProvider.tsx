import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { claimSession, type StartedSession } from '../lib/api';
import AuthModal from './AuthModal';

type User = { id: string; email: string };
type AuthCtx = {
  user: User | null;
  openAuth: (title?: string) => void;
  signOut: () => Promise<void>;
  /** The guest session to claim on the next sign-in (memory only). */
  setPending: (s: StartedSession | null) => void;
  pendingSaved: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth outside AuthProvider');
  return c;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [modalTitle, setModalTitle] = useState<string | null>(null);
  const [pendingSaved, setPendingSaved] = useState(false);
  const pending = useRef<StartedSession | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? '' } : null);
      const s = pending.current;
      if (event === 'SIGNED_IN' && s) {
        pending.current = null;
        // Defer: supabase-js must not be awaited inside this callback.
        setTimeout(() => claimSession(s).then((ok) => setPendingSaved(ok)).catch(() => {}), 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const setPending = useCallback((s: StartedSession | null) => {
    pending.current = s;
    setPendingSaved(false);
  }, []);
  const openAuth = useCallback((title = 'Log in or sign up') => setModalTitle(title), []);
  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);

  return (
    <Ctx.Provider value={{ user, openAuth, signOut, setPending, pendingSaved }}>
      {children}
      {modalTitle && <AuthModal title={modalTitle} onClose={() => setModalTitle(null)} />}
    </Ctx.Provider>
  );
}
