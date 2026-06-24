'use client';

import { useMemo, useRef, useState } from 'react';
import { Palette, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PALETTE, PALETTE_MAP } from '@/hooks/useRoleColors';

// ── Tech section colors (unchanged) ─────────────────────────────────────────
const TECH_COLORS = {
  'Wi-Fi':          { bar: 'bg-blue-400',    header: 'bg-blue-50 text-blue-700'     },
  'Cameras':        { bar: 'bg-orange-400',  header: 'bg-orange-50 text-orange-700' },
  'Access Control': { bar: 'bg-purple-400',  header: 'bg-purple-50 text-purple-700' },
  'Cellular':       { bar: 'bg-green-400',   header: 'bg-green-50 text-green-700'   },
  'Networking':     { bar: 'bg-indigo-400',  header: 'bg-indigo-50 text-indigo-700' },
  'Cabling':        { bar: 'bg-amber-400',   header: 'bg-amber-50 text-amber-700'   },
  'AV':             { bar: 'bg-rose-400',    header: 'bg-rose-50 text-rose-700'     },
};
const DEFAULT_SECTION = { bar: 'bg-slate-400', header: 'bg-slate-100 text-slate-600' };

// ── Layout constants ──────────────────────────────────────────────────────────
const DAY_MS  = 86_400_000;
const LABEL_W = 256;   // px — left panel
const DAY_PX  = 8;     // px per day
const ROW_H   = 52;    // px — milestone/task rows (tall enough for name + dates)
const SEC_H   = 32;    // px — section header rows

// ── Helpers ───────────────────────────────────────────────────────────────────
function dayOff(dateStr, minDate) {
  return Math.round((new Date(dateStr + 'T00:00:00') - minDate) / DAY_MS);
}

function fmtShort(iso) {
  if (!iso) return null;
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── GanttDateField — click-to-edit date chip ─────────────────────────────────
function GanttDateField({ value, onChange, placeholder }) {
  const [editing, setEditing] = useState(false);
  if (!onChange) {
    return (
      <span className={cn('text-[10px]', value ? 'text-slate-500' : 'text-slate-300')}>
        {value ? fmtShort(value) : placeholder}
      </span>
    );
  }
  if (editing) {
    return (
      <input
        type="date"
        defaultValue={value ?? ''}
        autoFocus
        onBlur={(e) => { onChange(e.target.value || null); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }}
        className="w-28 rounded border border-blue-300 bg-white px-1 py-0 text-[10px] outline-none focus:ring-1 focus:ring-blue-400"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        'rounded px-1 py-0.5 text-[10px] transition-colors hover:bg-white/70',
        value ? 'text-slate-500' : 'text-slate-300 hover:text-slate-400'
      )}
      title={onChange ? 'Click to edit' : undefined}
    >
      {value ? fmtShort(value) : placeholder}
    </button>
  );
}

