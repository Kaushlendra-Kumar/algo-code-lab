import { useState } from 'react';
import type { QuizQuestion } from '../types/content';

export function McqCard({
  q,
  index,
  onAnswer,
  previouslyCorrect,
}: {
  q: QuizQuestion;
  index?: number;
  onAnswer?: (correct: boolean) => void;
  previouslyCorrect?: boolean;
}) {
  const [chosen, setChosen] = useState<number | null>(null);
  const answered = chosen !== null;
  return (
    <div className="stack sm">
      <div className="row nowrap" style={{ alignItems: 'flex-start' }}>
        {index !== undefined && <span className="chip">Q{index + 1}</span>}
        <div className="grow" style={{ fontWeight: 600 }}>
          {q.prompt}
        </div>
        {previouslyCorrect && !answered && <span className="chip good">answered ✓</span>}
      </div>
      <div className="stack sm" role="radiogroup">
        {q.options.map((opt, i) => {
          let cls = 'option';
          if (answered && i === q.answer) cls += ' correct';
          else if (answered && i === chosen) cls += ' wrong';
          return (
            <button
              key={i}
              className={cls}
              role="radio"
              aria-checked={chosen === i}
              disabled={answered}
              onClick={() => {
                setChosen(i);
                onAnswer?.(i === q.answer);
              }}
            >
              <span className="letter">{String.fromCharCode(65 + i)}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`feedback ${chosen === q.answer ? 'good' : 'bad'}`} role="status">
          <strong>{chosen === q.answer ? 'Correct.' : 'Not quite.'}</strong> {q.explanation}
          {chosen !== q.answer && (
            <button className="btn sm ghost" style={{ marginLeft: 8 }} onClick={() => setChosen(null)}>
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
