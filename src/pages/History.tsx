import { useEffect, useState } from 'react';
import { getMyHistory, getMyPositionStats, type HistoryRow, type PositionStat } from '../lib/api';
import BarChart from '../components/BarChart';

export default function History() {
  const [stats, setStats] = useState<PositionStat[] | null>(null);
  const [rows, setRows] = useState<HistoryRow[]>([]);

  useEffect(() => {
    Promise.all([getMyPositionStats(), getMyHistory()])
      .then(([s, h]) => { setStats(s); setRows(h); })
      .catch(() => setStats([]));
  }, []);

  if (!stats) return <section className="card"><p>Loading…</p></section>;
  const games = stats[0]?.games ?? 0;

  return (
    <section className="card">
      <h2>History</h2>
      {games > 0
        ? <BarChart title="Your serial-position curve" values={stats.map((s) => s.recallRate)} />
        : <div className="chart"><h3>Your serial-position curve</h3></div>}
      <div className="stats">Based on {games} games</div>
      {games < 5 && <div className="stats !text-orange">Play a few more games to see a reliable curve</div>}
      {rows.length === 0 ? <p>No games yet.</p> : (
        <ul className="w-full text-left text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex justify-between border-b border-line py-2">
              <span className="text-muted">{new Date(r.createdAt).toLocaleString()}</span>
              <span>
                {r.replayed && <span className="mr-2 text-xs text-orange">replayed</span>}
                <span>{r.score}/15</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
