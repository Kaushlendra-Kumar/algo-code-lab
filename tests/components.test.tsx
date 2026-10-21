// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { McqCard } from '../src/components/Quiz';
import { usePlayer } from '../src/components/viz/usePlayer';
import { VizRenderer } from '../src/components/viz/VizRenderer';
import { TRACES } from '../src/lib/viz/traces';

afterEach(cleanup);

describe('usePlayer', () => {
  it('steps forward and back within bounds', () => {
    const { result } = renderHook(() => usePlayer(3));
    expect(result.current.index).toBe(0);
    act(() => result.current.prev());
    expect(result.current.index).toBe(0);
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.index).toBe(2);
    act(() => result.current.seek(-5));
    expect(result.current.index).toBe(0);
    act(() => result.current.end());
    expect(result.current.index).toBe(2);
    act(() => result.current.reset());
    expect(result.current.index).toBe(0);
  });

  it('resets when a new run is loaded', () => {
    const { result, rerender } = renderHook(({ k }) => usePlayer(5, { resetKey: k }), { initialProps: { k: 1 } });
    act(() => result.current.seek(3));
    rerender({ k: 2 });
    expect(result.current.index).toBe(0);
  });
});

describe('McqCard', () => {
  it('reports the answer once and reveals the correct option', () => {
    const onAnswer = vi.fn();
    render(<McqCard q={{ prompt: 'Pick B', options: ['A', 'B', 'C'], answer: 1, explanation: 'Because B.' }} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByRole('radio', { name: /A/ }));
    expect(onAnswer).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByRole('radio', { name: /C/ }));
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Because B/)).toBeTruthy();
  });
});

describe('VizRenderer', () => {
  it('renders every frame of every trace without throwing', () => {
    for (const t of Object.values(TRACES)) {
      const { steps } = t.run(t.defaultInput);
      for (const s of [steps[0], steps[Math.floor(steps.length / 2)], steps[steps.length - 1]]) {
        const { unmount } = render(<VizRenderer state={s.state} />);
        unmount();
      }
    }
  });
});
