import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game from '../../src/game/Game';
import * as api from '../../src/lib/api';

vi.mock('../../src/config', () => ({ CFG: { count: 15, showMs: 1, gapMs: 1, doneMs: 1, fast: true } }));
vi.mock('../../src/lib/api', () => ({
  startSession: vi.fn(),
  submitSession: vi.fn(),
  markReplayed: vi.fn(),
}));

const words = Array.from({ length: 15 }, (_, i) => `word${'abcdefghijklmno'[i]}`);

describe('Game', () => {
  beforeEach(() => vi.clearAllMocks());

  test('shows a retry card when the server is unreachable', async () => {
    vi.mocked(api.startSession).mockRejectedValue(new Error('fetch failed'));
    render(<Game />);
    await userEvent.click(screen.getByRole('button', { name: 'Show the Words' }));
    expect(await screen.findByText("Couldn't reach the server. Please try again.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(api.startSession).toHaveBeenCalledTimes(2);
  });

  test('disables Check My Memory while the submission is pending', async () => {
    vi.mocked(api.startSession).mockResolvedValue({ sessionId: 's', claimToken: 't', words });
    vi.mocked(api.submitSession).mockReturnValue(new Promise(() => {}));
    render(<Game />);
    await userEvent.click(screen.getByRole('button', { name: 'Show the Words' }));
    const check = await screen.findByRole('button', { name: 'Check My Memory' }, { timeout: 3000 });
    await userEvent.click(check);
    expect(check).toBeDisabled();
    expect(api.submitSession).toHaveBeenCalledTimes(1);
  });

  test('calls onResult once with the server result', async () => {
    const recalled = words.map((_, i) => i === 0);
    vi.mocked(api.startSession).mockResolvedValue({ sessionId: 's', claimToken: 't', words });
    vi.mocked(api.submitSession).mockResolvedValue({ score: 1, recalled });
    const onResult = vi.fn();
    render(<Game onResult={onResult} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show the Words' }));
    await userEvent.type(await screen.findByRole('textbox', {}, { timeout: 3000 }), words[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Check My Memory' }));
    expect(await screen.findByText((_, el) => el?.className === 'score')).toHaveTextContent('You recalled 1 of 15');
    expect(onResult).toHaveBeenCalledWith({ sessionId: 's', claimToken: 't', words }, { score: 1, recalled });
    expect(screen.queryByText('Hallucinated')).not.toBeInTheDocument();
  });

  test('lists typed words that were never shown under Hallucinated', async () => {
    vi.mocked(api.startSession).mockResolvedValue({ sessionId: 's', claimToken: 't', words });
    vi.mocked(api.submitSession).mockResolvedValue({ score: 0, recalled: words.map(() => false) });
    render(<Game />);
    await userEvent.click(screen.getByRole('button', { name: 'Show the Words' }));
    await userEvent.type(await screen.findByRole('textbox', {}, { timeout: 3000 }), 'dark');
    await userEvent.click(screen.getByRole('button', { name: 'Check My Memory' }));
    expect(await screen.findByText('Hallucinated')).toBeInTheDocument();
    const extra = document.querySelectorAll('.chip.extra');
    expect([...extra].map((el) => el.textContent)).toEqual(['dark']);
  });
});
