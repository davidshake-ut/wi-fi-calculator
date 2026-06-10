// Convert a user-added custom line item into a BOM line. These are per-project
// ad-hoc items (not in the product database); the engines append them to the
// BOM so totals and exports include them automatically. Raw sku/description are
// kept as-is (no defaults) so the inline editor's fields stay clearable.
export function toCustomLine(c) {
  const qty = Math.max(0, Number(c.qty) || 0);
  const cost = Math.max(0, Number(c.cost) || 0);
  const price = Math.max(0, Number(c.price) || 0);
  return {
    id: c.id,
    sku: c.sku || '',
    description: c.description || '',
    qty,
    unitCost: cost,
    unitPrice: price,
    totalCost: cost * qty,
    totalPrice: price * qty,
    total: price * qty,
    margin: price > 0 ? ((price - cost) / price) * 100 : 0,
    category: 'Custom',
    segment: c.segment || 'Accessories',
    note: '',
    isCustomLine: true,
  };
}
