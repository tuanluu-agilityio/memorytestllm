import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import History from '../../src/pages/History';
import Leaderboard from '../../src/pages/Leaderboard';
import * as api from '../../src/lib/api';

vi.mock('../../src/lib/api', () => ({
  getMyHistory: vi.fn(),
  getMyPositionStats: vi.fn(),
  getLeaderboard: vi.fn(),
}));

const stats = (games: number) =>
  Array.from({ length: 15 }, (_, i) => ({ position: i + 1, recallRate: i === 0 ? 1 : 0.5, games }));
const game = (i: number, replayed = false) => ({ id: `g${i}`, createdAt: '2026-10-25T10:00:00Z', score: 7, replayed });

describe('History', () => {
  beforeEach(() => vi.clearAllMocks());

  test('few games: curve with warning, scores and replayed label', async () => {
    vi.mocked(api.getMyPositionStats).mockResolvedValue(stats(3));
    vi.mocked(api.getMyHistory).mockResolvedValue([game(1), game(2, true), game(3), game(4)]);
    render(<History />);
    expect(await screen.findByText('Your serial-position curve')).toBeInTheDocument();
    expect(screen.getByText('Based on 3 games')).toBeInTheDocument();
    expect(screen.getByText('Play a few more games to see a reliable curve')).toBeInTheDocument();
    expect(screen.getAllByText('7/15')).toHaveLength(4);
    expect(screen.getAllByText('replayed')).toHaveLength(1);
  });

  test('five games: no warning', async () => {
    vi.mocked(api.getMyPositionStats).mockResolvedValue(stats(5));
    vi.mocked(api.getMyHistory).mockResolvedValue([game(1)]);
    render(<History />);
    expect(await screen.findByText('Based on 5 games')).toBeInTheDocument();
    expect(screen.queryByText('Play a few more games to see a reliable curve')).toBeNull();
  });

  test('no games', async () => {
    vi.mocked(api.getMyPositionStats).mockResolvedValue([]);
    vi.mocked(api.getMyHistory).mockResolvedValue([]);
    render(<History />);
    expect(await screen.findByText('No games yet.')).toBeInTheDocument();
    expect(screen.getByText('Based on 0 games')).toBeInTheDocument();
  });
});

describe('Leaderboard', () => {
  test('renders rows and highlights me', async () => {
    vi.mocked(api.getLeaderboard).mockResolvedValue([
      { rank: 1, displayName: 'ana', bestScore: 12, games: 4, isMe: false },
      { rank: 2, displayName: 'bob', bestScore: 9, games: 2, isMe: true },
    ]);
    render(<Leaderboard />);
    const me = await screen.findByRole('row', { name: /bob/ });
    expect(me).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('row', { name: /ana/ })).not.toHaveAttribute('aria-current');
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['#', 'Player', 'Best', 'Games']);
  });

  test('empty state', async () => {
    vi.mocked(api.getLeaderboard).mockResolvedValue([]);
    render(<Leaderboard />);
    expect(await screen.findByText('No scores yet.')).toBeInTheDocument();
  });
});
