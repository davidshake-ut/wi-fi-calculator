import { describe, it, expect } from 'vitest';
import { calculateLabor } from '../lib/calculateLabor';
import { DEFAULT_LABOR_ROLES } from '../lib/defaults';

describe('calculateLabor', () => {
  it('empty / no-hours roles → zero everything', () => {
    expect(calculateLabor([]).grandTotalPrice).toBe(0);
    const zeroed = DEFAULT_LABOR_ROLES.map((r) => ({ ...r, hours: 0 }));
    const labor = calculateLabor(zeroed);
    expect(labor.serviceItems).toEqual([]);
    expect(labor.totalHours).toBe(0);
    expect(labor.grandTotalPrice).toBe(0);
  });

  it('line cost/price = rate × hours, and totals sum the lines', () => {
    const labor = calculateLabor([
      { key: 'a', label: 'Tech', costRate: 75, billRate: 125, hours: 40 },
      { key: 'b', label: 'PM', costRate: 100, billRate: 160, hours: 10 },
    ]);
    expect(labor.serviceItems).toHaveLength(2);
    const tech = labor.serviceItems[0];
    expect(tech.totalCost).toBe(75 * 40);
    expect(tech.totalPrice).toBe(125 * 40);
    expect(labor.totalHours).toBe(50);
    expect(labor.totalServicesCost).toBe(75 * 40 + 100 * 10);
    expect(labor.totalServicesPrice).toBe(125 * 40 + 160 * 10);
    // shaped like a BOM section: no hardware, no shipping, grand = services
    expect(labor.totalHardwarePrice).toBe(0);
    expect(labor.shippingPrice).toBe(0);
    expect(labor.grandTotalPrice).toBe(labor.totalServicesPrice);
  });

  it('skips roles with zero/blank hours but keeps the rest', () => {
    const labor = calculateLabor([
      { key: 'a', label: 'Tech', costRate: 75, billRate: 125, hours: 8 },
      { key: 'b', label: 'PM', costRate: 100, billRate: 160, hours: 0 },
      { key: 'c', label: 'Eng', costRate: 130, billRate: 200, hours: '' },
    ]);
    expect(labor.serviceItems.map((s) => s.sku)).toEqual(['a']);
  });

  it('per-line margin is computed', () => {
    const labor = calculateLabor([
      { key: 'a', label: 'Tech', costRate: 100, billRate: 200, hours: 1 },
    ]);
    expect(labor.serviceItems[0].margin).toBeCloseTo(50, 6);
    expect(labor.overallMargin).toBeCloseTo(50, 6);
  });
});
