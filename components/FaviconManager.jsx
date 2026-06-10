'use client';

import { useEffect } from 'react';
import { useBranding } from '@/hooks/useBranding';

// Mirrors the branding logo into the browser tab favicon. When a logo is set we
// append a dedicated <link rel="icon"> (last one wins); when cleared we remove
// it so the default favicon.ico applies again. DOM-only — no React state.
export default function FaviconManager() {
  const { branding } = useBranding();
  const href = branding.logo?.dataUrl || '';

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'brand-favicon';
    let link = document.getElementById(id);
    if (href) {
      if (!link) {
        link = document.createElement('link');
        link.id = id;
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = href;
    } else if (link) {
      link.remove();
    }
  }, [href]);

  return null;
}