// ── MonthHeader ───────────────────────────────────────────────────────────────
function MonthHeader({ minDate, totalDays }) {
  const marks = [];
  const d = new Date(minDate);
  d.setDate(1);
  while (dayOff(d.toISOString().slice(0, 10), minDate) <= totalDays) {
    marks.push({
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      left: Math.max(0, dayOff(d.toISOString().slice(0, 10), minDate)) * DAY_PX,
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

// ── MonthGridLines ────────────────────────────────────────────────────────────
function MonthGridLines({ minDate, totalDays }) {
  const offs = [];
  const d = new Date(minDate);
  d.setDate(1);
  while (dayOff(d.toISOString().slice(0, 10), minDate) <= totalDays) {
    offs.push(dayOff(d.toISOString().slice(0, 10), minDate));
    d.setMonth(d.getMonth() + 1);
  }
  return (
    <>
      {offs.map((off, i) => (
        <div key={i} className="absolute top-0 bottom-0 w-px bg-slate-100" style={{ left: off * DAY_PX }} />
      ))}
    </>
  );
}

// ── TodayLine ─────────────────────────────────────────────────────────────────
function TodayLine({ minDate, totalDays }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const off = (today - minDate) / DAY_MS;
  if (off < 0 || off > totalDays) return null;
  return (
    <div
      className="absolute top-0 bottom-0 z-10 w-0.5 bg-red-400 opacity-70"
      style={{ left: off * DAY_PX }}
      title={`Today: ${today.toLocaleDateString()}`}
    />
  );
}

// ── Bar ───────────────────────────────────────────────────────────────────────
function Bar({ startDate, dueDate, minDate, barClass, label, thick }) {
  const hasS = Boolean(startDate);
  const hasE = Boolean(dueDate);
  if (!hasS && !hasE) return null;

  const s = hasS ? dayOff(startDate, minDate) : dayOff(dueDate, minDate);
  const e = hasE ? dayOff(dueDate, minDate)   : s;
  const left  = Math.max(0, s) * DAY_PX;
  const span  = Math.max(0, e - Math.max(0, s));
  const width = Math.max(DAY_PX, span * DAY_PX);
  const isPoint = !hasS || !hasE || s === e;

  return (
    <div
      className={cn(
        'absolute top-1/2 -translate-y-1/2 rounded-full opacity-85',
        barClass,
        thick ? 'h-4' : 'h-3',
        isPoint && 'w-3'
      )}
      style={{ left, width: isPoint ? undefined : width }}
      title={`${label}${startDate ? `\nStart: ${startDate}` : ''}${dueDate ? `\nDue: ${dueDate}` : ''}`}
    />
  );
}

// ── RoleColorEditor ───────────────────────────────────────────────────────────
function RoleColorEditor({ roles, getRoleColor, setRoleColor, onClose }) {
  if (roles.length === 0) {
    return (
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-400">No roles assigned to tasks yet. Add a role in the Tasks tab.</p>
      </div>
    );
  }
  return (
    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Role Colors</p>
        <button type="button" onClick={onClose} className="rounded p-0.5 text-slate-400 hover:text-slate-600">
          <X size={13} />
        </button>
      </div>
      <div className="space-y-2">
        {roles.map((role) => {
          const current = getRoleColor(role);
          const pal = PALETTE_MAP[current] ?? PALETTE_MAP.slate;
          return (
            <div key={role} className="flex items-center gap-3">
              <span className={cn('w-28 shrink-0 truncate rounded-full px-2 py-0.5 text-center text-[10px] font-medium', pal.badge)}>
                {role}
              </span>
              <div className="flex flex-wrap gap-1">
                {PALETTE.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    title={p.name}
                    onClick={() => setRoleColor(role, p.name)}
                    style={{ backgroundColor: p.hex }}
                    className={cn(
                      'h-4 w-4 rounded-full transition-transform hover:scale-110',
                      current === p.name && 'ring-2 ring-offset-1 ring-slate-500 scale-110'
                    )}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── GanttChart ────────────────────────────────────────────────────────────────
export default function GanttChart({
  technologies = [],
  milestones   = [],
  tasks        = [],
  onUpdateMilestone,
  onUpdateTask,
  getRoleColor,
  setRoleColor,
}) {
  const [showColors, setShowColors] = useState(false);
  const scrollRef = useRef(null);

  // Unique roles present in tasks
  const uniqueRoles = useMemo(
    () => [...new Set(tasks.filter((t) => t.role).map((t) => t.role))].sort(),
    [tasks]
  );

  // Date range
  const { minDate, totalDays } = useMemo(() => {
    const dates = [
      ...milestones.flatMap((m) => [m.start_date, m.due_date]),
      ...tasks.flatMap((t) => [t.start_date, t.due_date]),
    ].filter(Boolean).map((d) => new Date(d + 'T00:00:00'));

    if (dates.length === 0) return { minDate: null, totalDays: 0 };

    const minTs = Math.min(...dates.map((d) => d.getTime()));
    const maxTs = Math.max(...dates.map((d) => d.getTime()));
    const min = new Date(minTs - 7 * DAY_MS);
    const max = new Date(maxTs + 14 * DAY_MS);
    min.setHours(0, 0, 0, 0);
    max.setHours(0, 0, 0, 0);
    return { minDate: min, totalDays: Math.ceil((max - min) / DAY_MS) };
  }, [milestones, tasks]);

  // Build row list
  const rows = useMemo(() => {
    const list = [];

    const addMilestoneAndTasks = (m, depth, sectionColors) => {
      list.push({ kind: 'milestone', item: m, depth, sectionColors });
      tasks
        .filter((t) => t.milestone_id === m.id)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .forEach((t) => list.push({ kind: 'task', item: t, depth: depth + 1, sectionColors }));
    };

    if (technologies.length === 0) {
      milestones.forEach((m) => addMilestoneAndTasks(m, 0, DEFAULT_SECTION));
      tasks.filter((t) => !t.milestone_id).forEach((t) =>
        list.push({ kind: 'task', item: t, depth: 0, sectionColors: DEFAULT_SECTION })
      );
    } else {
      technologies.forEach((tech) => {
        const sc = TECH_COLORS[tech.technology] ?? DEFAULT_SECTION;
        list.push({ kind: 'section', item: tech, depth: 0, sectionColors: sc });
        milestones.filter((m) => m.technology_id === tech.id).forEach((m) =>
          addMilestoneAndTasks(m, 1, sc)
        );
        tasks.filter((t) => t.technology_id === tech.id && !t.milestone_id).forEach((t) =>
          list.push({ kind: 'task', item: t, depth: 1, sectionColors: sc })
        );
      });

      const unassMs    = milestones.filter((m) => !m.technology_id);
      const unassTasks = tasks.filter((t) => !t.technology_id && !t.milestone_id);
      if (unassMs.length > 0 || unassTasks.length > 0) {
        list.push({ kind: 'section', item: { technology: 'Unassigned' }, depth: 0, sectionColors: DEFAULT_SECTION });
        unassMs.forEach((m) => addMilestoneAndTasks(m, 1, DEFAULT_SECTION));
        unassTasks.forEach((t) => list.push({ kind: 'task', item: t, depth: 1, sectionColors: DEFAULT_SECTION }));
      }
    }
    return list;
  }, [technologies, milestones, tasks]);

  // Per-row heights and cumulative tops
  const rowMeta = useMemo(() => {
    let top = 0;
    return rows.map((row) => {
      const h = row.kind === 'section' ? SEC_H : ROW_H;
      const result = { top, h };
      top += h;
      return result;
    });
  }, [rows]);

  const totalH = rowMeta.reduce((s, m) => s + m.h, 0);
  const chartW = Math.max(600, totalDays * DAY_PX);

  if (!minDate) {
    return (
      <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 text-center">
        <p className="text-sm font-medium text-slate-500">No dates set yet</p>
        <p className="max-w-xs text-xs text-slate-400">
          Click the date fields on tasks or milestones in the Tasks tab to add start and due dates.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <p className="text-xs font-medium text-slate-500">Gantt Chart</p>
        <button
          type="button"
          onClick={() => setShowColors((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors',
            showColors
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
          )}
        >
          <Palette size={12} /> Role Colors
        </button>
      </div>

      {/* Role color editor */}
      {showColors && (
        <RoleColorEditor
          roles={uniqueRoles}
          getRoleColor={getRoleColor ?? (() => 'slate')}
          setRoleColor={setRoleColor ?? (() => {})}
          onClose={() => setShowColors(false)}
        />
      )}

      {/* Header row */}
      <div className="flex border-b border-slate-200 bg-white">
        <div
          className="shrink-0 border-r border-slate-200 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400"
          style={{ width: LABEL_W }}
        >
          Item / Dates
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }} ref={scrollRef}>
            <MonthHeader minDate={minDate} totalDays={totalDays} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex">

        {/* Left: labels + date fields */}
        <div className="shrink-0 border-r border-slate-200" style={{ width: LABEL_W }}>
          {rows.map((row, i) => {
            const { h } = rowMeta[i];
            const isSection = row.kind === 'section';
            const isMilestone = row.kind === 'milestone';
            const isTask = row.kind === 'task';
            const pl = 12 + row.depth * 14;

            if (isSection) {
              return (
                <div
                  key={i}
                  className={cn('flex items-center border-b border-slate-100 text-xs font-semibold', row.sectionColors.header)}
                  style={{ height: h, paddingLeft: pl, paddingRight: 8 }}
                >
                  <span className="truncate">{row.item.technology}</span>
                </div>
              );
            }

            const onUpdate = isMilestone
              ? (field, val) => onUpdateMilestone?.(row.item.id, { [field]: val })
              : (field, val) => onUpdateTask?.(row.item.id, { [field]: val });

            return (
              <div
                key={i}
                className="flex flex-col justify-center border-b border-slate-50 last:border-0"
                style={{ height: h, paddingLeft: pl, paddingRight: 8 }}
              >
                <span className={cn('truncate text-xs', isMilestone ? 'font-semibold text-slate-700' : 'text-slate-500')}>
                  {isMilestone ? `◆ ${row.item.name}` : `• ${row.item.title}`}
                </span>
                <div className="mt-0.5 flex items-center gap-1">
                  <GanttDateField
                    value={row.item.start_date}
                    onChange={(v) => onUpdate('start_date', v)}
                    placeholder="Start"
                  />
                  <span className="text-[10px] text-slate-200">–</span>
                  <GanttDateField
                    value={row.item.due_date}
                    onChange={(v) => onUpdate('due_date', v)}
                    placeholder="Due"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: scrollable date bars */}
        <div className="flex-1 overflow-x-auto">
          <div className="relative" style={{ width: chartW, height: totalH }}>

            <MonthGridLines minDate={minDate} totalDays={totalDays} />
            <TodayLine minDate={minDate} totalDays={totalDays} />

            {rows.map((row, i) => {
              const { top, h } = rowMeta[i];
              const isSection = row.kind === 'section';

              // Determine bar color
              let barClass = row.sectionColors.bar;
              if (row.kind === 'task' && getRoleColor) {
                const colorName = getRoleColor(row.item.role ?? '');
                barClass = (PALETTE_MAP[colorName] ?? PALETTE_MAP.slate).bar;
              }

              // Section span bar (across all its milestones' dates)
              let sectionSpan = null;
              if (isSection && row.item.id) {
                const sMs = milestones.filter((m) => m.technology_id === row.item.id);
                const ds = [
                  ...sMs.filter((m) => m.start_date).map((m) => m.start_date),
                  ...sMs.filter((m) => m.due_date).map((m) => m.due_date),
                ].sort();
                if (ds.length >= 2) {
                  sectionSpan = { startDate: ds[0], dueDate: ds.at(-1) };
                }
              }

              return (
                <div
                  key={i}
                  className={cn(
                    'absolute left-0 right-0 border-b border-slate-50',
                    isSection && 'opacity-20 ' + row.sectionColors.header
                  )}
                  style={{ top, height: h }}
                >
                  {!isSection && (
                    <Bar
                      startDate={row.item.start_date}
                      dueDate={row.item.due_date}
                      minDate={minDate}
                      barClass={barClass}
                      label={row.item.name ?? row.item.title ?? ''}
                      thick={row.kind === 'milestone'}
                    />
                  )}
                  {isSection && sectionSpan && (
                    <Bar
                      startDate={sectionSpan.startDate}
                      dueDate={sectionSpan.dueDate}
                      minDate={minDate}
                      barClass={barClass}
                      label={row.item.technology ?? ''}
                      thick={false}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
