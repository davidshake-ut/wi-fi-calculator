'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Wrench,
  FolderKanban,
  LifeBuoy,
  BookOpen,
  Shield,
  LogOut,
  Layers,
  LayoutTemplate,
  Receipt,
} from 'lucide-react';
import { useSession } from '@/components/SessionProvider';
import { useModules } from '@/hooks/useModules';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard',       href: '/dashboard', icon: LayoutDashboard },
  { key: 'crm',       label: 'CRM',             href: '/crm',       icon: Users },
  { key: 'builder',   label: 'System Builder',  href: '/builder',   icon: Wrench },
  { key: 'projects',   label: 'Projects',        href: '/projects',   icon: FolderKanban },
  { key: 'templates',  label: 'Templates',       href: '/templates',  icon: LayoutTemplate },
  { key: 'support',    label: 'Support',         href: '/support',    icon: LifeBuoy },
  { key: 'invoices',   label: 'Invoices',        href: '/invoices',   icon: Receipt  },
  { key: 'resources',  label: 'Resources',       href: '/resources',  icon: BookOpen },
];

function NavLink({ href, icon: Icon, label, active }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
      )}
    >
      <Icon size={16} className="shrink-0" />
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, isSuperAdmin, configured, session, signOut } = useSession();
  const { isEnabled } = useModules();

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.key === 'templates' ? isEnabled('projects') : isEnabled(item.key)
  );

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-slate-200 px-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Layers size={14} />
        </span>
        <span className="text-sm font-bold tracking-tight text-slate-900">FSG OS</span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {visibleItems.map(({ key, label, href, icon }) => (
          <NavLink
            key={key}
            href={href}
            icon={icon}
            label={label}
            active={pathname === href || pathname.startsWith(href + '/')}
          />
        ))}
      </nav>

      {/* Bottom: Admin + Sign out */}
      <div className="space-y-0.5 border-t border-slate-200 p-2">
        {isAdmin && (
          <NavLink
            href="/admin"
            icon={Shield}
            label={isSuperAdmin ? 'Teams' : 'Team'}
            active={pathname === '/admin'}
          />
        )}
        {configured && session && (
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800"
          >
            <LogOut size={16} className="shrink-0" />
            Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}
