// Shared formatting + margin color helpers used across tables, cards and PDF.

export function marginColor(margin) {
  if (margin >= 30) return 'text-green-600 bg-green-50';
  if (margin >= 15) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

// Background-only variant for cards/banners.
export function marginBg(margin) {
  if (margin >= 30) return 'bg-green-50 border-green-200';
  if (margin >= 15) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function currency(n) {
  return currencyFmt.format(Number.isFinite(n) ? n : 0);
}

export function percent(n, digits = 1) {
  return `${(Number.isFinite(n) ? n : 0).toFixed(digits)}%`;
}
