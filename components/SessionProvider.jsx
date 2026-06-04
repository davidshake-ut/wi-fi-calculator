'use client';

import { createContext, useContext } from 'react';
import { useTenant } from '@/hooks/useTenant';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const tenant = useTenant();
  return <SessionContext.Provider value={tenant}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
