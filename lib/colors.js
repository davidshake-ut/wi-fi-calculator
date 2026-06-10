// Color helpers for the branded PDF (jsPDF wants [r,g,b] arrays).

export function hexToRgb(hex, fallback = [37, 99, 235]) {
  if (typeof hex !== 'string') return fallback;
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return fallback;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// Mix an [r,g,b] toward white (amount 0..1) — for subtle table/footer fills.
export function lightTint(rgb, amount = 0.88) {
  return rgb.map((c) => Math.round(c + (255 - c) * amount));
}
