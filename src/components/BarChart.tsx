import { useEffect, useState } from 'react';

/** v0 serial-position chart. `values` are 0..1 per position; 0 renders as a short grey "miss" bar. */
export default function BarChart({ values, title }: { values: number[]; title: string }) {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    let id = requestAnimationFrame(() => (id = requestAnimationFrame(() => setGrown(true))));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="chart">
      <h3>{title}</h3>
      <div className="bars">
        {values.map((v, i) => (
          <div key={i} className={`bar ${v > 0 ? '' : 'miss'}`} style={{ height: grown ? `${v > 0 ? v * 100 : 12}%` : 0 }} />
        ))}
      </div>
      <div className="nums">{values.map((_, i) => <span key={i}>{i + 1}</span>)}</div>
      <div className="grad" />
      <div className="legend"><span>Most likely</span><span>Least likely</span><span>Most likely</span></div>
    </div>
  );
}
