import { describe, it, expect } from 'vitest';
import { calculateCameraBOM } from '../lib/calculateCameraBOM';
import { DEFAULT_CAMERA_INPUTS } from '../lib/defaults';
import { BASE_PRODUCTS } from '../lib/catalog';

const run = (overrides = {}, products = BASE_PRODUCTS) =>
  calculateCameraBOM({ ...DEFAULT_CAMERA_INPUTS, ...overrides }, {}, {}, products);

const qtyOf = (bom, sku) =>
  bom.items.filter((i) => i.sku === sku).reduce((s, i) => s + i.qty, 0);

describe('camera BOM — empty', () => {
  const bom = run();
  it('no cameras → no items, zero totals', () => {
    expect(bom.totalCameras).toBe(0);
    expect(bom.nvrCount).toBe(0);
    expect(bom.items.length).toBe(0);
    expect(bom.grandTotalPrice).toBe(0);
  });
  it('carries no professional services', () => {
    expect(bom.serviceItems).toEqual([]);
  });
});

describe('camera BOM — NVR sizing (1 per 8 cameras)', () => {
  it('8 cameras → 1 NVR', () => {
    const bom = run({ cam4mpTurret: 8 });
    expect(bom.totalCameras).toBe(8);
    expect(bom.nvrCount).toBe(1);
    expect(qtyOf(bom, 'NVR501-08B-LP8')).toBe(1);
  });

  it('9 cameras → 2 NVRs (ceil)', () => {
    const bom = run({ cam4mpTurret: 5, cam8mpBullet: 4 });
    expect(bom.totalCameras).toBe(9);
    expect(bom.nvrCount).toBe(2);
    expect(qtyOf(bom, 'NVR501-08B-LP8')).toBe(2);
  });
});

describe('camera BOM — storage by retention (1 HDD per NVR)', () => {
  it('1 week → 2TB HDD (WD23PURZ), one per NVR', () => {
    const bom = run({ cam8mpTurret: 16, retention: 'week' });
    expect(bom.nvrCount).toBe(2);
    expect(qtyOf(bom, 'WD23PURZ')).toBe(2);
    expect(qtyOf(bom, 'WD85PURZ')).toBe(0);
  });

  it('1 month → 8TB HDD (WD85PURZ), one per NVR', () => {
    const bom = run({ cam8mpTurret: 16, retention: 'month' });
    expect(bom.nvrCount).toBe(2);
    expect(qtyOf(bom, 'WD85PURZ')).toBe(2);
    expect(qtyOf(bom, 'WD23PURZ')).toBe(0);
  });
});

describe('camera BOM — pricing', () => {
  it('uses dealer cost / MSRP price, 7% hardware shipping, grand total = hw + shipping', () => {
    const bom = run({ cam4mpBullet: 1 }); // 1 cam + 1 NVR + 1 8TB HDD
    // hardware price = 299 (cam) + 469 (NVR) + 279 (8TB) = 1047
    expect(bom.totalHardwarePrice).toBeCloseTo(1047, 2);
    expect(bom.totalHardwareCost).toBeCloseTo(545, 2); // 119 + 190 + 236
    expect(bom.shippingPrice).toBeCloseTo(1047 * 0.07, 2); // shipping is on hardware only
    expect(bom.totalServicesPrice).toBe(0); // labor moved to the project rate card
    expect(bom.grandTotalPrice).toBeCloseTo(bom.totalHardwarePrice + bom.shippingPrice, 2);
    expect(bom.overallMargin).toBeGreaterThan(0);
  });

  it('honors price overrides', () => {
    const bom = calculateCameraBOM(
      { ...DEFAULT_CAMERA_INPUTS, cam4mpBullet: 1 },
      { 'IPC2124SR-ADF28KM-H': { cost: 100, price: 250 } },
      {},
      BASE_PRODUCTS
    );
    const cam = bom.items.find((i) => i.sku === 'IPC2124SR-ADF28KM-H');
    expect(cam.unitPrice).toBe(250);
    expect(cam.unitCost).toBe(100);
  });
});

describe('camera BOM — hardware only (labor moved to the project rate card)', () => {
  it('no cameras → no labor lines', () => {
    expect(run().serviceItems.length).toBe(0);
  });

  it('cameras → still no labor lines from the engine', () => {
    const bom = run({ cam4mpTurret: 8 });
    expect(bom.serviceItems).toEqual([]);
    expect(bom.totalServicesPrice).toBe(0);
    expect(bom.grandTotalPrice).toBeCloseTo(bom.totalHardwarePrice + bom.shippingPrice, 2);
  });
});

describe('camera BOM — spare cameras', () => {
  it('adds 5% spares of the most-used model (not counted in totalCameras)', () => {
    const bom = run({ cam4mpTurret: 20, spareCameras: true });
    expect(bom.totalCameras).toBe(20); // spares excluded from the count
    expect(qtyOf(bom, 'IPC3614SR-ADF28KM-H')).toBe(21); // 20 + ceil(20*0.05)=1
  });
});
