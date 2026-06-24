import { cn } from '@/lib/utils';

export const PRIORITY_CONFIG = {
  low:      { label: 'Low',      className: 'bg-slate-100 text-slate-500 border-slate-200' },
  medium:   { label: 'Medium',   className: 'bg-amber-50 text-amber-700 border-amber-200' },
  high:     { label: 'High',     className: 'bg-orange-50 text-orange-700 border-orange-200' },
  critical: { label: 'Critical', className: 'bg-red-50 text-red-700 border-red-200' },
};

export const STATUS_CONFIG = {
  open:        { label: 'Open',        className: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'In Progress', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  waiting:     { label: 'Waiting',     className: 'bg-amber-50 text-amber-700 border-amber-200' },
  resolved:    { label: 'Resolved',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed:      { label: 'Closed',      className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export default function TicketPriorityBadge({ priority, className }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', cfg.className, className)}>
      {cfg.label}
    </span>
  );
}

export function TicketStatusBadge({ status, className }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', cfg.className, className)}>
      {cfg.label}
    </span>
  );
}
