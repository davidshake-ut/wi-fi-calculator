'use client';

import { Wifi, DollarSign, TrendingUp, Network } from 'lucide-react';
import { Card } from '@/components/ui/primitives';
import { currency, percent, marginBg } from '@/lib/format';

export default function SummaryCards({ bom, term }) {
  const profit = bom.grandTotalPrice - bom.grandTotalCost;

  // Fix #2 — only add an aggregate switch to the count when one actually exists.
  const switchCount = bom.totalIdfSwitches + (bom.needsAggSwitch ? 1 : 0);
  const switchSub = bom.needsAggSwitch
    ? '+ 1 Aggregate switch'
    : 'Single-switch deployment';

  const cards = [
    {
      label: 'Total Access Points',
      value: bom.totalAPs,
      sub: `${bom.guestRoomAPs} ${term.summaryUnit} APs`,
      icon: Wifi,
      iconClass: 'bg-blue-50 text-blue-600',
      tone: 'bg-white border-slate-200/70',
    },
    {
      label: 'Total Sell Price',
      value: currency(bom.grandTotalPrice),
      sub: `Cost: ${currency(bom.grandTotalCost)}`,
      icon: DollarSign,
      iconClass: 'bg-emerald-50 text-emerald-600',
      tone: 'bg-white border-slate-200/70',
    },
    {
      label: 'Gross Margin',
      value: percent(bom.overallMargin),
      sub: `Profit: ${currency(profit)}`,
      icon: TrendingUp,
      iconClass: 'bg-violet-50 text-violet-600',
      tone: marginBg(bom.overallMargin),
    },
    {
      label: 'IDF Switches',
      value: switchCount,
      sub: switchSub,
      icon: Network,
      iconClass: 'bg-amber-50 text-amber-600',
      tone: 'bg-white border-slate-200/70',
    },
  ];

  return (
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
  );
}
