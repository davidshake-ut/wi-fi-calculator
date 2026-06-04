'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import AdminPanel from '@/components/AdminPanel';

export default function AdminPage() {
  return (
    <AuthGuard requireSuperAdmin>
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold text-slate-800">Admin Panel</h1>
            <Link href="/" className="flex items-center gap-1 text-sm text-blue-700 hover:underline">
              <ArrowLeft size={14} /> Back to Calculator
            </Link>
          </div>
        </header>
        <AdminPanel />
      </div>
    </AuthGuard>
  );
}
