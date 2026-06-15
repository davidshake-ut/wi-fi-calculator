// Professional-labor engine — a PURE function. Turns the per-project labor rate
// card (roles with cost rate, bill rate, and hours) into line items plus totals.
// This is the SINGLE source of labor on a quote; the hardware BOMs no longer
// generate services of their own.
//
// The result is shaped like a calculateBOM section (items / serviceItems /
// totals / shipping / grandTotal) so it can be passed straight into the same
// CostSummary and PDF/CSV exporters as the hardware sections — labor simply has
// no hardware and no shipping.

export function calculateLabor(laborRoles = [], estimatedHours = {}) {
  const serviceItems = [];
  let totalHours = 0;

  for (const role of laborRoles) {
    // Hours come from the live design-based estimate unless the user set an
    // explicit override (a numeric role.hours). null/undefined → use estimate.
    const isAuto = role.hours == null;
    const hours = isAuto
      ? Math.max(0, Number(estimatedHours[role.key]) || 0)
      : Math.max(0, Number(role.hours) || 0);
    const costRate = Math.max(0, Number(role.costRate) || 0);
    const billRate = Math.max(0, Number(role.billRate) || 0);
    if (hours <= 0) continue; // a role with no hours contributes nothing

    const totalCost = costRate * hours;
    const totalPrice = billRate * hours;
    totalHours += hours;

    serviceItems.push({
      sku: role.key,
      description: role.label,
      qty: hours,
      unitCost: costRate,
      unitPrice: billRate,
      totalCost,
      totalPrice,
      margin: totalPrice > 0 ? ((totalPrice - totalCost) / totalPrice) * 100 : 0,
      note: `${hours} hr${hours === 1 ? '' : 's'} @ $${billRate}/hr${isAuto ? ' (est.)' : ''}`,
    });
  }

  const totalServicesCost = serviceItems.reduce((s, i) => s + i.totalCost, 0);
  const totalServicesPrice = serviceItems.reduce((s, i) => s + i.totalPrice, 0);
  const overallMargin =
    totalServicesPrice > 0
      ? ((totalServicesPrice - totalServicesCost) / totalServicesPrice) * 100
      : 0;

  return {
    items: [], // labor carries no hardware
    serviceItems,
    totalHours,
    totalHardwareCost: 0,
    totalHardwarePrice: 0,
    totalServicesCost,
    totalServicesPrice,
    shippingCost: 0,
    shippingPrice: 0,
    grandTotalCost: totalServicesCost,
    grandTotalPrice: totalServicesPrice,
    overallMargin,
  };
}
