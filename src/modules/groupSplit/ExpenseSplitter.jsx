import React, { useState, useMemo } from 'react';
import { createSplitExpense, calcShares, validateSplit } from './SplitEngine';
import { MemberAvatar } from './MemberList';
import { money } from '../../utils/helpers';
import Button from '../../components/Button';
import Card from '../../components/Card';

// ─── SplitTypeSelector ──────────────────────────────────────────────────
function SplitTypeSelector({ selected, onChange }) {
  const types = [
    { key: 'equal', label: '⚖️ Equal', sub: 'Somaan bhag' },
    { key: 'custom', label: '✏️ Custom', sub: 'Nijer moto' },
    { key: 'percentage', label: '📊 Percent', sub: '% hisebe' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {types.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`rounded-2xl p-3 text-center transition border ${
            selected === t.key
              ? 'bg-slate-950 text-white border-slate-950'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
          }`}
        >
          <p className="text-sm font-black">{t.label}</p>
          <p
            className={`text-xs ${
              selected === t.key ? 'text-slate-300' : 'text-slate-400'
            }`}
          >
            {t.sub}
          </p>
        </button>
      ))}
    </div>
  );
}

// ─── MemberSelector ─────────────────────────────────────────────────────
function MemberSelector({ members, selectedIds, onChange }) {
  function toggle(id) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function selectAll() {
    onChange(members.map((m) => m.id));
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500">
          Ke ke involved? ({selectedIds.length}/{members.length})
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={selectAll}
            className="text-xs text-slate-500 hover:text-slate-700 font-bold"
          >
            All
          </button>
          <span className="text-xs text-slate-300">|</span>
          <button
            onClick={clearAll}
            className="text-xs text-slate-500 hover:text-slate-700 font-bold"
          >
            None
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {members.map((m) => {
          const isSelected = selectedIds.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-bold border flex items-center gap-1.5 transition ${
                isSelected
                  ? `${m.color.bg} ${m.color.text} border-transparent`
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}
            >
              <MemberAvatar member={m} size="sm" />
              {m.name}
              {isSelected && ' ✓'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── PayerSelector ──────────────────────────────────────────────────────
function PayerSelector({ members, selectedId, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500">Ke pay korsche?</p>
      <div className="flex flex-wrap gap-2">
        {members.map((m) => {
          const isSelected = selectedId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-bold border flex items-center gap-1.5 transition ${
                isSelected
                  ? 'bg-slate-950 text-white border-slate-950'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}
            >
              <MemberAvatar member={m} size="sm" />
              {m.name}
              {isSelected && ' 💳'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── CustomAmountInputs ─────────────────────────────────────────────────
function CustomAmountInputs({
  members,
  selectedIds,
  customAmounts,
  onChange,
  totalAmount,
  splitType,
}) {
  const selectedMembers = members.filter((m) => selectedIds.includes(m.id));
  const currentSum = selectedIds.reduce(
    (s, id) => s + Number(customAmounts[id] || 0),
    0
  );
  const target = splitType === 'percentage' ? 100 : totalAmount;
  const diff = Number((target - currentSum).toFixed(2));
  const isValid = Math.abs(diff) < 0.01;

  return (
    <div className="space-y-3">
      {selectedMembers.map((m) => (
        <div key={m.id} className="flex items-center gap-3">
          <MemberAvatar member={m} size="sm" />
          <p className="text-sm font-bold w-20 truncate">{m.name}</p>
          <div className="relative flex-1">
            <input
              type="number"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm pr-12 outline-none focus:border-slate-950"
              value={customAmounts[m.id] || ''}
              min={0}
              onChange={(e) =>
                onChange({ ...customAmounts, [m.id]: e.target.value })
              }
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
              {splitType === 'percentage' ? '%' : 'BDT'}
            </span>
          </div>
        </div>
      ))}

      {/* Sum indicator */}
      <div
        className={`rounded-xl px-3 py-2 text-xs font-bold flex justify-between ${
          isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}
      >
        <span>
          Sum:{' '}
          {splitType === 'percentage'
            ? `${currentSum.toFixed(1)}%`
            : money(currentSum)}
        </span>
        <span>
          {isValid
            ? '✅ Valid'
            : diff > 0
            ? `${splitType === 'percentage' ? `${diff.toFixed(1)}%` : money(diff)} baki`
            : `${splitType === 'percentage' ? `${Math.abs(diff).toFixed(1)}%` : money(Math.abs(diff))} beshi`}
        </span>
      </div>
    </div>
  );
}

// ─── SharePreview ───────────────────────────────────────────────────────
function SharePreview({ members, expense }) {
  if (!expense.memberIds || expense.memberIds.length === 0 || !expense.amount)
    return null;

  const shares = calcShares(expense);
  const selectedMembers = members.filter((m) =>
    expense.memberIds.includes(m.id)
  );

  return (
    <div className="rounded-2xl bg-slate-50 p-4 space-y-2">
      <p className="text-xs font-bold text-slate-500">Share preview</p>
      {selectedMembers.map((m) => {
        const share = shares[m.id] || 0;
        const pct = Math.round(
          (share / Math.max(expense.amount, 1)) * 100
        );
        return (
          <div key={m.id} className="flex items-center gap-2">
            <MemberAvatar member={m} size="sm" />
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold">{m.name}</span>
                <span className="font-black">{money(share)}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: m.color.hex,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SplitExpenseList ───────────────────────────────────────────────────
function SplitExpenseList({ expenses, members, onDelete }) {
  if (!expenses.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500">
        {expenses.length} ta expense added
      </p>
      {expenses.map((e) => {
        const payer = members.find((m) => m.id === e.paidById);
        return (
          <div
            key={e.id}
            className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              {payer && <MemberAvatar member={payer} size="sm" />}
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{e.title}</p>
                <p className="text-xs text-slate-400">
                  Paid by {payer?.name || '?'} · {e.memberIds?.length} jon split
                  · {e.date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="font-black text-sm">{money(e.amount)}</span>
              <button
                onClick={() => onDelete(e.id)}
                className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500 text-xs font-bold flex items-center justify-center transition"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── ExpenseSplitter (DEFAULT EXPORT) ───────────────────────────────────
function ExpenseSplitter({ members, expenses, onAdd, onDelete }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState(members[0]?.id || '');
  const [memberIds, setMemberIds] = useState(members.map((m) => m.id));
  const [splitType, setSplitType] = useState('equal');
  const [customAmounts, setCustomAmounts] = useState({});
  const [error, setError] = useState('');

  const previewExpense = useMemo(
    () => ({
      amount: Number(amount) || 0,
      memberIds,
      splitType,
      customAmounts,
    }),
    [amount, memberIds, splitType, customAmounts]
  );

  function handleAdd() {
    const expense = createSplitExpense({
      title,
      amount: Number(amount),
      paidById: paidById || members[0]?.id,
      memberIds,
      splitType,
      customAmounts,
    });
    const { valid, error: err } = validateSplit(expense);
    if (!valid) {
      setError(err);
      return;
    }
    onAdd(expense);
    setTitle('');
    setAmount('');
    setCustomAmounts({});
    setError('');
  }

  if (!members.length) {
    return (
      <Card className="p-8 text-center">
        <p className="text-5xl mb-3">➕</p>
        <p className="font-black text-slate-700">Aghe member add koro</p>
        <p className="text-sm text-slate-400 mt-1">
          Member add korle expense split kora jabe.
        </p>
      </Card>
    );
  }

  return (
    <Card padding={false} className="p-6">
      {/* Header */}
      <h3 className="text-lg font-black">Add Group Expense</h3>
      <p className="text-xs text-slate-400">Expense add kore split koro.</p>

      {/* Form */}
      <div className="mt-4 space-y-4">
        {/* Title + Amount */}
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500">
              Expense title
            </label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-950"
              placeholder="e.g. Lunch, Rickshaw, Hotel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">
              Amount (BDT)
            </label>
            <input
              type="number"
              className="mt-1 w-32 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-950"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        {/* Payer */}
        <PayerSelector
          members={members}
          selectedId={paidById || members[0]?.id}
          onChange={setPaidById}
        />

        {/* Split type */}
        <div>
          <p className="text-xs font-bold text-slate-500 mb-2">Split type</p>
          <SplitTypeSelector
            selected={splitType}
            onChange={(t) => {
              setSplitType(t);
              setCustomAmounts({});
            }}
          />
        </div>

        {/* Member selector */}
        <MemberSelector
          members={members}
          selectedIds={memberIds}
          onChange={setMemberIds}
        />

        {/* Custom / Percentage inputs */}
        {(splitType === 'custom' || splitType === 'percentage') && (
          <CustomAmountInputs
            members={members}
            selectedIds={memberIds}
            customAmounts={customAmounts}
            onChange={setCustomAmounts}
            totalAmount={Number(amount) || 0}
            splitType={splitType}
          />
        )}

        {/* Share preview */}
        <SharePreview members={members} expense={previewExpense} />

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 font-bold px-1">{error}</p>
        )}

        {/* Submit */}
        <Button
          className="w-full"
          onClick={handleAdd}
          disabled={!title.trim() || !amount || !memberIds.length}
        >
          + Add expense
        </Button>
      </div>

      {/* Expense list */}
      {expenses.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <SplitExpenseList
            expenses={expenses}
            members={members}
            onDelete={onDelete}
          />
        </div>
      )}
    </Card>
  );
}

export default ExpenseSplitter;
