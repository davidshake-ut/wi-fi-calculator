'use client';

import { useCallback, useEffect, useState } from 'react';
import { Trash2, UserPlus, Building2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { Card, Button, Field, TextInput, Select, Badge } from '@/components/ui/primitives';
import ModulesPanel from '@/components/ModulesPanel';

export default function AdminPanel() {
  const supabase = getSupabase();
  const { session, isSuperAdmin, company, user, refresh: refreshSession } = useSession();

  const [companies, setCompanies] = useState([]);
  const [members, setMembers] = useState([]);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // invite/create form state
  const [invite, setInvite] = useState({ email: '', role: 'user', companyId: '' });
  const [newTeam, setNewTeam] = useState({ name: '', adminEmail: '' });

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const [c, u] = await Promise.all([
      supabase.from('companies').select('*').order('name'),
      supabase.from('users').select('*').order('email'),
    ]);
    setCompanies(c.data || []);
    setMembers(u.data || []);
  }, [supabase]);

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
  }, [refresh]);

  const api = async (url, method, body) => {
    setErr(null);
    setMsg(null);
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error || 'Request failed');
      return false;
    }
    await refresh();
    return true;
  };

  const sendInvite = async (e, body) => {
    e.preventDefault();
    if (await api('/api/invite', 'POST', body)) {
      setMsg(`Invitation sent to ${body.email}.`);
      setInvite({ email: '', role: 'user', companyId: '' });
    }
  };

  const setRole = (userId, role) => api('/api/members', 'PATCH', { userId, role });
  const removeMember = async (m) => {
    if (!confirm(`Remove ${m.email} from their team?`)) return;
    if (await api('/api/members', 'DELETE', { userId: m.id })) setMsg(`${m.email} removed.`);
  };

  // ---- super-admin-only (client writes; RLS permits super_admin) ----
  const createTeam = async (e) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const { data, error } = await supabase
      .from('companies')
      .insert({ name: newTeam.name.trim() })
      .select()
      .single();
    if (error) return setErr(error.message);
    if (newTeam.adminEmail.trim()) {
      await api('/api/invite', 'POST', {
        email: newTeam.adminEmail.trim(),
        role: 'company_admin',
        companyId: data.id,
      });
    }
    setMsg(`Team "${data.name}" created${newTeam.adminEmail ? ' and first Admin invited' : ''}.`);
    setNewTeam({ name: '', adminEmail: '' });
    await refresh();
  };

  const deleteTeam = async (c) => {
    if (!confirm(`Delete team "${c.name}" and all its data? This cannot be undone.`)) return;
    const { error } = await supabase.from('companies').delete().eq('id', c.id);
    if (error) setErr(error.message);
    else {
      setMsg(`Team "${c.name}" deleted.`);
      await refresh();
    }
  };

  const reassignTeam = async (userId, companyId) => {
    const { error } = await supabase
      .from('users')
      .update({ company_id: companyId || null })
      .eq('id', userId);
    if (error) return setErr(error.message);
    await refresh();
    // If a super admin assigned themselves a team, re-resolve the session so the
    // calculator picks up the new team immediately.
    if (userId === user?.id) await refreshSession?.();
  };

  const memberCount = (cid) => members.filter((m) => m.company_id === cid).length;

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}
      {msg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {msg}
        </div>
      )}

      {isSuperAdmin ? (
        // ============================ SUPER ADMIN ============================
        <>
          <Card className="p-4">
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
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Teams</h2>
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
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <UserPlus size={16} /> Invite a Member
            </h2>
            <form
              onSubmit={(e) =>
                sendInvite(e, {
                  email: invite.email,
                  role: invite.role,
                  companyId: invite.companyId || null,
                })
              }
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
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
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
          </Card>

          <MembersTable
            members={members}
            companies={companies}
            selfId={user?.id}
            onRole={setRole}
            onRemove={removeMember}
            onReassign={reassignTeam}
            superAdmin
          />

          <ModulesPanel companies={companies} />
        </>
      ) : (
        // ============================ TEAM ADMIN ============================
        <>
          <Card className="p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Building2 size={16} /> {company?.name || 'Your Team'}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Invite members and manage their roles. Users can build projects; Admins can also edit
              the catalog, branding, and invite people.
            </p>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <UserPlus size={16} /> Invite a Member
            </h2>
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
          </Card>

          <MembersTable
            members={members}
            selfId={user?.id}
            onRole={setRole}
            onRemove={removeMember}
          />

          <ModulesPanel />
        </>
      )}
    </div>
  );
}

function MembersTable({ members, companies, selfId, onRole, onRemove, onReassign, superAdmin }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">Members</h2>
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
              const isSelf = m.id === selfId;
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
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                    </td>
                  )}
                  <td className="py-2 pr-2">
                    {isSuper ? (
                      <Badge className="border-violet-200 bg-violet-50 text-violet-600">
                        Super Admin
                      </Badge>
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
    </Card>
  );
}
