'use client';

import { RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/primitives';
import { currency, percent, marginColor } from '@/lib/format';

export default function ServicesTable({
  bom,
  title = 'Professional Services',
  serviceOverrides,
  setServiceOverrides,
  showMargin,
  editServices,
}) {
  const setOverride = (sku, patch, current) => {
    setServiceOverrides((prev) => ({
      ...prev,
      [sku]: {
        cost: current.unitCost,
        price: current.unitPrice,
        ...prev[sku],
        ...patch,
      },
    }));
  };

  const resetOverride = (sku) => {
    setServiceOverrides((prev) => {
      const next = { ...prev };
      delete next[sku];
      return next;
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
              <th className="px-4 py-2 font-medium">Service</th>
              {showMargin && <th className="px-4 py-2 text-right font-medium">Cost</th>}
              <th className="px-4 py-2 text-right font-medium">Price</th>
              {showMargin && <th className="px-4 py-2 text-right font-medium">Margin</th>}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {bom.serviceItems.map((s) => {
              const overridden = Boolean(serviceOverrides[s.sku]);
              return (
                <tr
                  key={s.sku}
                  className={`border-b border-slate-50 last:border-0 ${overridden ? 'bg-orange-50/50' : ''}`}
                >
                  <td className="px-4 py-2 text-slate-700">
                    {s.description}
                    {s.note && <span className="block text-xs italic text-slate-400">{s.note}</span>}
                  </td>
                  {showMargin && (
                    <td className="px-4 py-2 text-right tabular-nums text-slate-500">
                      {editServices ? (
                        <input
                          type="number"
                          className="h-7 w-24 rounded border border-slate-300 px-2 text-right text-xs"
                          value={s.unitCost}
                          onChange={(e) => setOverride(s.sku, { cost: Number(e.target.value) }, s)}
                        />
                      ) : (
                        currency(s.unitCost)
                      )}
                    </td>
                  )}
                  <td className="px-4 py-2 text-right font-medium tabular-nums text-slate-700">
                    {editServices ? (
                      <input
                        type="number"
                        className="h-7 w-24 rounded border border-slate-300 px-2 text-right text-xs"
                        value={s.unitPrice}
                        onChange={(e) => setOverride(s.sku, { price: Number(e.target.value) }, s)}
                      />
                    ) : (
                      currency(s.unitPrice)
                    )}
                  </td>
                  {showMargin && (
                    <td className="px-4 py-2 text-right">
                      <span className={`rounded px-1.5 py-0.5 text-xs tabular-nums ${marginColor(s.margin)}`}>
                        {percent(s.margin, 0)}
                      </span>
                    </td>
                  )}
                  <td className="px-2">
                    {overridden && (
                      <button
                        title="Reset to default"
                        onClick={() => resetOverride(s.sku)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 font-semibold">
              <td className="px-4 py-2.5 text-slate-700">Services Subtotal</td>
              {showMargin && (
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                  {currency(bom.totalServicesCost)}
                </td>
              )}
              <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{currency(bom.totalServicesPrice)}</td>
              {showMargin && <td />}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
