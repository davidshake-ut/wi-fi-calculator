import AuthGuard from '@/components/AuthGuard';
import OSShell from '@/components/OSShell';
import AdminPanel from '@/components/AdminPanel';

export default function AdminPage() {
  return (
    <AuthGuard>
      <OSShell>
        <AdminPanel />
      </OSShell>
    </AuthGuard>
  );
}
