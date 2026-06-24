import { cn } from '@/lib/utils';

export const STATUS_CONFIG = {
  planning:  { label: 'Planning',   className: 'bg-amber-50  text-amber-700  border-amber-200'  },
  active:    { label: 'Active',     className: 'bg-blue-50   text-blue-700   border-blue-200'   },
  on_hold:   { label: 'On Hold',    className: 'bg-slate-100 text-slate-600  border-slate-200'  },
  complete:  { label: 'Complete',   className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled',  className: 'bg-red-50    text-red-600    border-red-200'    },
};

export const TASK_STATUS_CONFIG = {
  todo:        { label: 'To Do',       className: 'bg-slate-100 text-slate-500' },
  in_progress: { label: 'In Progress', className: 'bg-blue-50   text-blue-600'  },
  done:        { label: 'Done',        className: 'bg-emerald-50 text-emerald-600' },
};

export default function ProjectStatusBadge({ status, className }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-slate-100 text-slate-500' };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        cfg.className,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}
