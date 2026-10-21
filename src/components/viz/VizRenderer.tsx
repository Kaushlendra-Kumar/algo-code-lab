import { memo, useMemo } from 'react';
import type {
  ArrayState,
  GraphState,
  GridState,
  ListState,
  RecursionState,
  TableState,
  TimelineState,
  Tone,
  TreeState,
  VizState,
} from '../../lib/viz/types';

const TONE_VAR: Record<Tone, string> = {
  active: 'var(--tone-active)',
  compare: 'var(--tone-compare)',
  swap: 'var(--tone-swap)',
  done: 'var(--tone-done)',
  muted: 'var(--tone-muted)',
  found: 'var(--tone-found)',
  warn: 'var(--tone-warn)',
  path: 'var(--tone-path)',
  frontier: 'var(--tone-frontier)',
  visited: 'var(--tone-visited)',
};

function Aux({ aux }: { aux?: { label: string; items: string[]; tone?: Tone }[] }) {
  if (!aux?.length) return null;
  return (
    <div className="aux">
      {aux.map((a) => (
        <div key={a.label} className={`aux-box ${a.tone ? `t-${a.tone}` : ''}`}>
          <div className="lbl">{a.label}</div>
          <div className="aux-items">
            {a.items.length ? a.items.map((it, i) => <span key={`${i}-${it}`} className="aux-item">{it}</span>) : <span className="faint tiny">empty</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ArrayView({ s }: { s: ArrayState }) {
  if (s.bars) {
    const row = s.rows[0];
    const nums = row.values.map((v) => (typeof v === 'number' ? v : 0));
    const max = Math.max(1, ...nums.map(Math.abs));
    return (
      <div>
        <div className="bars" role="img" aria-label={`Array: ${row.values.join(', ')}`}>
          {row.values.map((v, i) => (
            <div key={i} className={`bar-col ${row.tones?.[i] ? `t-${row.tones[i]}` : ''}`} style={{ height: `${Math.max(4, (Math.abs(Number(v) || 0) / max) * 100)}%` }}>
              {row.values.length <= 32 && <span className="bv">{v}</span>}
            </div>
          ))}
        </div>
        <Aux aux={s.aux} />
      </div>
    );
  }
  return (
    <div className="stack lg">
      {s.rows.map((row) => (
        <div key={row.label}>
          <div className="arr-label">{row.label}</div>
          <div style={{ display: 'inline-block' }}>
            <div className="arr-row" role="list" aria-label={row.label}>
              {row.values.map((v, i) => {
                const tone = row.tones?.[i];
                const inRange = row.range && i >= row.range.from && i <= row.range.to;
                return (
                  <div key={i} role="listitem" className={`cell ${tone ? `t-${tone}` : ''} ${inRange ? 'in-range' : ''}`} aria-label={`${row.label}[${i}] = ${v ?? 'empty'}`}>
                    {v === null ? <span className="faint">·</span> : String(v)}
                    <span className="idx">{row.indexLabels?.[i] ?? i}</span>
                  </div>
                );
              })}
            </div>
            {row.range && row.range.to >= row.range.from && (
              <div className="range-bracket" style={{ marginLeft: row.range.from * 48, width: (row.range.to - row.range.from + 1) * 48 - 6, borderColor: TONE_VAR[row.range.tone ?? 'active'] }} />
            )}
            {!!row.pointers?.length && (
              <div className="ptr-row">
                {row.values.map((_, i) => (
                  <div key={i} className="ptr-slot">
                    {row.pointers!.filter((p) => p.index === i).map((p) => (
                      <span key={p.name} className={`ptr ${p.tone ? `t-${p.tone}` : ''}`}>
                        ↑{p.name}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      <Aux aux={s.aux} />
    </div>
  );
}

function TableView({ s }: { s: TableState }) {
  const isDep = (r: number, c: number) => s.deps?.some(([a, b]) => a === r && b === c);
  const isPath = (r: number, c: number) => s.path?.some(([a, b]) => a === r && b === c);
  return (
    <div className="scroll-x">
      {s.title && <div className="arr-label">{s.title}</div>}
      <table className="dp-table">
        <thead>
          <tr>
            <th />
            {s.colLabels.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {s.cells.map((row, r) => (
            <tr key={r}>
              <th style={{ textAlign: 'right' }}>{s.rowLabels[r]}</th>
              {row.map((v, c) => {
                const active = s.active && s.active[0] === r && s.active[1] === c;
                const cls = active ? 'active' : isPath(r, c) ? 'path' : isDep(r, c) ? 'dep' : v !== null && v !== undefined ? 'filled' : '';
                return (
                  <td key={c} className={cls}>
                    {v ?? ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <Aux aux={s.aux} />
    </div>
  );
}

function GridView({ s }: { s: GridState }) {
  const visited = useMemo(() => new Set(s.visited), [s.visited]);
  const frontier = useMemo(() => new Set(s.frontier), [s.frontier]);
  const path = useMemo(() => new Set(s.path ?? []), [s.path]);
  const showDist = s.cols <= 12;
  return (
    <div className="grid-viz" style={{ gridTemplateColumns: `repeat(${s.cols}, minmax(0, 1fr))`, maxWidth: Math.min(900, s.cols * 46) }} role="img" aria-label={`Grid ${s.rows} by ${s.cols}, ${s.visited.length} visited`}>
      {Array.from({ length: s.rows * s.cols }, (_, i) => {
        let cls = 'gcell';
        if (s.walls[i]) cls += ' wall';
        else if (i === s.start) cls += ' start';
        else if (i === s.goal) cls += ' goal';
        else if (path.has(i)) cls += ' path';
        else if (i === s.current) cls += ' current';
        else if (frontier.has(i)) cls += ' frontier';
        else if (visited.has(i)) cls += ' visited';
        else if ((s.weights?.[i] ?? 1) > 1) cls += ' heavy';
        const d = s.dist?.[i];
        return (
          <div key={i} className={cls}>
            {i === s.start ? 'S' : i === s.goal ? 'G' : showDist && d !== null && d !== undefined && !s.walls[i] ? d : (s.weights?.[i] ?? 1) > 1 && !s.walls[i] ? s.weights![i] : ''}
          </div>
        );
      })}
    </div>
  );
}

function GraphView({ s }: { s: GraphState }) {
  const W = 100;
  const H = 62;
  const pos = (n: { x: number; y: number }) => ({ x: n.x, y: (n.y / 100) * (H - 10) + 5 });
  const byId = new Map(s.nodes.map((n) => [n.id, n]));
  return (
    <div>
      <svg className="viz-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Graph">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="rgba(200,210,255,0.7)" />
          </marker>
        </defs>
        {s.edges.map((e, i) => {
          const a = byId.get(e.u);
          const b = byId.get(e.v);
          if (!a || !b) return null;
          const p = pos(a);
          const q = pos(b);
          const dx = q.x - p.x;
          const dy = q.y - p.y;
          const len = Math.hypot(dx, dy) || 1;
          const r = 4.2;
          const x1 = p.x + (dx / len) * r;
          const y1 = p.y + (dy / len) * r;
          const x2 = q.x - (dx / len) * (r + (e.directed ? 0.8 : 0));
          const y2 = q.y - (dy / len) * (r + (e.directed ? 0.8 : 0));
          const color = e.tone ? TONE_VAR[e.tone] : 'rgba(200,210,255,0.28)';
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={e.tone && e.tone !== 'muted' ? 0.9 : 0.45} markerEnd={e.directed ? 'url(#arrow)' : undefined} opacity={e.tone === 'muted' ? 0.35 : 1} style={{ transition: 'stroke 0.3s' }} />
              {e.w !== undefined && !(e.directed && s.edges.every((x) => x.w === 1)) && (
                <text x={(p.x + q.x) / 2} y={(p.y + q.y) / 2 - 1} fontSize="2.6" fill="#cfd6f5" textAnchor="middle" style={{ paintOrder: 'stroke', stroke: '#0b1022', strokeWidth: 0.8 }}>
                  {e.w}
                </text>
              )}
            </g>
          );
        })}
        {s.nodes.map((n) => {
          const p = pos(n);
          const fill = n.tone ? TONE_VAR[n.tone] : 'rgba(255,255,255,0.12)';
          return (
            <g key={n.id}>
              <circle className="node-circle" cx={p.x} cy={p.y} r={4.2} fill={fill} fillOpacity={n.tone ? 0.75 : 1} stroke={n.tone ? TONE_VAR[n.tone] : 'rgba(255,255,255,0.35)'} strokeWidth={0.4} />
              <text x={p.x} y={p.y + 1} fontSize={n.label.length > 2 ? 1.9 : 2.8} fill="#fff" textAnchor="middle" fontWeight={700}>
                {n.label}
              </text>
              {n.badge && (
                <text x={p.x} y={p.y - 5.6} fontSize="2.3" fill="#fde68a" textAnchor="middle" style={{ paintOrder: 'stroke', stroke: '#0b1022', strokeWidth: 0.7 }}>
                  {n.badge}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <Aux aux={s.aux} />
    </div>
  );
}

function layoutBinary(nodes: TreeState['nodes'], root: number | null) {
  const pos = new Map<number, { x: number; y: number }>();
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let order = 0;
  let maxDepth = 0;
  const walk = (id: number | undefined, depth: number) => {
    if (id === undefined) return;
    const n = byId.get(id);
    if (!n) return;
    walk(n.left, depth + 1);
    pos.set(id, { x: order++, y: depth });
    maxDepth = Math.max(maxDepth, depth);
    walk(n.right, depth + 1);
  };
  if (root !== null) walk(root, 0);
  return { pos, count: order, maxDepth };
}

function TreeView({ s }: { s: TreeState }) {
  const { pos, count, maxDepth } = useMemo(() => layoutBinary(s.nodes, s.root), [s.nodes, s.root]);
  const W = Math.max(6, count) * 12;
  const H = (maxDepth + 1) * 16 + 8;
  const P = (id: number) => {
    const p = pos.get(id)!;
    return { x: p.x * 12 + 6, y: p.y * 16 + 9 };
  };
  return (
    <div>
      {s.root === null ? (
        <div className="faint small">Empty tree</div>
      ) : (
        <svg className="viz-svg" viewBox={`0 0 ${W} ${H}`} style={{ maxHeight: 340 }} role="img" aria-label="Tree">
          {s.nodes.map((n) =>
            [n.left, n.right].map((c) =>
              c !== undefined && pos.has(c) && pos.has(n.id) ? <line key={`${n.id}-${c}`} x1={P(n.id).x} y1={P(n.id).y} x2={P(c).x} y2={P(c).y} stroke="rgba(200,210,255,0.35)" strokeWidth={0.6} /> : null,
            ),
          )}
          {s.nodes.map((n) =>
            pos.has(n.id) ? (
              <g key={n.id}>
                <circle className="node-circle" cx={P(n.id).x} cy={P(n.id).y} r={4.6} fill={n.tone ? TONE_VAR[n.tone] : 'rgba(255,255,255,0.12)'} fillOpacity={n.tone ? 0.8 : 1} stroke={n.tone ? TONE_VAR[n.tone] : 'rgba(255,255,255,0.4)'} strokeWidth={0.5} />
                <text x={P(n.id).x} y={P(n.id).y + 1.3} fontSize={n.label.length > 2 ? 2.8 : 3.6} fill="#fff" textAnchor="middle" fontWeight={700}>
                  {n.label}
                </text>
              </g>
            ) : null,
          )}
        </svg>
      )}
      <Aux aux={s.aux} />
    </div>
  );
}

function RecursionView({ s }: { s: RecursionState }) {
  const layout = useMemo(() => {
    const kids = new Map<number | null, number[]>();
    for (const n of s.nodes) kids.set(n.parent, [...(kids.get(n.parent) ?? []), n.id]);
    const pos = new Map<number, { x: number; y: number }>();
    let leaf = 0;
    let maxDepth = 0;
    const walk = (id: number, depth: number): number => {
      maxDepth = Math.max(maxDepth, depth);
      const ch = kids.get(id) ?? [];
      let x: number;
      if (!ch.length) x = leaf++;
      else {
        const xs = ch.map((c) => walk(c, depth + 1));
        x = (xs[0] + xs[xs.length - 1]) / 2;
      }
      pos.set(id, { x, y: depth });
      return x;
    };
    for (const r of kids.get(null) ?? []) walk(r, 0);
    return { pos, leaves: Math.max(1, leaf), maxDepth };
  }, [s.nodes]);
  const colW = 22;
  const W = layout.leaves * colW;
  const H = (layout.maxDepth + 1) * 20 + 6;
  const P = (id: number) => {
    const p = layout.pos.get(id)!;
    return { x: p.x * colW + colW / 2, y: p.y * 20 + 8 };
  };
  return (
    <div className="grid c2" style={{ gridTemplateColumns: 'minmax(0, 3fr) minmax(200px, 1fr)' }}>
      <div className="scroll-x">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: Math.max(300, W * 2.4), maxWidth: '100%', height: 'auto' }} role="img" aria-label="Recursion tree">
          {s.nodes.map((n) => (n.parent !== null && layout.pos.has(n.parent) ? <line key={`e${n.id}`} x1={P(n.parent).x} y1={P(n.parent).y} x2={P(n.id).x} y2={P(n.id).y} stroke={n.tone === 'warn' ? 'var(--tone-warn)' : 'rgba(200,210,255,0.3)'} strokeDasharray={n.tone === 'warn' ? '1.5 1' : undefined} strokeWidth={0.5} /> : null))}
          {s.nodes.map((n) => {
            const p = P(n.id);
            const isCur = n.id === s.current;
            const fill = isCur ? TONE_VAR.swap : n.tone ? TONE_VAR[n.tone] : 'rgba(255,255,255,0.1)';
            return (
              <g key={n.id}>
                <rect x={p.x - colW / 2 + 1} y={p.y - 4.2} width={colW - 2} height={8.4} rx={2.5} fill={fill} fillOpacity={isCur ? 0.9 : 0.55} stroke={isCur ? '#fff' : 'rgba(255,255,255,0.25)'} strokeWidth={isCur ? 0.6 : 0.3} />
                <text x={p.x} y={p.y + 1.1} fontSize={n.label.length > 9 ? 2.2 : 2.8} textAnchor="middle" fill="#fff" fontFamily="var(--mono)">
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="stack sm">
        <div className="aux-box">
          <div className="lbl">call stack (top last)</div>
          <div className="stack sm">
            {s.stack.length ? s.stack.map((f, i) => <span key={i} className="aux-item" style={{ marginLeft: i * 6 }}>{f}</span>) : <span className="faint tiny">empty</span>}
          </div>
        </div>
        <div className="aux-box">
          <div className="lbl">partial solution</div>
          <span className="aux-item">{s.partial}</span>
        </div>
        <div className="aux-box">
          <div className="lbl">
            results ({s.results.length}){s.pruned ? ` · pruned ${s.pruned}` : ''}
          </div>
          <div className="aux-items">{s.results.map((r, i) => <span key={i} className="aux-item">{r}</span>)}</div>
        </div>
      </div>
    </div>
  );
}

function ListView({ s }: { s: ListState }) {
  const n = s.values.length;
  const W = n * 16 + 6;
  const H = 34;
  const x = (i: number) => i * 16 + 8;
  return (
    <svg className="viz-svg" viewBox={`0 0 ${W} ${H}`} style={{ maxHeight: 240 }} role="img" aria-label="Linked list">
      <defs>
        <marker id="larrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="rgba(200,210,255,0.75)" />
        </marker>
      </defs>
      {s.next.map((to, i) => {
        if (to < 0) return null;
        if (to === i + 1) return <line key={i} x1={x(i) + 4.5} y1={12} x2={x(to) - 4.8} y2={12} stroke="rgba(200,210,255,0.6)" strokeWidth={0.5} markerEnd="url(#larrow)" />;
        const midX = (x(i) + x(to)) / 2;
        return <path key={i} d={`M ${x(i)} 16.5 Q ${midX} 32 ${x(to)} 16.8`} fill="none" stroke="var(--tone-warn)" strokeWidth={0.55} markerEnd="url(#larrow)" strokeDasharray="1.2 0.8" />;
      })}
      {s.values.map((v, i) => {
        const tone = s.tones?.[i];
        return (
          <g key={i}>
            <rect x={x(i) - 4.5} y={7.5} width={9} height={9} rx={2} fill={tone ? TONE_VAR[tone] : 'rgba(255,255,255,0.12)'} fillOpacity={tone ? 0.8 : 1} stroke="rgba(255,255,255,0.4)" strokeWidth={0.35} />
            <text x={x(i)} y={13.3} fontSize={3.6} fill="#fff" textAnchor="middle" fontWeight={700}>
              {v}
            </text>
          </g>
        );
      })}
      {s.pointers.map((p, k) => {
        const same = s.pointers.filter((q, j) => q.index === p.index && j < k).length;
        return (
          <text key={p.name} x={x(p.index)} y={4.6 - same * 3.4 + 0.5} fontSize={2.6} textAnchor="middle" fill={p.tone ? TONE_VAR[p.tone] : 'var(--accent)'} fontWeight={700}>
            {p.name}↓
          </text>
        );
      })}
    </svg>
  );
}

function TimelineView({ s }: { s: TimelineState }) {
  const lanes = s.lanes ?? ['lane'];
  const laneH = 9;
  const W = 100;
  const H = lanes.length * laneH + 10;
  const sx = (t: number) => 14 + (t / s.maxTime) * (W - 16);
  return (
    <div>
      <svg className="viz-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Timeline">
        {Array.from({ length: s.maxTime + 1 }, (_, t) => (
          <g key={t}>
            <line x1={sx(t)} y1={2} x2={sx(t)} y2={H - 6} stroke="rgba(255,255,255,0.06)" strokeWidth={0.2} />
            {(s.maxTime <= 24 || t % 2 === 0) && (
              <text x={sx(t)} y={H - 1.5} fontSize={2.2} fill="var(--faint)" textAnchor="middle">
                {t}
              </text>
            )}
          </g>
        ))}
        {lanes.map((l, i) => (
          <text key={l} x={1} y={i * laneH + 8} fontSize={2.5} fill="var(--muted)">
            {l.length > 9 ? `${l.slice(0, 8)}…` : l}
          </text>
        ))}
        {s.items.map((it) => {
          const lane = it.lane ?? 0;
          const fill = it.tone ? TONE_VAR[it.tone] : 'rgba(255,255,255,0.18)';
          return (
            <g key={it.id} style={{ transition: 'opacity 0.3s' }} opacity={it.tone === 'muted' ? 0.35 : 1}>
              <rect x={sx(it.start)} y={lane * laneH + 3} width={Math.max(0.6, sx(it.end) - sx(it.start))} height={laneH - 3} rx={1.4} fill={fill} fillOpacity={0.75} stroke="rgba(255,255,255,0.35)" strokeWidth={0.2} />
              {it.label && (
                <text x={(sx(it.start) + sx(it.end)) / 2} y={lane * laneH + 7.6} fontSize={2.4} fill="#fff" textAnchor="middle" fontWeight={700}>
                  {it.label}
                </text>
              )}
            </g>
          );
        })}
        {s.marker !== undefined && <line x1={sx(s.marker)} y1={1} x2={sx(s.marker)} y2={H - 5} stroke="var(--tone-compare)" strokeWidth={0.4} strokeDasharray="1 0.6" />}
      </svg>
      <Aux aux={s.aux} />
    </div>
  );
}

function VizRendererImpl({ state }: { state: VizState | undefined }) {
  if (!state) return <div className="faint small">Nothing to show yet.</div>;
  switch (state.kind) {
    case 'array':
      return <ArrayView s={state} />;
    case 'table':
      return <TableView s={state} />;
    case 'grid':
      return <GridView s={state} />;
    case 'graph':
      return <GraphView s={state} />;
    case 'tree':
      return <TreeView s={state} />;
    case 'recursion':
      return <RecursionView s={state} />;
    case 'list':
      return <ListView s={state} />;
    case 'timeline':
      return <TimelineView s={state} />;
  }
}

export const VizRenderer = memo(VizRendererImpl);

export function Legend({ items }: { items: [Tone | string, string][] }) {
  return (
    <div className="legend">
      {items.map(([tone, label]) => (
        <span key={label}>
          <i style={{ background: TONE_VAR[tone as Tone] ?? tone }} />
          {label}
        </span>
      ))}
    </div>
  );
}
