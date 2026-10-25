import { useState, type ReactNode } from 'react';
import { CFG } from '../config';
import { markReplayed, startSession, submitSession, type ScoredResult, type StartedSession } from '../lib/api';
import { scoreLocal } from '../lib/scoring';
import { ErrorCard, Intro, Presenter, Recall, Results } from './screens';

type Screen = 'intro' | 'error' | 'present' | 'recall' | 'results';

type Props = {
  /** Called once, after the first server-scored submit of a session. */
  onResult?: (s: StartedSession, result: ScoredResult) => void;
  /** Rendered under the score on the results screen. */
  slot?: ReactNode;
};

export default function Game({ onResult, slot }: Props) {
  const [screen, setScreen] = useState<Screen>('intro');
  const [session, setSession] = useState<StartedSession | null>(null);
  const [hit, setHit] = useState<boolean[]>([]);
  const [replaying, setReplaying] = useState(false);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      setSession(await startSession(CFG.showMs));
      setReplaying(false);
      setScreen('present');
    } catch {
      setScreen('error');
    } finally {
      setBusy(false);
    }
  }

  async function check(typed: string) {
    if (!session) return;
    if (replaying) {
      setHit(scoreLocal(session.words, typed));
      setScreen('results');
      return;
    }
    setBusy(true);
    try {
      const result = await submitSession(session, typed);
      setHit(result.recalled);
      setScreen('results');
      onResult?.(session, result);
    } catch {
      setScreen('error');
    } finally {
      setBusy(false);
    }
  }

  function replay() {
    if (!session) return;
    markReplayed(session).catch(() => {});
    setReplaying(true);
    setScreen('present');
  }

  return (
    <section className="card">
      {screen === 'intro' && <Intro onStart={start} busy={busy} />}
      {screen === 'error' && <ErrorCard onRetry={start} />}
      {screen === 'present' && session && <Presenter key={String(replaying)} words={session.words} onDone={() => setScreen('recall')} />}
      {screen === 'recall' && <Recall onCheck={check} busy={busy} />}
      {screen === 'results' && session && <Results words={session.words} hit={hit} onReplay={replay} slot={slot} />}
    </section>
  );
}
