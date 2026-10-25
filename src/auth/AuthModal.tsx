import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

type Tab = 'Log in' | 'Sign up';

export default function AuthModal({ title, onClose }: { title: string; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('Sign up');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = tab === 'Sign up'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message);
    else onClose();
  }

  const tabClass = (t: Tab) =>
    `flex-1 pb-2 border-b-2 cursor-pointer ${tab === t ? 'border-blue text-text' : 'border-transparent text-muted'}`;

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[380px] rounded-xl border border-line bg-card p-7 text-left">
        <button aria-label="Close" onClick={onClose} className="absolute right-4 top-3 cursor-pointer text-xl text-muted hover:text-text">×</button>
        <h2 id="auth-title" className="mb-5 pr-6 font-heading text-xl">{title}</h2>
        <div role="tablist" className="mb-5 flex text-sm">
          {(['Log in', 'Sign up'] as Tab[]).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tabClass(t)} onClick={() => { setTab(t); setError(''); }}>{t}</button>
          ))}
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="text-sm text-muted" htmlFor="auth-email">Email</label>
          <input id="auth-email" className="field" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="text-sm text-muted" htmlFor="auth-password">Password</label>
          <input id="auth-password" className="field" type="password" required minLength={6}
            autoComplete={tab === 'Sign up' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p role="alert" className="text-sm text-orange">{error}</p>}
          <button className="btn mt-2" type="submit" disabled={busy}>{tab}</button>
        </form>
      </div>
    </div>
  );
}
