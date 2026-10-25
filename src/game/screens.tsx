import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CFG } from '../config';
import { thirds } from '../lib/scoring';
import BarChart from '../components/BarChart';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Intro({ onStart, busy }: { onStart: () => void; busy: boolean }) {
  return (
    <>
      <h2>Memory Test</h2>
      <p>You’ll see {CFG.count} words, one at a time. Each appears for about {1500 / 1000} seconds. Try to remember as many as you can.</p>
      <button className="btn" onClick={onStart} disabled={busy}>Show the Words</button>
    </>
  );
}

export function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <>
      <p>Couldn't reach the server. Please try again.</p>
      <button className="btn" onClick={onRetry}>Try again</button>
    </>
  );
}

export function Presenter({ words, onDone }: { words: string[]; onDone: () => void }) {
  const [word, setWord] = useState('');
  const [count, setCount] = useState('');
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < words.length; i++) {
        if (cancelled) return;
        setWord(words[i]); setCount(`${i + 1} of ${CFG.count}`);
        await sleep(CFG.showMs);
        setWord(''); await sleep(CFG.gapMs);
      }
      if (cancelled) return;
      setWord('Done!'); setCount('');
      await sleep(CFG.doneMs);
      if (!cancelled) done.current();
    })();
    return () => { cancelled = true; };
  }, [words]);

  return (<><div className="word">{word}</div><div className="counter">{count}</div></>);
}

export function Recall({ onCheck, busy }: { onCheck: (typed: string) => void; busy: boolean }) {
  const [typed, setTyped] = useState('');
  return (
    <>
      <div className="label">Type the words you remember, separated by commas or spaces.</div>
      <textarea className="full" autoFocus placeholder="Type the words you remember here..." value={typed} onChange={(e) => setTyped(e.target.value)} />
      <button className="btn full" disabled={busy} onClick={() => onCheck(typed)}>Check My Memory</button>
    </>
  );
}

export function Results({ words, hit, onReplay, slot }: { words: string[]; hit: boolean[]; onReplay: () => void; slot?: ReactNode }) {
  const n = hit.filter(Boolean).length;
  const t = thirds(hit);
  return (
    <>
      <div className="score">You recalled <b>{n}</b> of {CFG.count}</div>
      {slot}
      <div className="chips">
        {words.map((w, i) => <span key={w} className={`chip ${hit[i] ? 'hit' : 'miss'}`}><i>{i + 1}</i>{w}</span>)}
      </div>
      <BarChart title="Serial position — your recall pattern" values={hit.map((h) => (h ? 1 : 0))} />
      <div className="stats">Beginning {t.beginning}% · Middle {t.middle}% · End {t.end}%</div>
      <div className="insight">
        <p>The words you remembered likely cluster at the <em>beginning</em> and <em>end</em> of the list. The middle gets lost. This is the <em>primacy–recency effect</em> — and LLMs show the same bias.</p>
        <hr />
        <p className="warn">Instructions at the start and end of a context window get followed. The middle gets buried. This is why more context ≠ better results — and why “Lost in the Middle” (Liu et al., 2023) found accuracy drops of 30%+ when key facts land in the center of long contexts.</p>
      </div>
      <button className="replay" onClick={onReplay}>Replay words (defeats the exercise)</button>
    </>
  );
}
