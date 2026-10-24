import { Link } from 'react-router';
import { useAuth } from '../auth/AuthProvider';

export default function Header() {
  const { user, openAuth, signOut } = useAuth();
  return (
    <header className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <Link to="/" className="mr-auto font-heading text-lg text-text no-underline">Memory Test</Link>
      {user && <Link to="/history" className="text-muted hover:text-text">History</Link>}
      <Link to="/leaderboard" className="text-muted hover:text-text">Leaderboard</Link>
      {user ? (
        <>
          <span className="text-muted">{user.email}</span>
          <button className="link" onClick={signOut}>Log out</button>
        </>
      ) : (
        <button className="link" onClick={() => openAuth()}>Log in</button>
      )}
    </header>
  );
}
