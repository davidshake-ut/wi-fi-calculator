'use client';

import { Camera, HardDrive, DollarSign, TrendingUp, Video } from 'lucide-react';
import { Card } from '@/components/ui/primitives';
import BOMTable from '@/components/BOMTable';
import { currency, percent, marginBg } from '@/lib/format';

export default function CameraSystems({ cameraBom, showMargin, setShowMargin }) {
  const profit = cameraBom.grandTotalPrice - cameraBom.grandTotalCost;
  const retentionLabel = cameraBom.retention === 'week' ? '~1 week (2TB)' : '~1 month (8TB)';

  const cards = [
    {
      label: 'Total Cameras',
      value: cameraBom.totalCameras,
      sub: `${cameraBom.nvrCount} NVR${cameraBom.nvrCount === 1 ? '' : 's'} (8-ch)`,
      icon: Camera,
      iconClass: 'bg-blue-50 text-blue-600',
      tone: 'bg-white border-slate-200/70',
    },
    {
      label: 'Storage / Retention',
      value: `${cameraBom.nvrCount} HDD`,
      sub: retentionLabel,
      icon: HardDrive,
      iconClass: 'bg-amber-50 text-amber-600',
      tone: 'bg-white border-slate-200/70',
    },
    {
      label: 'Total Sell Price',
      value: currency(cameraBom.grandTotalPrice),
      sub: `Cost: ${currency(cameraBom.grandTotalCost)}`,
      icon: DollarSign,
      iconClass: 'bg-emerald-50 text-emerald-600',
      tone: 'bg-white border-slate-200/70',
    },
    {
      label: 'Gross Margin',
      value: percent(cameraBom.overallMargin),
      sub: `Profit: ${currency(profit)}`,
      icon: TrendingUp,
      iconClass: 'bg-violet-50 text-violet-600',
      tone: marginBg(cameraBom.overallMargin),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className={`p-4 ${c.tone}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-slate-500">{c.label}</p>
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${c.iconClass}`}>
                  <Icon size={15} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-slate-900">
                {c.value}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{c.sub}</p>
            </Card>
          );
        })}
      </div>

      {cameraBom.totalCameras === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Video size={22} />
          </span>
          <p className="text-sm font-medium text-slate-700">No cameras added yet</p>
          <p className="max-w-xs text-xs text-slate-400">
            Enter camera quantities and a retention period in the panel on the left to build a
            camera-system BOM.
          </p>
        </Card>
      ) : (
        <>
          <BOMTable bom={cameraBom} showMargin={showMargin} setShowMargin={setShowMargin} />

          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-slate-50">
                  <td className="px-4 py-2.5 text-slate-700">Hardware Subtotal</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                    {currency(cameraBom.totalHardwarePrice)}
                  </td>
                </tr>
                {cameraBom.totalServicesPrice > 0 && (
                  <tr className="border-b border-slate-50">
                    <td className="px-4 py-2.5 text-slate-700">
                      Professional Services
                      <span className="ml-1 text-xs text-slate-400">(see Services tab)</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                      {currency(cameraBom.totalServicesPrice)}
                    </td>
                  </tr>
                )}
                <tr className="border-b border-slate-50">
                  <td className="px-4 py-2.5 text-slate-700">Estimated Shipping (7%)</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                    {currency(cameraBom.shippingPrice)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 text-base font-bold">
                  <td className="px-4 py-3 text-slate-800">Total Camera System Estimate</td>
                  <td className="px-4 py-3 text-right tabular-nums text-blue-700">
                    {currency(cameraBom.grandTotalPrice)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </Card>

          <p className="px-1 text-xs italic text-slate-400">
            * Budgetary estimate only. Final pricing may vary. Valid for 30 days.
          </p>
        </>
      )}
    </div>
  );
}
