import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CATEGORY_ORDER } from './catalog';

const BRAND_BLUE = [0, 82, 165]; // #0052A5
const money = (n) =>
  `$${(Number.isFinite(n) ? n : 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function categorySort(items) {
  return [...items].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category);
    const bi = CATEGORY_ORDER.indexOf(b.category);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export function exportPDF(inputs, bom, term) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // ---- Header banner ----
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('Cambium Networks — Managed Wi-Fi Budgetary Quote', 10, 12);
  doc.setFontSize(10);
  doc.text(inputs.propertyName || 'Untitled Project', 10, 20);
  doc.text(inputs.propertyAddress || '', 10, 26);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW - 10, 20, { align: 'right' });

  // ---- KPI metric boxes ----
  const kpis = [
    ['Total APs', String(bom.totalAPs)],
    [`${term.summaryUnit} APs`, String(bom.guestRoomAPs)],
    ['IDF Switches', String(bom.totalIdfSwitches + (bom.needsAggSwitch ? 1 : 0))],
    ['Total Cost', money(bom.grandTotalCost)],
    ['Sell Price', money(bom.grandTotalPrice)],
    ['Margin', `${bom.overallMargin.toFixed(1)}%`],
  ];
  const boxW = (pageW - 20) / kpis.length;
  let x = 10;
  doc.setDrawColor(220);
  kpis.forEach(([label, value]) => {
    doc.setFillColor(245, 247, 250);
    doc.rect(x, 32, boxW - 2, 16, 'F');
    doc.setTextColor(120);
    doc.setFontSize(7);
    doc.text(label.toUpperCase(), x + 2, 38);
    doc.setTextColor(20);
    doc.setFontSize(11);
    doc.text(value, x + 2, 45);
    x += boxW;
  });

  // ---- Hardware BOM ----
  autoTable(doc, {
    startY: 54,
    head: [['Category', 'SKU', 'Description', 'Qty', 'Unit Price', 'Total']],
    body: categorySort(bom.items).map((i) => [
      i.category,
      i.sku,
      i.note ? `${i.description}\n${i.note}` : i.description,
      i.qty,
      money(i.unitPrice),
      money(i.totalPrice),
    ]),
    headStyles: { fillColor: BRAND_BLUE, fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    margin: { left: 10, right: 10 },
  });

  // ---- Professional Services ----
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [['Professional Services', 'Price']],
    body: bom.serviceItems.map((s) => [s.description, money(s.unitPrice)]),
    headStyles: { fillColor: BRAND_BLUE, fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 10, right: 10 },
  });

  // ---- Cost Summary ----
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [['Cost Summary', 'Client Price']],
    body: [
      ['Hardware & Software', money(bom.totalHardwarePrice)],
      ['Professional Services', money(bom.totalServicesPrice)],
      ['Estimated Shipping (7%)', money(bom.shippingPrice)],
    ],
    foot: [['Total Project Estimate', money(bom.grandTotalPrice)]],
    headStyles: { fillColor: BRAND_BLUE, fontSize: 8 },
    footStyles: { fillColor: [230, 238, 248], textColor: 20, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 10, right: 10 },
    tableWidth: 120,
  });

  // ---- Gross profit banner ----
  const gpY = doc.lastAutoTable.finalY + 6;
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(10, gpY, 120, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(
    `Gross Profit: ${money(bom.grandTotalPrice - bom.grandTotalCost)}  (${bom.overallMargin.toFixed(1)}% margin)`,
    13,
    gpY + 6.5
  );

  // ---- Disclaimer ----
  doc.setTextColor(130);
  doc.setFontSize(6.5);
  doc.setFont(undefined, 'italic');
  doc.text(
    '* Budgetary estimate only. Final pricing may vary. Valid for 30 days.',
    10,
    gpY + 16
  );
  doc.setFont(undefined, 'normal');

  // ---- Footer on every page ----
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(
      `Cambium Networks Managed Wi-Fi — Confidential Budgetary Quote | Page ${i} of ${pageCount}`,
      pageW / 2,
      pageH - 5,
      { align: 'center' }
    );
  }

  const safeName = (inputs.propertyName || 'BOM').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${safeName}_BOM.pdf`);
}
