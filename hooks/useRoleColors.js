'use client';

import { useCallback, useState } from 'react';

// Full Tailwind class strings — must be literal so the JIT scanner picks them up.
export const PALETTE = [
  { name: 'slate',  bar: 'bg-slate-500',   badge: 'bg-slate-100 text-slate-700',   hex: '#64748b' },
  { name: 'red',    bar: 'bg-red-500',     badge: 'bg-red-50 text-red-700',         hex: '#ef4444' },
  { name: 'orange', bar: 'bg-orange-500',  badge: 'bg-orange-50 text-orange-700',   hex: '#f97316' },
  { name: 'amber',  bar: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700',     hex: '#f59e0b' },
  { name: 'yellow', bar: 'bg-yellow-400',  badge: 'bg-yellow-50 text-yellow-700',   hex: '#facc15' },
  { name: 'lime',   bar: 'bg-lime-500',    badge: 'bg-lime-50 text-lime-700',       hex: '#84cc16' },
  { name: 'green',  bar: 'bg-green-500',   badge: 'bg-green-50 text-green-700',     hex: '#22c55e' },
  { name: 'teal',   bar: 'bg-teal-500',    badge: 'bg-teal-50 text-teal-700',       hex: '#14b8a6' },
  { name: 'cyan',   bar: 'bg-cyan-500',    badge: 'bg-cyan-50 text-cyan-700',       hex: '#06b6d4' },
  { name: 'blue',   bar: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700',       hex: '#3b82f6' },
  { name: 'indigo', bar: 'bg-indigo-500',  badge: 'bg-indigo-50 text-indigo-700',   hex: '#6366f1' },
  { name: 'violet', bar: 'bg-violet-500',  badge: 'bg-violet-50 text-violet-700',   hex: '#8b5cf6' },
  { name: 'purple', bar: 'bg-purple-500',  badge: 'bg-purple-50 text-purple-700',   hex: '#a855f7' },
  { name: 'pink',   bar: 'bg-pink-500',    badge: 'bg-pink-50 text-pink-700',       hex: '#ec4899' },
];

export const PALETTE_MAP = Object.fromEntries(PALETTE.map((p) => [p.name, p]));

const DEFAULTS = {
  'PM':              'indigo',
  'Project Manager': 'indigo',
  'Engineer':        'blue',
  'Installer':       'teal',
  'Tech':            'green',
  'Technician':      'green',
  'Designer':        'violet',
  'Sales':           'orange',
  'QA':              'amber',
  'Lead':            'purple',
  'Director':        'red',
  'Manager':         'cyan',
};

const KEY = 'fsg_os.role_colors';

function readStorage() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? {}; } catch { return {}; }
}

export function useRoleColors() {
  const [saved, setSaved] = useState(readStorage);

  const setRoleColor = useCallback((role, colorName) => {
    setSaved((prev) => {
      const next = { ...prev, [role]: colorName };
      if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getRoleColor = useCallback(
    (role) => (role ? (saved[role] ?? DEFAULTS[role] ?? 'slate') : 'slate'),
    [saved]
  );

  const getPalette = useCallback(
    (role) => PALETTE_MAP[getRoleColor(role)] ?? PALETTE_MAP.slate,
    [getRoleColor]
  );

  return { roleColors: saved, setRoleColor, getRoleColor, getPalette };
}
