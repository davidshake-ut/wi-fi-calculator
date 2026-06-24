'use client';

import { useRef, useState } from 'react';
import {
  Plus,
  Circle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Trash2,
  Milestone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---- Inline editable text ----
function InlineEdit({ value, onSave, className, placeholder = 'Click to edit…' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        className={cn('w-full rounded border border-blue-400 bg-white px-2 py-0.5 text-sm outline-none ring-2 ring-blue-500/20', className)}
      />
    );
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      className={cn('cursor-text rounded px-0.5 hover:bg-slate-100', className)}
      title="Click to edit"
    >
      {value || <span className="text-slate-400">{placeholder}</span>}
    </span>
  );
}

// ---- Add item inline form ----
function AddInline({ placeholder, onAdd, className }) {
  const [active, setActive] = useState(false);
  const [text, setText] = useState('');

  const commit = async () => {
    const trimmed = text.trim();
    if (trimmed) await onAdd(trimmed);
    setText('');
    setActive(false);
  };

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className={cn(
          'flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors',
          className
        )}
      >
        <Plus size={13} /> {placeholder}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setText(''); setActive(false); }
        }}
        placeholder={placeholder}
        className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  );
}

// ---- Single task row ----
function TaskRow({ task, onToggle, onRename, onDelete }) {
  const done = task.status === 'done';

  return (
    <div className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
      <button
        onClick={() => onToggle(task)}
        className={cn(
          'shrink-0 transition-colors',
          done ? 'text-emerald-500 hover:text-emerald-700' : 'text-slate-300 hover:text-slate-500'
        )}
        title={done ? 'Mark as to-do' : 'Mark as done'}
      >
        {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      </button>

      <div className="flex-1 min-w-0">
        <InlineEdit
          value={task.title}
          onSave={(v) => onRename(task.id, v)}
          className={cn('text-sm', done && 'line-through text-slate-400')}
        />
        {task.estimated_hours != null && (
          <span className="ml-2 text-xs text-slate-400">{task.estimated_hours}h est.</span>
        )}
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="shrink-0 rounded p-1 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
        title="Delete task"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ---- Milestone block ----
function MilestoneBlock({ milestone, tasks, onCreate, onToggleTask, onRenameTask, onDeleteTask, onRenameMilestone, onDeleteMilestone }) {
  const [open, setOpen] = useState(true);
  const done = tasks.filter((t) => t.status === 'done').length;
  const total = tasks.length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 text-slate-400 hover:text-slate-600"
        >
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <Milestone size={15} className="shrink-0 text-slate-400" />

        <InlineEdit
          value={milestone.name}
          onSave={(v) => onRenameMilestone(milestone.id, v)}
          className="flex-1 text-sm font-semibold text-slate-800"
        />

        {total > 0 && (
          <span className="text-xs text-slate-400">
            {done}/{total}
          </span>
        )}

        {milestone.due_date && (
          <span className="text-xs text-slate-400">
            Due {new Date(milestone.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}

        <button
          onClick={() => onDeleteMilestone(milestone.id)}
          className="shrink-0 rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Delete milestone"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-3 pt-1 space-y-0.5">
          {tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onToggle={onToggleTask}
              onRename={onRenameTask}
              onDelete={onDeleteTask}
            />
          ))}
          <div className="pt-1">
            <AddInline
              placeholder="Add task…"
              onAdd={(title) => onCreate({ title, milestone_id: milestone.id })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Main export ----
export default function TaskSection({
  milestones,
  tasks,
  onCreateMilestone,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateMilestone,
  onDeleteMilestone,
}) {
  const ungrouped = tasks.filter((t) => !t.milestone_id);

  const toggleTask = (task) =>
    onUpdateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' });

  const renameTask = (id, title) => onUpdateTask(id, { title });

  return (
    <div className="space-y-3">
      {milestones.map((ms) => (
        <MilestoneBlock
          key={ms.id}
          milestone={ms}
          tasks={tasks.filter((t) => t.milestone_id === ms.id)}
          onCreate={onCreateTask}
          onToggleTask={toggleTask}
          onRenameTask={renameTask}
          onDeleteTask={onDeleteTask}
          onRenameMilestone={(id, name) => onUpdateMilestone(id, { name })}
          onDeleteMilestone={onDeleteMilestone}
        />
      ))}

      {/* Ungrouped tasks */}
      {(ungrouped.length > 0 || milestones.length === 0) && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 pb-3 pt-3 space-y-0.5">
          {milestones.length > 0 && (
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              Unassigned
            </p>
          )}
          {ungrouped.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onToggle={toggleTask}
              onRename={renameTask}
              onDelete={onDeleteTask}
            />
          ))}
          <div className="pt-1">
            <AddInline
              placeholder="Add task…"
              onAdd={(title) => onCreateTask({ title, milestone_id: null })}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <AddInline
          placeholder="Add milestone…"
          onAdd={(name) => onCreateMilestone({ name })}
          className="text-sm"
        />
      </div>
    </div>
  );
}
