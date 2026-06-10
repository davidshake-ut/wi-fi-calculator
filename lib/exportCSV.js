export function exportCSV(inputs, bom, opts = {}) {
  const { fileSuffix = 'BOM' } = opts;
  const hasServices = bom.serviceItems && bom.serviceItems.length > 0;
  const rows = [
    ['Category', 'SKU', 'Description', 'Qty', 'Unit Price', 'Total Price'],
    ...bom.items.map((i) => [
      i.category,
      i.sku,
      i.description,
      i.qty,
      i.unitPrice.toFixed(2),
      i.totalPrice.toFixed(2),
    ]),
    ...(hasServices
      ? [
          [],
          ['--- Professional Services ---'],
          ...bom.serviceItems.map((i) => [
            'Services',
            i.sku,
            i.description,
            1,
            i.unitPrice.toFixed(2),
            i.totalPrice.toFixed(2),
          ]),
        ]
      : []),
    [],
    ['--- Summary ---'],
    ['', '', 'Hardware Subtotal', '', '', bom.totalHardwarePrice.toFixed(2)],
    ...(hasServices
      ? [['', '', 'Professional Services', '', '', bom.totalServicesPrice.toFixed(2)]]
      : []),
    ['', '', 'Shipping (7%)', '', '', bom.shippingPrice.toFixed(2)],
    ['', '', 'GRAND TOTAL', '', '', bom.grandTotalPrice.toFixed(2)],
  ];

  const csv = rows
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  downloadCSV(csv, `${(inputs.propertyName || 'BOM').replace(/[^a-zA-Z0-9]/g, '_')}_${fileSuffix}.csv`);
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Catalog export — the canonical import template: SKU, Description, Category,
// Cost, Price. Re-importing this round-trips cleanly (see lib/csv.js).
export function exportCatalogCSV(products) {
  const rows = [
    ['SKU', 'Description', 'Category', 'Cost', 'Price'],
    ...products.map((p) => [
      p.sku,
      p.desc ?? p.description ?? '',
      p.category,
      Number(p.cost).toFixed(2),
      Number(p.price).toFixed(2),
    ]),
  ];
  const csv = rows
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  downloadCSV(csv, 'Product_Catalog.csv');
}
