'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Trash2, UserPlus, Building2, Puzzle, Palette, Users, Upload, X } from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { useBranding } from '@/hooks/useBranding';
import { Card, Button, Field, TextInput, Select, Badge } from '@/components/ui/primitives';
import ModulesPanel from '@/components/ModulesPanel';
import { cn } from '@/lib/utils';

// ── Tab definitions ────────────────────────────────────────────────────────

const SA_TABS = [
  { key: 'teams',    label: 'Teams',           Icon: Building2 },
  { key: 'modules',  label: 'Module Settings', Icon: Puzzle    },
  { key: 'branding', label: 'Team Branding',   Icon: Palette   },
  { key: 'members',  label: 'Members',         Icon: Users     },
];

const CA_TABS = [
  { key: 'branding', label: 'Branding',   Icon: Palette },
  { key: 'modules',  label: 'Modules',    Icon: Puzzle  },
  { key: 'members',  label: 'Members',    Icon: Users   },
];

// ── Branding form (shared by super admin + company admin) ─────────────────

function BrandingForm({ initial, onSave }) {
  const [form, setForm]     = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [err,    setErr]    = useState(null);
  const fileRef             = useRef();

  useEffect(() => { setForm(initial); }, [JSON.stringify(initial)]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleLogoFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => set('logo', { dataUrl: ev.target.result, w: img.naturalWidth, h: img.naturalHeight });
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) handleLogoFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await onSave(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
      )}

      <Field label="Team / Company Name">
        <TextInput value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
      </Field>

      {/* Logo */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Logo</p>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex items-center gap-4"
        >
          {form.logo?.dataUrl ? (
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5">
              <img src={form.logo.dataUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
              <button
                type="button"
                onClick={() => set('logo', null)}
                className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-500 text-white hover:bg-red-500"
              >
                <X size={9} />
              </button>
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-300">
              <Upload size={20} />
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            >
              {form.logo ? 'Replace logo' : 'Upload logo'}
            </button>
            <p className="mt-1 text-[11px] text-slate-400">PNG, SVG, JPG — drag & drop or click</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleLogoFile(e.target.files?.[0])}
            />
          </div>
        </div>
      </div>

      {/* Colors */}
      <div>
        <p className="mb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Brand Colors</p>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="mb-1.5 text-xs text-slate-500">Primary color</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => set('primaryColor', e.target.value)}
                className="h-9 w-9 cursor-pointer rounded-lg border border-slate-200 p-0.5"
              />
              <input
                type="text"
                value={form.primaryColor}
                onChange={(e) => set('primaryColor', e.target.value)}
                className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-sm outline-none focus:border-blue-400"
                placeholder="#2563eb"
              />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs text-slate-500">Accent color</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => set('accentColor', e.target.value)}
                className="h-9 w-9 cursor-pointer rounded-lg border border-slate-200 p-0.5"
              />
              <input
                type="text"
                value={form.accentColor}
                onChange={(e) => set('accentColor', e.target.value)}
                className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-sm outline-none focus:border-blue-400"
                placeholder="#1e40af"
              />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <span className="text-xs text-slate-400">Preview:</span>
          <span
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
            style={{ background: form.primaryColor }}
          >
            Primary
          </span>
          <span
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
            style={{ background: form.accentColor }}
          >
            Accent
          </span>
          {form.logo?.dataUrl && (
            <img src={form.logo.dataUrl} alt="" className="ml-auto h-7 w-auto object-contain" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Branding'}
        </Button>
        {saved && <span className="text-sm text-emerald-600">Saved!</span>}
      </div>
    </form>
  );
}

// ── Members table ─────────────────────────────────────────────────────────

function MembersTable({ members, companies, selfId, onRole, onRemove, onReassign, superAdmin }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
            <th className="py-2 pr-2">Name</th>
            <th className="py-2 pr-2">Email</th>
            {superAdmin && <th className="py-2 pr-2">Team</th>}
            <th className="py-2 pr-2">Role</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const isSelf  = m.id === selfId;
            const isSuper = m.role === 'super_admin';
            return (
              <tr key={m.id} className="border-b border-slate-50">
                <td className="py-2 pr-2 text-slate-700">
                  {m.full_name || '—'}
                  {isSelf && <span className="ml-1 text-xs text-slate-400">(you)</span>}
                </td>
                <td className="py-2 pr-2 text-slate-500">{m.email}</td>
                {superAdmin && (
                  <td className="py-2 pr-2">
                    <Select
                      className="h-8 w-44"
                      value={m.company_id || ''}
                      onChange={(e) => onReassign(m.id, e.target.value)}
                    >
                      <option value="">— none —</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Select>
                  </td>
                )}
                <td className="py-2 pr-2">
                  {isSuper ? (
                    <Badge className="border-violet-200 bg-violet-50 text-violet-600">Super Admin</Badge>
                  ) : (
                    <Select
                      className="h-8 w-32"
                      value={m.role}
                      onChange={(e) => onRole(m.id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="company_admin">Admin</option>
                    </Select>
                  )}
                </td>
                <td className="py-2 text-right">
                  {!isSelf && !isSuper && (
                    <button
                      onClick={() => onRemove(m)}
                      title="Remove from team"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {members.length === 0 && (
            <tr>
              <td colSpan={superAdmin ? 5 : 4} className="py-6 text-center text-sm text-slate-400">
                No members yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────

function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-slate-100 pb-0">
      {tabs.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'flex items-center gap-1.5 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors',
            active === key
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Main AdminPanel ───────────────────────────────────────────────────────

export default function AdminPanel() {
  const supabase = getSupabase();
  const { session, isSuperAdmin, company, user, refresh: refreshSession } = useSession();

  const tabs    = isSuperAdmin ? SA_TABS : CA_TABS;
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  const [companies, setCompanies] = useState([]);
  const [members,   setMembers]   = useState([]);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const [invite,  setInvite]  = useState({ email: '', role: 'user', companyId: '' });
  const [newTeam, setNewTeam] = useState({ name: '', adminEmail: '' });

  // Super admin team branding state
  const [brandingTargetId, setBrandingTargetId] = useState('');

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const [c, u] = await Promise.all([
      supabase.from('companies').select('*').order('name'),
      supabase.from('users').select('*').order('email'),
    ]);
    setCompanies(c.data || []);
    setMembers(u.data || []);
  }, [supabase]);

  useEffect(() => { void refresh(); }, [refresh]);

  const flash = (type, text) => {
    if (type === 'err') { setErr(text); setMsg(null); }
    else { setMsg(text); setErr(null); }
    setTimeout(() => { setErr(null); setMsg(null); }, 4000);
  };

  const api = async (url, method, body) => {
    setErr(null); setMsg(null);
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { flash('err', data.error || 'Request failed'); return false; }
    await refresh();
    return true;
  };

  const sendInvite = async (e, body) => {
    e.preventDefault();
    if (await api('/api/invite', 'POST', body)) {
      flash('ok', `Invitation sent to ${body.email}.`);
      setInvite({ email: '', role: 'user', companyId: '' });
    }
  };

  const setRole      = (userId, role)      => api('/api/members', 'PATCH',  { userId, role });
  const removeMember = async (m) => {
    if (!confirm(`Remove ${m.email} from their team?`)) return;
    if (await api('/api/members', 'DELETE', { userId: m.id })) flash('ok', `${m.email} removed.`);
  };

  const createTeam = async (e) => {
    e.preventDefault(); setErr(null); setMsg(null);
    const { data, error } = await supabase.from('companies').insert({ name: newTeam.name.trim() }).select().single();
    if (error) return flash('err', error.message);
    if (newTeam.adminEmail.trim()) {
      await api('/api/invite', 'POST', { email: newTeam.adminEmail.trim(), role: 'company_admin', companyId: data.id });
    }
    flash('ok', `Team "${data.name}" created${newTeam.adminEmail ? ' and first Admin invited' : ''}.`);
    setNewTeam({ name: '', adminEmail: '' });
  };

  const deleteTeam = async (c) => {
    if (!confirm(`Delete team "${c.name}" and all its data? This cannot be undone.`)) return;
    const { error } = await supabase.from('companies').delete().eq('id', c.id);
    if (error) flash('err', error.message);
    else { flash('ok', `Team "${c.name}" deleted.`); await refresh(); }
  };

  const reassignTeam = async (userId, companyId) => {
    const { error } = await supabase.from('users').update({ company_id: companyId || null }).eq('id', userId);
    if (error) return flash('err', error.message);
    await refresh();
    if (userId === user?.id) await refreshSession?.();
  };

  const memberCount = (cid) => members.filter((m) => m.company_id === cid).length;

  // ── Branding for company admin (own team)
  const { branding: ownBranding, setBranding: saveOwnBranding } = useBranding({
    configured: isSupabaseConfigured,
    company,
    onSaved: refresh,
  });

  // ── Branding for super admin targeting a specific team
  const brandingTarget = companies.find((c) => c.id === brandingTargetId) ?? null;
  const brandingInitial = brandingTarget
    ? {
        companyName:   brandingTarget.name            || '',
        logo:          brandingTarget.logo            || null,
        primaryColor:  brandingTarget.primary_color   || '#2563eb',
        accentColor:   brandingTarget.accent_color    || '#1e40af',
      }
    : { companyName: '', logo: null, primaryColor: '#2563eb', accentColor: '#1e40af' };

  const saveSuperBranding = async (form) => {
    if (!supabase || !brandingTargetId) return;
    const { error } = await supabase
      .from('companies')
      .update({
        name:          form.companyName,
        logo:          form.logo ?? null,
        primary_color: form.primaryColor,
        accent_color:  form.accentColor,
      })
      .eq('id', brandingTargetId);
    if (error) throw error;
    await refresh();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {isSuperAdmin ? 'Platform Settings' : 'Team Settings'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isSuperAdmin
            ? 'Manage teams, configure modules, and set team branding across the platform.'
            : 'Configure your team's branding, modules, and members.'}
        </p>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
      )}
      {msg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="px-4 pt-3">
          <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="p-5">
          {/* ── SUPER ADMIN: Teams ─────────────────────────────────── */}
          {activeTab === 'teams' && isSuperAdmin && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Building2 size={16} /> Create a Team
                </h2>
                <form onSubmit={createTeam} className="flex flex-wrap items-end gap-2">
                  <Field label="Team name" className="flex-1">
                    <TextInput
                      value={newTeam.name}
                      onChange={(e) => setNewTeam((s) => ({ ...s, name: e.target.value }))}
                      placeholder="Acme Networks"
                      required
                    />
                  </Field>
                  <Field label="First Admin email (optional)" className="flex-1">
                    <TextInput
                      type="email"
                      value={newTeam.adminEmail}
                      onChange={(e) => setNewTeam((s) => ({ ...s, adminEmail: e.target.value }))}
                      placeholder="admin@acme.com"
                    />
                  </Field>
                  <Button type="submit">Create Team</Button>
                </form>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-semibold text-slate-800">All Teams</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                      <th className="py-2">Team</th>
                      <th className="py-2 text-right">Members</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c) => (
                      <tr key={c.id} className="border-b border-slate-50">
                        <td className="py-2 text-slate-700">{c.name}</td>
                        <td className="py-2 text-right tabular-nums text-slate-500">{memberCount(c.id)}</td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => deleteTeam(c)}
                            title="Delete team"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {companies.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-sm text-slate-400">
                          No teams yet — create one above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <UserPlus size={16} /> Invite a Member
                </h2>
                <form
                  onSubmit={(e) => sendInvite(e, { email: invite.email, role: invite.role, companyId: invite.companyId || null })}
                  className="flex flex-wrap items-end gap-2"
                >
                  <Field label="Email" className="flex-1">
                    <TextInput
                      type="email"
                      value={invite.email}
                      onChange={(e) => setInvite((s) => ({ ...s, email: e.target.value }))}
                      required
                    />
                  </Field>
                  <Field label="Team">
                    <Select
                      value={invite.companyId}
                      onChange={(e) => setInvite((s) => ({ ...s, companyId: e.target.value }))}
                      required
                    >
                      <option value="">— select —</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  </Field>
                  <Field label="Role">
                    <Select
                      value={invite.role}
                      onChange={(e) => setInvite((s) => ({ ...s, role: e.target.value }))}
                    >
                      <option value="user">User</option>
                      <option value="company_admin">Admin</option>
                    </Select>
                  </Field>
                  <Button type="submit">Send Invite</Button>
                </form>
              </div>
            </div>
          )}

          {/* ── MODULE SETTINGS ────────────────────────────────────── */}
          {activeTab === 'modules' && (
            <div>
              {isSuperAdmin ? (
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">
                    Select a team to configure which modules they can access.
                  </p>
                  <ModulesPanel companies={companies} />
                </div>
              ) : (
                <ModulesPanel />
              )}
            </div>
          )}

          {/* ── BRANDING ──────────────────────────────────────────── */}
          {activeTab === 'branding' && (
            <div>
              {isSuperAdmin ? (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm text-slate-500">
                      Select a team to configure its logo and brand colors.
                    </p>
                    <Select
                      value={brandingTargetId}
                      onChange={(e) => setBrandingTargetId(e.target.value)}
                      className="w-60"
                    >
                      <option value="">— select a team —</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  </div>
                  {brandingTargetId ? (
                    <BrandingForm
                      key={brandingTargetId}
                      initial={brandingInitial}
                      onSave={saveSuperBranding}
                    />
                  ) : (
                    <p className="text-sm text-slate-400">Select a team above to edit its branding.</p>
                  )}
                </div>
              ) : (
                <BrandingForm
                  initial={{
                    companyName:  ownBranding.companyName  || '',
                    logo:         ownBranding.logo         || null,
                    primaryColor: ownBranding.primaryColor || '#2563eb',
                    accentColor:  ownBranding.accentColor  || '#1e40af',
                  }}
                  onSave={saveOwnBranding}
                />
              )}
            </div>
          )}

          {/* ── MEMBERS ────────────────────────────────────────────── */}
          {activeTab === 'members' && (
            <div className="space-y-5">
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <UserPlus size={16} /> Invite a Member
                </h2>
                {isSuperAdmin ? (
                  <form
                    onSubmit={(e) => sendInvite(e, { email: invite.email, role: invite.role, companyId: invite.companyId || null })}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <Field label="Email" className="flex-1">
                      <TextInput
                        type="email"
                        value={invite.email}
                        onChange={(e) => setInvite((s) => ({ ...s, email: e.target.value }))}
                        required
                      />
                    </Field>
                    <Field label="Team">
                      <Select
                        value={invite.companyId}
                        onChange={(e) => setInvite((s) => ({ ...s, companyId: e.target.value }))}
                        required
                      >
                        <option value="">— select —</option>
                        {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </Select>
                    </Field>
                    <Field label="Role">
                      <Select
                        value={invite.role}
                        onChange={(e) => setInvite((s) => ({ ...s, role: e.target.value }))}
                      >
                        <option value="user">User</option>
                        <option value="company_admin">Admin</option>
                      </Select>
                    </Field>
                    <Button type="submit">Send Invite</Button>
                  </form>
                ) : (
                  <form
                    onSubmit={(e) => sendInvite(e, { email: invite.email, role: invite.role })}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <Field label="Email" className="flex-1">
                      <TextInput
                        type="email"
                        value={invite.email}
                        onChange={(e) => setInvite((s) => ({ ...s, email: e.target.value }))}
                        required
                      />
                    </Field>
                    <Field label="Role">
                      <Select
                        value={invite.role}
                        onChange={(e) => setInvite((s) => ({ ...s, role: e.target.value }))}
                      >
                        <option value="user">User</option>
                        <option value="company_admin">Admin</option>
                      </Select>
                    </Field>
                    <Button type="submit">Send Invite</Button>
                  </form>
                )}
              </div>

              <div>
                <h2 className="mb-3 text-sm font-semibold text-slate-800">
                  {isSuperAdmin ? 'All Members' : 'Team Members'}
                </h2>
                <MembersTable
                  members={isSuperAdmin ? members : members.filter((m) => m.company_id === company?.id)}
                  companies={companies}
                  selfId={user?.id}
                  onRole={setRole}
                  onRemove={removeMember}
                  onReassign={isSuperAdmin ? reassignTeam : undefined}
                  superAdmin={isSuperAdmin}
                />
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
