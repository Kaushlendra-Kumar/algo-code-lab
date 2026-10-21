import { Link } from 'react-router-dom';
import { LAB_META } from './labMeta';
import type { VizId } from '../types/content';
import { useProgress } from '../lib/progress/context';

export default function LabHub() {
  const { state } = useProgress();
  const groups = [...new Set(Object.values(LAB_META).map((m) => m.group))];
  return (
    <div className="stack lg">
      <div>
        <div className="eyebrow">Visualization lab</div>
        <h1>See algorithms think</h1>
        <p className="lead">Every lab is step-driven: algorithms produce a sequence of states and you control playback — play, pause, step back and forth, change the speed or the input. Labs marked “synced C++” highlight the executing line of a verified C++ program next to the visual state.</p>
        <p className="small muted">Keyboard: <span className="kbd">Space</span> play/pause · <span className="kbd">←</span> <span className="kbd">→</span> step · <span className="kbd">Home</span> reset (click inside a lab first).</p>
      </div>
      {groups.map((g) => (
        <section key={g} className="stack">
          <h2>{g}</h2>
          <div className="grid auto">
            {(Object.entries(LAB_META) as [VizId, (typeof LAB_META)[VizId]][])
              .filter(([, m]) => m.group === g)
              .map(([id, m]) => (
                <Link key={id} to={`/lab/${id}`} className="glass pad interactive stack sm" style={{ textDecoration: 'none' }}>
                  <div className="row between nowrap">
                    <span style={{ fontSize: 26 }} aria-hidden>
                      {m.icon}
                    </span>
                    {state.labsVisited.includes(id) && <span className="chip good">visited</span>}
                  </div>
                  <h3>{m.title}</h3>
                  <span className="small muted">{m.blurb}</span>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
