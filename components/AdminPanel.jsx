'use client';

import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { Card, Button, Field, TextInput, Select, Badge } from '@/components/ui/primitives';

const ROLES = ['user', 'company_admin', 'super_admin'];

export default function AdminPanel() {
  const supabase = getSupabase();
  const { session } = useSession();
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [newCompany, setNewCompany] = useState({ name: '', emailDomain: '' });
  const [invite, setInvite] = useState({ email: '', companyId: '', role: 'user' });
  const [msg, setMsg] = useState(null);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const [c, u] = await Promise.all([
      supabase.from('companies').select('*').order('name'),
      supabase.from('users').select('*').order('email'),
    ]);
    setCompanies(c.data || []);
    setUsers(u.data || []);
  }, [supabase]);

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
  }, [refresh]);

  const userCount = (companyId) => users.filter((u) => u.company_id === companyId).length;

  const addCompany = async (e) => {
    e.preventDefault();
    const domain = newCompany.emailDomain.replace(/^@/, '').trim().toLowerCase();
    const { error } = await supabase
      .from('companies')
      .insert({ name: newCompany.name.trim(), email_domain: domain });
    if (error) setMsg(error.message);
    else {
      setNewCompany({ name: '', emailDomain: '' });
      refresh();
    }
  };

  const deleteCompany = async (id) => {
    if (!confirm('Delete this company? This cannot be undone.')) return;
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) setMsg(error.message);
    else refresh();
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email: invite.email,
        companyId: invite.companyId || null,
        role: invite.role,
      }),
    });
    const body = await res.json();
    if (!res.ok) setMsg(body.error || 'Invite failed');
    else {
      setMsg(`Invited ${invite.email}`);
      setInvite({ email: '', companyId: '', role: 'user' });
      refresh();
    }
  };

  const updateUser = async (id, patch) => {
    const { error } = await supabase.from('users').update(patch).eq('id', id);
    if (error) setMsg(error.message);
    else refresh();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4">
      {msg && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          {msg}
        </div>
      )}

      {/* Company Management */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Company Management</h2>
        <form onSubmit={addCompany} className="mb-4 flex flex-wrap items-end gap-2">
          <Field label="Name" className="flex-1">
            <TextInput
              value={newCompany.name}
              onChange={(e) => setNewCompany((s) => ({ ...s, name: e.target.value }))}
              required
            />
          </Field>
          <Field label="Email Domain" className="flex-1">
            <TextInput
              placeholder="company.com"
              value={newCompany.emailDomain}
              onChange={(e) => setNewCompany((s) => ({ ...s, emailDomain: e.target.value }))}
              required
            />
          </Field>
          <Button type="submit">Add Company</Button>
        </form>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
              <th className="py-2">Name</th>
              <th className="py-2">Domain</th>
              <th className="py-2">Users</th>
              <th className="py-2">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-b border-slate-50">
                <td className="py-2 text-slate-700">{c.name}</td>
                <td className="py-2 font-mono text-xs text-slate-500">@{c.email_domain}</td>
                <td className="py-2">{userCount(c.id)}</td>
                <td className="py-2">
                  <Badge className={c.active ? 'border-green-200 bg-green-50 text-green-600' : 'border-slate-200 bg-slate-50 text-slate-500'}>
                    {c.active ? 'active' : 'inactive'}
                  </Badge>
                </td>
                <td className="py-2 text-right">
                  <button onClick={() => deleteCompany(c.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* User Invite */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Invite User</h2>
        <form onSubmit={sendInvite} className="flex flex-wrap items-end gap-2">
          <Field label="Email" className="flex-1">
            <TextInput
              type="email"
              value={invite.email}
              onChange={(e) => setInvite((s) => ({ ...s, email: e.target.value }))}
              required
            />
          </Field>
          <Field label="Company">
            <Select value={invite.companyId} onChange={(e) => setInvite((s) => ({ ...s, companyId: e.target.value }))}>
              <option value="">—</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Role">
            <Select value={invite.role} onChange={(e) => setInvite((s) => ({ ...s, role: e.target.value }))}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit">Send Invite</Button>
        </form>
      </Card>

      {/* User Management */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">User Management</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Company</th>
              <th className="py-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-50">
                <td className="py-2 text-slate-700">{u.full_name || '—'}</td>
                <td className="py-2 text-slate-500">{u.email}</td>
                <td className="py-2">
                  <Select
                    className="h-8"
                    value={u.company_id || ''}
                    onChange={(e) => updateUser(u.id, { company_id: e.target.value || null })}
                  >
                    <option value="">—</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="py-2">
                  <Select
                    className="h-8 w-40"
                    value={u.role}
                    onChange={(e) => updateUser(u.id, { role: e.target.value })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
