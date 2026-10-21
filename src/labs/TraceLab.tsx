import { useState, type ReactNode } from 'react';
import type { TraceId } from '../types/content';
import { TraceViewer } from '../components/TraceViewer';
import { Glass, Tabs } from '../components/ui';
import { LabHeader } from './common';
import { Legend } from '../components/viz/VizRenderer';

/** A lab built from one or more synced C++ traces. */
export function TraceLab({ title, icon, intro, traces, notes, extra }: { title: string; icon: string; intro: ReactNode; traces: { id: TraceId; label: string }[]; notes?: Partial<Record<TraceId, ReactNode>>; extra?: ReactNode }) {
  const [id, setId] = useState<TraceId>(traces[0].id);
  return (
    <div className="stack lg">
      <LabHeader title={title} icon={icon}>
        {intro}
      </LabHeader>
      <Glass className="pad stack">
        <div className="row between">
          {traces.length > 1 ? <Tabs value={id} onChange={setId} label="Algorithm" items={traces.map((t) => ({ id: t.id, label: t.label }))} /> : <strong>{traces[0].label}</strong>}
          <Legend items={[['active', 'active / left'], ['warn', 'right / leaving'], ['compare', 'compared'], ['found', 'result']]} />
        </div>
        {notes?.[id] && <div className="feedback info small">{notes[id]}</div>}
      </Glass>
      <Glass className="pad-lg">
        <TraceViewer key={id} id={id} editable />
      </Glass>
      {extra}
    </div>
  );
}
