'use client';

import { useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';

const TECH_COLORS = {
  'Wi-Fi':            { bar: 'bg-blue-500',    header: 'bg-blue-50  text-blue-700'   },
  'Cameras':          { bar: 'bg-orange-500',  header: 'bg-orange-50 text-orange-700' },
  'Access Control':   { bar: 'bg-purple-500',  header: 'bg-purple-50 text-purple-700' },
  'Cellular':         { bar: 'bg-green-500',   header: 'bg-green-50  text-green-700'  },
  'Networking':       { bar: 'bg-indigo-500',  header: 'bg-indigo-50 text-indigo-700' },
  'Cabling':          { bar: 'bg-amber-500',   header: 'bg-amber-50  text-amber-700'  },
  'AV':               { bar: 'bg-rose-500',    header: 'bg-rose-50   text-rose-700'   },
};
const DEFAULT_COLORS = { bar: 'bg-slate-400', header: 'bg-slate-100 text-slate-600' };

function getColors(techName) {
  return TECH_COLORS[techName] ?? DEFAULT_COLORS;
}

const DAY_MS = 1000 * 60 * 60 * 24;
const LABEL_W = 224; // px, left-panel width
const DAY_PX  = 8;   // px per day in the date area

function dayOffset(date, minDate) {
  return Math.round((new Date(date + 'T00:00:00') - minDate) / DAY_MS);
}

function MonthHeader({ minDate, totalDays }) {
  const marks = [];
  const d = new Date(minDate);
  d.setDate(1); // first of month
  while (dayOffset(d.toISOString().slice(0, 10), minDate) <= totalDays) {
    const off = Math.max(0, dayOffset(d.toISOString().slice(0, 10), minDate));
    marks.push({
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      left: off * DAY_PX,
    });
    d.setMonth(d.getMonth() + 1);
  }
  return (
    <div className="relative h-8 border-b border-slate-200" style={{ width: totalDays * DAY_PX }}>
      {marks.map((m, i) => (
        <div
          key={i}
          className="absolute top-0 flex h-full items-center border-l border-slate-200 pl-1.5 text-[10px] font-medium text-slate-400"
          style={{ left: m.left }}
        >
          {m.label}
        </div>
      ))}
    </div>
  );
}

function GridLines({ minDate, totalDays, rowCount }) {
  const lines = [];
  const d = new Date(minDate);
  d.setDate(1);
  while (dayOffset(d.toISOString().slice(0, 10), minDate) <= totalDays) {
    lines.push(dayOffset(d.toISOString().slice(0, 10), minDate));
    d.setMonth(d.getMonth() + 1);
  }
  return (
    <>
      {lines.map((off, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 w-px bg-slate-100"
          style={{ left: off * DAY_PX }}
        />
      ))}
    </>
  );
}

function TodayLine({ minDate, totalDays }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const off = (today - minDate) / DAY_MS;
  if (off < 0 || off > totalDays) return null;
  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-400 opacity-70 z-10"
      style={{ left: off * DAY_PX }}
      title={`Today: ${today.toLocaleDateString()}`}
    />
  );
}

const ROW_H = 36;

function Bar({ startDate, dueDate, minDate, totalDays, colorClass, label, isMilestone }) {
  const hasStart = Boolean(startDate);
  const hasEnd   = Boolean(dueDate);
  if (!hasStart && !hasEnd) return null;

  const s = hasStart ? dayOffset(startDate, minDate) : dayOffset(dueDate, minDate);
  const e = hasEnd   ? dayOffset(dueDate,  minDate) : s;
  const left  = Math.max(0, s) * DAY_PX;
  const width = Math.max(DAY_PX, (Math.max(0, e) - Math.max(0, s)) * DAY_PX + (hasStart && hasEnd ? 0 : 0));
  const isPoint = !hasStart || !hasEnd || s === e;

  return (
    <div
      className={cn(
        'absolute top-1/2 -translate-y-1/2 rounded-full transition-opacity',
        colorClass,
        isMilestone ? 'h-4 opacity-90' : 'h-2.5 opacity-80',
        isPoint && 'w-3 rounded-full'
      )}
      style={{ left, width: isPoint ? undefined : Math.max(DAY_PX, width) }}
      title={`${label}${startDate ? `\nStart: ${startDate}` : ''}${dueDate ? `\nDue: ${dueDate}` : ''}`}
    />
  );
}

