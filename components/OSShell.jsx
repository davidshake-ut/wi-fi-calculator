'use client';

import Sidebar from '@/components/Sidebar';

// Wraps all OS module pages: persistent left sidebar + scrollable content area.
export default function OSShell({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-auto">
        {children}
      </div>
    </div>
  );
}
