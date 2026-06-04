'use client';

import { Card } from '@/components/ui/primitives';
import { currency, percent, marginColor, marginBg } from '@/lib/format';

function marginOf(cost, price) {
  return price > 0 ? ((price - cost) / price) * 100 : 0;
}

export default function CostSummary({ bom }) {
  const rows = [
    {
      label: 'Hardware & Software',
      cost: bom.totalHardwareCost,
      price: bom.totalHardwarePrice,
    },
    {
      label: 'Professional Services',
      cost: bom.totalServicesCost,
      price: bom.totalServicesPrice,
    },
    {
      label: 'Estimated Shipping (7%)',
      cost: bom.shippingCost,
      price: bom.shippingPrice,
    },
  ];

  const profit = bom.grandTotalPrice - bom.grandTotalCost;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 text-right font-medium">Our Cost</th>
              <th className="px-4 py-2 text-right font-medium">Client Price</th>
              <th className="px-4 py-2 text-right font-medium">Margin</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-slate-50">
                <td className="px-4 py-2.5 text-slate-700">{r.label}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                  {currency(r.cost)}
                </td>
                <td className="px-4 py-2.5 text-right font-medium tabular-nums text-slate-700">
                  {currency(r.price)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`rounded px-1.5 py-0.5 text-xs tabular-nums ${marginColor(marginOf(r.cost, r.price))}`}>
                    {percent(marginOf(r.cost, r.price), 0)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 text-base font-bold">
              <td className="px-4 py-3 text-slate-800">Total Project Estimate</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                {currency(bom.grandTotalCost)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-blue-700">
                {currency(bom.grandTotalPrice)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {percent(bom.overallMargin)}
              </td>
            </tr>
          </tfoot>
        </table>
      </Card>

      <Card className={`flex items-center justify-between p-4 ${marginBg(bom.overallMargin)}`}>
        <span className="text-sm font-medium text-slate-600">Gross Profit</span>
        <span className="text-2xl font-bold tabular-nums text-slate-900">{currency(profit)}</span>
      </Card>

      <p className="px-1 text-xs italic text-slate-400">
        * Budgetary estimate only. Final pricing may vary. Valid for 30 days.
      </p>
    </div>
  );
}