// ── GanttChart ────────────────────────────────────────────────────────────────
export default function GanttChart({ technologies = [], milestones = [], tasks = [] }) {
  const scrollRef = useRef(null);

  const { minDate, maxDate, totalDays } = useMemo(() => {
    const dates = [
      ...milestones.filter((m) => m.start_date).map((m) => new Date(m.start_date + 'T00:00:00')),
      ...milestones.filter((m) => m.due_date).map((m) => new Date(m.due_date + 'T00:00:00')),
      ...tasks.filter((t) => t.start_date).map((t) => new Date(t.start_date + 'T00:00:00')),
      ...tasks.filter((t) => t.due_date).map((t) => new Date(t.due_date + 'T00:00:00')),
    ];
    if (dates.length === 0) return { minDate: null, maxDate: null, totalDays: 0 };
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    min.setDate(min.getDate() - 7);
    max.setDate(max.getDate() + 14);
    min.setHours(0, 0, 0, 0);
    max.setHours(0, 0, 0, 0);
    return { minDate: min, maxDate: max, totalDays: Math.ceil((max - min) / DAY_MS) };
  }, [milestones, tasks]);

  if (!minDate) {
    return (
      <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 text-center">
        <p className="text-sm font-medium text-slate-500">No dates set yet</p>
        <p className="max-w-xs text-xs text-slate-400">
          Add start and due dates to tasks or milestones in the Tasks tab to see the Gantt chart.
        </p>
      </div>
    );
  }

  // Build rows
  const rows = [];

  if (technologies.length === 0) {
    for (const m of milestones) {
      rows.push({ kind: 'milestone', item: m, depth: 0, colors: DEFAULT_COLORS });
      for (const t of tasks.filter((t) => t.milestone_id === m.id)) {
        rows.push({ kind: 'task', item: t, depth: 1, colors: DEFAULT_COLORS });
      }
    }
    for (const t of tasks.filter((t) => !t.milestone_id)) {
      rows.push({ kind: 'task', item: t, depth: 0, colors: DEFAULT_COLORS });
    }
  } else {
    for (const tech of technologies) {
      const colors = getColors(tech.technology);
      rows.push({ kind: 'section', item: tech, depth: 0, colors });
      const techMs = milestones.filter((m) => m.technology_id === tech.id);
      for (const m of techMs) {
        rows.push({ kind: 'milestone', item: m, depth: 1, colors });
        for (const t of tasks.filter((t) => t.milestone_id === m.id)) {
          rows.push({ kind: 'task', item: t, depth: 2, colors });
        }
      }
      // Tasks assigned to this section but no milestone
      for (const t of tasks.filter((t) => t.technology_id === tech.id && !t.milestone_id)) {
        rows.push({ kind: 'task', item: t, depth: 1, colors });
      }
    }
    // Unassigned
    const unassMs  = milestones.filter((m) => !m.technology_id);
    const unassTasks = tasks.filter((t) => !t.technology_id && !t.milestone_id);
    if (unassMs.length > 0 || unassTasks.length > 0) {
      rows.push({ kind: 'section', item: { technology: 'Unassigned' }, depth: 0, colors: DEFAULT_COLORS });
      for (const m of unassMs) {
        rows.push({ kind: 'milestone', item: m, depth: 1, colors: DEFAULT_COLORS });
        for (const t of tasks.filter((t) => t.milestone_id === m.id)) {
          rows.push({ kind: 'task', item: t, depth: 2, colors: DEFAULT_COLORS });
        }
      }
      for (const t of unassTasks) {
        rows.push({ kind: 'task', item: t, depth: 1, colors: DEFAULT_COLORS });
      }
    }
  }

  const chartW = Math.max(600, totalDays * DAY_PX);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Fixed header row */}
      <div className="flex border-b border-slate-200 bg-white">
        {/* Left panel header */}
        <div
          className="shrink-0 border-r border-slate-200 px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400"
          style={{ width: LABEL_W }}
        >
          Item
        </div>
        {/* Scrollable date header */}
        <div className="overflow-hidden flex-1">
          <div
            ref={scrollRef}
            className="overflow-x-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            <MonthHeader minDate={minDate} totalDays={totalDays} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex">
        {/* Left panel labels */}
        <div className="shrink-0 border-r border-slate-200" style={{ width: LABEL_W }}>
          {rows.map((row, i) => {
            const isSection = row.kind === 'section';
            return (
              <div
                key={i}
                className={cn(
                  'flex items-center border-b border-slate-50 last:border-0 px-3',
                  isSection && row.colors.header
                )}
                style={{ height: ROW_H, paddingLeft: 12 + row.depth * 14 }}
              >
                {isSection && (
                  <span className="truncate text-xs font-semibold">{row.item.technology}</span>
                )}
                {row.kind === 'milestone' && (
                  <span className="truncate text-xs font-medium text-slate-600">
                    ◆ {row.item.name}
                  </span>
                )}
                {row.kind === 'task' && (
                  <span className="truncate text-xs text-slate-500">• {row.item.title}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Scrollable date area */}
        <div className="flex-1 overflow-x-auto">
          <div
            className="relative"
            style={{ width: chartW, height: rows.length * ROW_H }}
          >
            {/* Grid lines */}
            <GridLines minDate={minDate} totalDays={totalDays} rowCount={rows.length} />

            {/* Today line */}
            <TodayLine minDate={minDate} totalDays={totalDays} />

            {/* Row backgrounds + bars */}
            {rows.map((row, i) => {
              const isSection = row.kind === 'section';
              const top = i * ROW_H;
              return (
                <div
                  key={i}
                  className={cn(
                    'absolute left-0 right-0 border-b border-slate-50',
                    isSection && 'opacity-30 ' + row.colors.header
                  )}
                  style={{ top, height: ROW_H }}
                >
                  {/* Bar */}
                  {!isSection && (
                    <Bar
                      startDate={row.item.start_date}
                      dueDate={row.item.due_date}
                      minDate={minDate}
                      totalDays={totalDays}
                      colorClass={row.colors.bar}
                      label={row.item.name ?? row.item.title ?? ''}
                      isMilestone={row.kind === 'milestone'}
                    />
                  )}
                  {isSection && row.item.id && (() => {
                    // Draw a thin band across the section's full date span
                    const sMs = milestones.filter((m) => m.technology_id === row.item.id);
                    const sDates = [
                      ...sMs.filter((m) => m.start_date).map((m) => m.start_date),
                      ...sMs.filter((m) => m.due_date).map((m) => m.due_date),
                    ];
                    if (sDates.length < 2) return null;
                    return (
                      <Bar
                        startDate={sDates.sort()[0]}
                        dueDate={sDates.sort().at(-1)}
                        minDate={minDate}
                        totalDays={totalDays}
                        colorClass={row.colors.bar}
                        label={row.item.technology}
                        isMilestone={false}
                      />
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
