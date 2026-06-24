'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Building2,
  Loader2,
  AlertCircle,
  LayoutTemplate,
  Plus,
  Trash2,
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import OSShell from '@/components/OSShell';
import { useSession } from '@/components/SessionProvider';
import { usePSAProject } from '@/hooks/usePSAProject';
import { useTemplates } from '@/hooks/useTemplates';
import ProjectStatusBadge, { STATUS_CONFIG } from '@/components/projects/ProjectStatusBadge';
import TaskSection from '@/components/projects/TaskSection';
import TimeLog from '@/components/projects/TimeLog';
import ProjectBudget from '@/components/projects/ProjectBudget';
import ApplyTemplateModal from '@/components/projects/ApplyTemplateModal';
import { Select, Button } from '@/components/ui/primitives';
import { TECHNOLOGIES } from '@/lib/templates/index';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'tasks',    label: 'Tasks'    },
  { id: 'time',     label: 'Time Log' },
  { id: 'budget',   label: 'Budget'   },
  { id: 'overview', label: 'Overview' },
];

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmt(n) {
  if (n == null) return null;
  return `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function ProjectDetail() {
  const { id } = useParams();
  const { session, company, user } = useSession();
  const {
    project,
    milestones,
    tasks,
    timeEntries,
    technologies,
    loading,
    updateProject,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    createTask,
    updateTask,
    deleteTask,
    logTime,
    deleteTimeEntry,
    createTechnology,
    deleteTechnology,
    applyTemplate,
  } = usePSAProject(id, session);

  const { allTemplates } = useTemplates(session, company, user);

  const [tab, setTab] = useState('tasks');
  const [applyModal, setApplyModal] = useState(null); // { technology, technologyId }
  const [addingTech, setAddingTech] = useState(false);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" size={18} /> Loading project…
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-500">
        <AlertCircle size={28} className="text-slate-300" />
        <p className="text-sm">Project not found.</p>
        <Link href="/projects" className="text-sm text-blue-600 hover:underline">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  const tasksDone  = tasks.filter((t) => t.status === 'done').length;
  const tasksTotal = tasks.length;
  const pct        = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
  const totalHours = timeEntries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);

  return (
    <div className="flex flex-col min-h-full">
      {/* Project header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <Link
          href="/projects"
          className="mb-3 flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600"
        >
          <ArrowLeft size={13} /> Projects
        </Link>

        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900">{project.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {project.customer_name && (
                <span className="flex items-center gap-1">
                  <Building2 size={12} /> {project.customer_name}
                </span>
              )}
              {(project.start_date || project.end_date) && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {fmtDate(project.start_date) ?? '?'} – {fmtDate(project.end_date) ?? '?'}
                </span>
              )}
              {project.budget && (
                <span className="flex items-center gap-1">
                  <DollarSign size={12} /> {fmt(project.budget)}
                </span>
              )}
            </div>
          </div>

          {/* Status selector */}
          <Select
            className="h-8 w-36 text-xs"
            value={project.status}
            onChange={(e) => updateProject({ status: e.target.value })}
          >
            {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
              <option key={val} value={val}>{cfg.label}</option>
            ))}
          </Select>
        </div>

        {/* Progress bar */}
        {tasksTotal > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
              <span>{tasksDone}/{tasksTotal} tasks done</span>
              <span>{pct}% · {totalHours.toFixed(1)}h logged</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Tab strip */}
        <div className="mt-4 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                tab === t.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 p-6">
        {tab === 'tasks' && (
          <div className="space-y-8">
            {technologies.length === 0 ? (
              // No technology sections — flat task list (legacy / no tech selected)
              <TaskSection
                milestones={milestones}
                tasks={tasks}
                onCreateMilestone={createMilestone}
                onCreateTask={createTask}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                onUpdateMilestone={updateMilestone}
                onDeleteMilestone={deleteMilestone}
              />
            ) : (
              technologies.map((tech) => {
                const techMs    = milestones.filter((m) => m.technology_id === tech.id);
                const techTasks = tasks.filter((t) => t.technology_id === tech.id);
                return (
                  <div key={tech.id}>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="rounded-full bg-blue-100 px-3 py-0.5 text-sm font-semibold text-blue-700">
                        {tech.technology}
                      </span>
                      <button
                        type="button"
                        onClick={() => setApplyModal({ technology: tech.technology, technologyId: tech.id })}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-600"
                      >
                        <LayoutTemplate size={12} /> Apply Template
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (confirm(`Remove the "${tech.technology}" section? Tasks will become unassigned.`)) deleteTechnology(tech.id); }}
                        className="ml-auto rounded p-1 text-slate-300 hover:text-red-500"
                        title="Remove section"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <TaskSection
                      milestones={techMs}
                      tasks={techTasks}
                      onCreateMilestone={(d) => createMilestone({ ...d, technology_id: tech.id })}
                      onCreateTask={(d) => createTask({ ...d, technology_id: tech.id })}
                      onUpdateTask={updateTask}
                      onDeleteTask={deleteTask}
                      onUpdateMilestone={updateMilestone}
                      onDeleteMilestone={deleteMilestone}
                    />
                  </div>
                );
              })
            )}

            {/* Unassigned tasks when technologies exist */}
            {technologies.length > 0 && (() => {
              const unassignedMs = milestones.filter((m) => !m.technology_id);
              const unassignedTasks = tasks.filter((t) => !t.technology_id);
              if (unassignedMs.length === 0 && unassignedTasks.length === 0) return null;
              return (
                <div>
                  <div className="mb-3">
                    <span className="rounded-full bg-slate-100 px-3 py-0.5 text-sm font-medium text-slate-500">Unassigned</span>
                  </div>
                  <TaskSection
                    milestones={unassignedMs}
                    tasks={unassignedTasks}
                    onCreateMilestone={createMilestone}
                    onCreateTask={createTask}
                    onUpdateTask={updateTask}
                    onDeleteTask={deleteTask}
                    onUpdateMilestone={updateMilestone}
                    onDeleteMilestone={deleteMilestone}
                  />
                </div>
              );
            })()}

            {/* Add technology section */}
            <div>
              {addingTech ? (
                <div className="flex flex-wrap gap-2">
                  {TECHNOLOGIES.filter((t) => !technologies.some((tt) => tt.technology === t)).map((tech) => (
                    <button
                      key={tech}
                      type="button"
                      onClick={async () => {
                        await createTechnology({ technology: tech });
                        setAddingTech(false);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-blue-300 hover:text-blue-700"
                    >
                      + {tech}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAddingTech(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingTech(true)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Plus size={13} /> Add technology section
                </button>
              )}
            </div>
          </div>
        )}

        {applyModal && (
          <ApplyTemplateModal
            open
            technology={applyModal.technology}
            templates={allTemplates}
            projectStartDate={project?.start_date}
            onApply={(template) => applyTemplate(template, applyModal.technologyId, project?.start_date)}
            onClose={() => setApplyModal(null)}
          />
        )}

        {tab === 'time' && (
          <TimeLog
            tasks={tasks}
            timeEntries={timeEntries}
            onLog={logTime}
            onDelete={deleteTimeEntry}
          />
        )}

        {tab === 'budget' && (
          <div className="max-w-lg">
            <ProjectBudget
              project={project}
              tasks={tasks}
              timeEntries={timeEntries}
            />
          </div>
        )}

        {tab === 'overview' && (
          <div className="max-w-lg space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Project Details</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Name</dt>
                  <dd className="font-medium text-slate-800">{project.name}</dd>
                </div>
                {project.customer_name && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Customer</dt>
                    <dd className="font-medium text-slate-800">{project.customer_name}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Status</dt>
                  <dd><ProjectStatusBadge status={project.status} /></dd>
                </div>
                {project.start_date && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Start</dt>
                    <dd className="font-medium text-slate-800">{fmtDate(project.start_date)}</dd>
                  </div>
                )}
                {project.end_date && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">End</dt>
                    <dd className="font-medium text-slate-800">{fmtDate(project.end_date)}</dd>
                  </div>
                )}
                {project.budget && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Budget</dt>
                    <dd className="font-medium text-slate-800">{fmt(project.budget)}</dd>
                  </div>
                )}
                {project.saved_projects?.project_name && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Linked Quote</dt>
                    <dd className="font-medium text-blue-600">
                      <Link href={`/builder?project=${project.quote_id}`} className="hover:underline">
                        {project.saved_projects.project_name}
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {project.description && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-2 text-sm font-semibold text-slate-700">Description</h2>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{project.description}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <AuthGuard>
      <OSShell>
        <ProjectDetail />
      </OSShell>
    </AuthGuard>
  );
}
