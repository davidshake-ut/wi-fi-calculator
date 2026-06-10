import { describe, it, expect, beforeEach } from 'vitest';
import { exportCSV } from '../lib/exportCSV';

// Capture the generated CSV text via mocked browser download globals.
let csvText = '';
beforeEach(() => {
  csvText = '';
  globalThis.Blob = class {
    constructor(parts) {
      csvText = parts.join('');
    }
  };
  globalThis.URL = { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} };
  globalThis.document = {
    createElement: () => ({ click() {}, set href(_v) {}, set download(_v) {} }),
  };
});

const fakeBom = (overrides = {}) => ({
  items: [{ category: 'Access Point', sku: 'AP1', description: 'AP', qty: 2, unitPrice: 100, totalPrice: 200 }],
  serviceItems: [],
  totalHardwarePrice: 200,
  totalServicesPrice: 0,
  shippingPrice: 14,
  grandTotalPrice: 214,
  ...overrides,
});

describe('exportCSV — multi-section quote', () => {
  it('renders each section + a combined project grand total', () => {
    const sections = [
      { title: 'Managed Wi-Fi', bom: fakeBom() },
      {
        title: 'Camera Systems',
        bom: fakeBom({
          items: [{ category: 'Camera', sku: 'C1', description: 'Cam', qty: 4, unitPrice: 250, totalPrice: 1000 }],
          serviceItems: [{ sku: 'CAM-INSTALL', description: 'Install', unitPrice: 300, totalPrice: 300 }],
          totalHardwarePrice: 1000,
          totalServicesPrice: 300,
          shippingPrice: 70,
          grandTotalPrice: 1370,
        }),
      },
    ];
    exportCSV({ propertyName: 'Test Hotel' }, sections, { fileSuffix: 'Quote' });

    expect(csvText).toContain('=== MANAGED WI-FI ===');
    expect(csvText).toContain('=== CAMERA SYSTEMS ===');
    expect(csvText).toContain('Camera Systems — Professional Services');
    expect(csvText).toContain('PROJECT GRAND TOTAL');
    expect(csvText).toContain('1584.00'); // 214 + 1370 combined
  });

  it('omits sections with no items', () => {
    const sections = [
      { title: 'Managed Wi-Fi', bom: fakeBom() },
      { title: 'Camera Systems', bom: fakeBom({ items: [], grandTotalPrice: 0 }) },
    ];
    exportCSV({ propertyName: 'X' }, sections);
    expect(csvText).toContain('=== MANAGED WI-FI ===');
    expect(csvText).not.toContain('=== CAMERA SYSTEMS ===');
  });
});
