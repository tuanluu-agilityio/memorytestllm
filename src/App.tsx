import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import Header from './components/Header';
import Game from './game/Game';
import History from './pages/History';
import Leaderboard from './pages/Leaderboard';
import type { StartedSession } from './lib/api';

export const SAVE_TITLE = 'Save this result — log in or sign up';

function Home() {
  const { user, openAuth, setPending, pendingSaved } = useAuth();
  const [guestResult, setGuestResult] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function onResult(s: StartedSession) {
    if (user) { setGuestResult(false); return; }
    setPending(s);
    setGuestResult(true);
    timer.current = setTimeout(() => openAuth(SAVE_TITLE), 1000);
  }

  const slot = !guestResult ? null : pendingSaved
    ? <p className="!mb-4 text-sm !text-green">Saved to your history</p>
    : <button className="link mb-4 text-sm" onClick={() => openAuth(SAVE_TITLE)}>Log in to save this result</button>;

  return <Game onResult={onResult} slot={slot} />;
}

function Guarded({ children }: { children: React.ReactNode }) {
  const { user, ready, openAuth } = useAuth();
  useEffect(() => { if (ready && !user) openAuth(); }, [ready, user, openAuth]);
  if (!ready) return null;
  return user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<Guarded><History /></Guarded>} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}
