import { useEffect, useState } from 'react';
import { getLeaderboard, type LeaderboardRow } from '../lib/api';

export default function Leaderboard() {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  useEffect(() => { getLeaderboard().then(setRows).catch(() => setRows([])); }, []);

  return (
    <section className="card">
      <h2>Leaderboard</h2>
      <p className="!mb-4 text-sm">Best score per player. Replayed games don't count.</p>
      {rows === null ? <p>Loading…</p> : rows.length === 0 ? <p>No scores yet.</p> : (
        <table className="w-full text-sm">
          <thead className="text-muted">
            <tr>{['#', 'Player', 'Best', 'Games'].map((h) => <th key={h} className="py-2 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rank} aria-current={r.isMe ? 'true' : undefined}
                className={`border-t border-line ${r.isMe ? 'bg-panel text-blue' : ''}`}>
                <td className="py-2">{r.rank}</td>
                <td>{r.displayName}</td>
                <td>{r.bestScore}/15</td>
                <td>{r.games}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
