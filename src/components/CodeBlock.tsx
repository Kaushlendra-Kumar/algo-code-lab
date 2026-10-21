import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { highlight } from '../lib/highlight';
import { displayCode } from '../content/cpp';

export interface CodeBlockProps {
  code: string;
  lang?: 'cpp' | 'go';
  title?: string;
  activeLine?: number;
  keyLines?: number[];
  /** Line numbers rendered as an editable gap instead of code. */
  renderLine?: (line: number, content: ReactNode) => ReactNode;
  onLineClick?: (line: number) => void;
  selectedLine?: number;
  maxHeight?: number;
  copy?: boolean;
}

function CodeBlockImpl({ code, lang = 'cpp', title, activeLine, keyLines = [], renderLine, onLineClick, selectedLine, maxHeight, copy = true }: CodeBlockProps) {
  const shown = useMemo(() => displayCode(code), [code]);
  const lines = useMemo(() => highlight(shown, lang), [shown, lang]);
  const keySet = useMemo(() => new Set(keyLines), [keyLines]);
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Keep the executing line in view without jumping the page.
  useEffect(() => {
    if (!activeLine || !ref.current) return;
    const row = ref.current.querySelector<HTMLTableRowElement>(`tr[data-line="${activeLine}"]`);
    if (!row) return;
    const box = ref.current;
    const top = row.offsetTop;
    if (top < box.scrollTop + 30 || top > box.scrollTop + box.clientHeight - 40) box.scrollTo({ top: top - box.clientHeight / 3, behavior: 'smooth' });
  }, [activeLine]);

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(shown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked */
    }
  };

  return (
    <div className="code" ref={ref} style={maxHeight ? { maxHeight } : undefined}>
      <div className="code-head">
        <span className="dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span>{title ?? (lang === 'cpp' ? 'C++17' : 'Go')}</span>
        {copy && (
          <button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={doCopy} aria-label="Copy code">
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        )}
      </div>
      <table>
        <tbody>
          {lines.map((toks, i) => {
            const n = i + 1;
            const content = toks.length ? toks.map((t, j) => (t.t === 'plain' ? t.s : <span key={j} className={`tok-${t.t}`}>{t.s}</span>)) : ' ';
            const cls = [n === activeLine ? 'hl' : '', keySet.has(n) ? 'key' : '', n === selectedLine ? 'bugsel' : '', onLineClick ? 'clickable' : ''].join(' ');
            return (
              <tr key={n} data-line={n} className={cls} onClick={onLineClick ? () => onLineClick(n) : undefined} aria-current={n === activeLine ? 'step' : undefined}>
                <td className="ln">{n}</td>
                <td className="lc">{renderLine ? renderLine(n, content) : content}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export const CodeBlock = memo(CodeBlockImpl);
