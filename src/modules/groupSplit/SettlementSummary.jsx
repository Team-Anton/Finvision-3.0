import React, { useState } from 'react';
import {
  calcSettlements,
  getMemberSummary,
  getGroupStats,
} from './SplitEngine';
import { MemberAvatar } from './MemberList';
import { money } from '../../utils/helpers';
import Card from '../../components/Card';
import Button from '../../components/Button';

// ─── SettlementCard ─────────────────────────────────────────────────────
function SettlementCard({ settlement, index, onMark, isMarked }) {
  return (
    <div
      className={`rounded-2xl p-4 transition ring-1 ${
        isMarked
          ? 'bg-emerald-50 ring-emerald-200'
          : 'bg-white ring-slate-200 hover:ring-slate-300'
      }`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {/* Step number */}
        <div className="w-7 h-7 rounded-full bg-slate-950 text-white text-xs font-black flex items-center justify-center">
          {index + 1}
        </div>

        {/* From */}
        <div className="flex items-center gap-2">
          <MemberAvatar member={settlement.from} size="sm" />
          <span className="font-black text-sm">{settlement.from.name}</span>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">pays</span>
          <span className="rounded-full bg-slate-950 text-white px-3 py-1 text-sm font-black">
            {money(settlement.amount)}
          </span>
          <span className="text-slate-400">to</span>
        </div>

        {/* To */}
        <div className="flex items-center gap-2">
          <MemberAvatar member={settlement.to} size="sm" />
          <span className="font-black text-sm">{settlement.to.name}</span>
        </div>

        {/* Mark done button */}
        <button
          onClick={() => onMark(settlement.id)}
          className={`ml-auto shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
            isMarked
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {isMarked ? '✅ Done' : 'Mark done'}
        </button>
      </div>
    </div>
  );
}

// ─── MemberBalanceRow ───────────────────────────────────────────────────
function MemberBalanceRow({ summary }) {
  const isPositive = summary.balance > 0.01;
  const isNegative = summary.balance < -0.01;
  const isSettled = !isPositive && !isNegative;

  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 hover:bg-slate-100 transition">
      <div className="flex items-center gap-3">
        <MemberAvatar member={summary} size="md" />
        <div>
          <p className="font-bold text-sm">{summary.name}</p>
          <p className="text-xs text-slate-400">
            Paid {money(summary.paid)} · Owes {money(summary.owed)}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0 ml-3">
        <p
          className={`font-black text-sm ${
            isPositive
              ? 'text-emerald-600'
              : isNegative
              ? 'text-red-500'
              : 'text-slate-400'
          }`}
        >
          {isPositive
            ? `+${money(summary.balance)}`
            : isNegative
            ? money(summary.balance)
            : 'Settled'}
        </p>
        <p className="text-xs text-slate-400">
          {isPositive ? 'gets back' : isNegative ? 'owes' : '✅'}
        </p>
      </div>
    </div>
  );
}

// ─── GroupStatsBar ──────────────────────────────────────────────────────
function GroupStatsBar({ stats }) {
  const items = [
    { label: 'Total expenses', value: money(stats.totalExpenses) },
    { label: 'Per person', value: money(stats.perPerson) },
    { label: 'Transactions', value: stats.expenseCount },
    { label: 'Settlements needed', value: stats.settlementCount },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-400">{item.label}</p>
          <p className="font-black text-lg mt-0.5">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── AllSettledBanner ────────────────────────────────────────────────────
function AllSettledBanner() {
  return (
    <div className="rounded-3xl bg-emerald-50 ring-1 ring-emerald-200 p-8 text-center">
      <p className="text-5xl mb-3">🎉</p>
      <p className="text-xl font-black text-emerald-800">
        Sob settle hoyeche!
      </p>
      <p className="text-sm text-emerald-600 mt-1">
        Group er keu karo kache theke taka pabe na.
      </p>
    </div>
  );
}

// ─── EmptySettlement ────────────────────────────────────────────────────
function EmptySettlement() {
  return (
    <div className="py-10 text-center">
      <p className="text-5xl mb-3">🧮</p>
      <p className="font-bold text-slate-700">Kono expense nei</p>
      <p className="text-sm text-slate-400 mt-1">
        Expense add korle settlement plan dekhabe.
      </p>
    </div>
  );
}

// ─── SettlementProgress ─────────────────────────────────────────────────
function SettlementProgress({ total, marked }) {
  if (!total) return null;
  const pct = Math.round((marked / total) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500 font-bold">Settlement progress</span>
        <span className="font-black">
          {marked}/{total} done
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── CopySettlementButton ───────────────────────────────────────────────
function CopySettlementButton({ settlements }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const text = settlements
      .map(
        (s, i) =>
          `${i + 1}. ${s.from.name} pays ${money(s.amount)} to ${s.to.name}`
      )
      .join('\n');
    const full = `FinVision AI — Group Settlement Plan\n\n${text}\n\nTotal: ${settlements.length}`;
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Button
      variant={copied ? 'success' : 'outline'}
      disabled={!settlements.length}
      onClick={handleCopy}
    >
      {copied ? '✅ Copied!' : '📋 Copy plan'}
    </Button>
  );
}

// ─── SettlementSummary (DEFAULT EXPORT) ─────────────────────────────────
function SettlementSummary({ members, expenses }) {
  const [markedIds, setMarkedIds] = useState([]);
  const [showBalances, setShowBalances] = useState(true);

  const settlements = calcSettlements(members, expenses);
  const memberSummaries = getMemberSummary(members, expenses);
  const stats = getGroupStats(members, expenses);

  function toggleMark(id) {
    setMarkedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function resetAll() {
    setMarkedIds([]);
  }

  const allDone =
    settlements.length > 0 &&
    settlements.every((s) => markedIds.includes(s.id));

  return (
    <Card padding={false} className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-black">Settlement Plan</h3>
          <p className="text-xs text-slate-400">
            Minimum transactions e settle korar plan.
          </p>
        </div>
        <div className="flex gap-2">
          <CopySettlementButton settlements={settlements} />
          {markedIds.length > 0 && (
            <Button variant="outline" onClick={resetAll}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {expenses.length > 0 && <GroupStatsBar stats={stats} />}

      {/* Main content */}
      {expenses.length === 0 ? (
        <EmptySettlement />
      ) : allDone || stats.isSettled ? (
        <AllSettledBanner />
      ) : (
        <>
          <SettlementProgress
            total={settlements.length}
            marked={markedIds.length}
          />
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500">
              {settlements.length} ta payment needed
            </p>
            {settlements.map((s, i) => (
              <SettlementCard
                key={s.id}
                settlement={s}
                index={i}
                onMark={toggleMark}
                isMarked={markedIds.includes(s.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Individual balances */}
      {members.length > 0 && expenses.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <button
            onClick={() => setShowBalances((v) => !v)}
            className="flex items-center justify-between w-full"
          >
            <span className="text-xs font-bold text-slate-500">
              Individual balances
            </span>
            <span className="text-xs text-slate-400">
              {showBalances ? '▲ Hide' : '▼ Show'}
            </span>
          </button>
          {showBalances && (
            <div className="space-y-2">
              {memberSummaries.map((s) => (
                <MemberBalanceRow key={s.id} summary={s} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default SettlementSummary;
