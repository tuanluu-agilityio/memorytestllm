import { supabase } from './supabase';

export type StartedSession = { sessionId: string; claimToken: string; words: string[] };
export type ScoredResult = { score: number; recalled: boolean[] };
export type LeaderboardRow = { rank: number; displayName: string; bestScore: number; games: number; isMe: boolean };
export type HistoryRow = { id: string; createdAt: string; score: number; replayed: boolean };
export type PositionStat = { position: number; recallRate: number; games: number };

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

const own = (s: StartedSession) => ({ p_session_id: s.sessionId, p_claim_token: s.claimToken });

export async function startSession(showMs: number): Promise<StartedSession> {
  const d = await call<{ session_id: string; claim_token: string; words: string[] }>('start_session', { p_show_ms: showMs });
  return { sessionId: d.session_id, claimToken: d.claim_token, words: d.words };
}

export const submitSession = (s: StartedSession, typed: string) =>
  call<ScoredResult>('submit_session', { ...own(s), p_typed: typed });

export const markReplayed = (s: StartedSession) => call<void>('mark_replayed', own(s));

export const claimSession = (s: StartedSession) => call<boolean>('claim_session', own(s));

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const rows = await call<{ rank: number; display_name: string; best_score: number; games: number; is_me: boolean }[]>('get_leaderboard');
  return rows.map((r) => ({ rank: r.rank, displayName: r.display_name, bestScore: r.best_score, games: r.games, isMe: r.is_me }));
}

export async function getMyHistory(): Promise<HistoryRow[]> {
  const rows = await call<{ id: string; created_at: string; score: number; replayed: boolean }[]>('get_my_history');
  return rows.map((r) => ({ id: r.id, createdAt: r.created_at, score: r.score, replayed: r.replayed }));
}

export async function getMyPositionStats(): Promise<PositionStat[]> {
  const rows = await call<{ position: number; recall_rate: number | string; games: number }[]>('get_my_position_stats');
  return rows.map((r) => ({ position: r.position, recallRate: Number(r.recall_rate), games: r.games }));
}
