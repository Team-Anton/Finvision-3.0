import React from 'react';
import { useSelector } from 'react-redux';
import { money, calcTotalSpent, calcRemaining } from '../../utils/helpers';

function ImpactMeter({ before, after, max }) {
  const beforePct = Math.min((before / Math.max(max, 1)) * 100, 100);
  const afterPct = Math.min((after / Math.max(max, 1)) * 100, 100);
  const overBudget = after > max;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>0</span>
        <span>{money(max)}</span>
      </div>
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="absolute inset-y-0 left-0 bg-slate-400" style={{ width: `${beforePct}%` }} />
        <div
          className={`absolute inset-y-0 left-0 opacity-70 transition-all duration-500 ${
            overBudget ? 'bg-red-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${afterPct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">Before: {Math.round(beforePct)}%</span>
        <span className={overBudget ? 'font-bold text-red-500' : 'font-bold text-emerald-600'}>
          After: {Math.round(afterPct)}%{overBudget ? ' ⚠️ Over budget!' : ''}
        </span>
      </div>
    </div>
  );
}

function StatCell({ label, value, highlight, color }) {
  const colorMap = {
    default: 'bg-white/10',
    green: 'bg-emerald-400/15',
    amber: 'bg-amber-400/15',
    blue: 'bg-sky-400/15',
    red: 'bg-red-400/15',
  };

  return (
    <div className={`rounded-xl p-3 ${colorMap[color] || colorMap.default}`}>
      <p className="text-xs text-slate-300">{label}</p>
      <p className={highlight ? 'text-lg font-black' : 'text-sm font-bold'}>{value}</p>
    </div>
  );
}

function CategoryBreakdown({ items }) {
  if (!items.length) return null;

  const breakdown = items.reduce((acc, item) => {
    const amount = Number(item.amount || 0);
    if (amount <= 0) return acc;
    acc[item.category] = (acc[item.category] || 0) + amount;
    return acc;
  }, {});

  const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const sorted = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

  if (!sorted.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-300">Category breakdown</p>
      {sorted.map(([category, amount]) => {
        const pct = Math.round((amount / Math.max(total, 1)) * 100);
        return (
          <div key={category} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">{category}</span>
              <span className="font-bold text-white">
                {money(amount)} ({pct}%)
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WarningBanner({ receiptTotal, remaining }) {
  if (receiptTotal <= 0) return null;
  const overBudget = receiptTotal > remaining;
  const nearLimit = !overBudget && receiptTotal > remaining * 0.8;

  if (!overBudget && !nearLimit) return null;

  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm font-bold ${
        overBudget ? 'bg-red-400/20 text-red-300' : 'bg-amber-400/20 text-amber-300'
      }`}
    >
      {overBudget
        ? `⚠️ Budget ${money(receiptTotal - remaining)} cross korbe!`
        : '⚡ Receipt add korle remaining er 80% shesh hobe.'}
    </div>
  );
}

function EmptyImpact() {
  return (
    <div className="py-8 text-center">
      <div className="text-4xl">📊</div>
      <p className="mt-2 text-sm text-slate-400">Receipt extract korle ekhane budget impact dekhabe.</p>
    </div>
  );
}

function BudgetImpactPanel({ receiptItems = [] }) {
  const { monthlyBudget, expenses } = useSelector((state) => state.budget);

  const totalSpent = calcTotalSpent(expenses);
  const remaining = calcRemaining(monthlyBudget, totalSpent);
  const receiptTotal = receiptItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const afterSpent = totalSpent + receiptTotal;
  const afterRemaining = Math.max(monthlyBudget - afterSpent, 0);

  return (
    <div className="space-y-5 rounded-3xl bg-slate-950 p-5 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-black">Budget Impact</p>
          <p className="text-xs text-slate-400">Receipt add korle ki hobe preview</p>
        </div>
        <span className="rounded-full bg-white/10 px-2 py-1 text-xs">Live</span>
      </div>

      {receiptItems.length === 0 ? (
        <EmptyImpact />
      ) : (
        <div className="space-y-5">
          <WarningBanner receiptTotal={receiptTotal} remaining={remaining} />
          <ImpactMeter before={totalSpent} after={afterSpent} max={monthlyBudget} />

          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            <StatCell label="Monthly budget" value={money(monthlyBudget)} />
            <StatCell label="Already spent" value={money(totalSpent)} />
            <StatCell label="Current remaining" value={money(remaining)} />
            <StatCell label="This receipt" value={money(receiptTotal)} highlight color="green" />
            <StatCell label="After add — spent" value={money(afterSpent)} color="amber" />
            <StatCell
              label="After add — left"
              value={money(afterRemaining)}
              color={afterRemaining > 0 ? 'blue' : 'red'}
            />
          </div>

          <CategoryBreakdown items={receiptItems} />
        </div>
      )}
    </div>
  );
}

export default BudgetImpactPanel;
