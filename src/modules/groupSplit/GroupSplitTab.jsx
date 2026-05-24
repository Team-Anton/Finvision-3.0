import React, { useState, useMemo } from 'react';
import { getGroupStats, createMember } from './SplitEngine';
import MemberList from './MemberList';
import ExpenseSplitter from './ExpenseSplitter';
import SettlementSummary from './SettlementSummary';
import { money } from '../../utils/helpers';
import Card from '../../components/Card';
import Button from '../../components/Button';

// ─── PRESETS ────────────────────────────────────────────────────────────
const PRESETS = [
  {
    key: 'trip',
    label: '✈️ Trip',
    sub: 'Travel group er jonno',
    members: ['Rahim', 'Karim', 'Sadia', 'Nadia'],
  },
  {
    key: 'roommates',
    label: '🏠 Roommates',
    sub: 'Basha share er jonno',
    members: ['Rafi', 'Arif', 'Toma'],
  },
  {
    key: 'friends',
    label: '👫 Friends',
    sub: 'Bondhura miley khoroch',
    members: ['Mitu', 'Ritu', 'Titu'],
  },
];

// ─── PresetSelector ─────────────────────────────────────────────────────
function PresetSelector({ onPreset }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-slate-500">
        Quick start — preset choose koro:
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            onClick={() => onPreset(preset)}
            className="rounded-2xl border-2 border-slate-200 bg-white p-4 text-left hover:border-slate-950 hover:bg-slate-50 transition"
          >
            <p className="font-black">{preset.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{preset.sub}</p>
            <div className="mt-2 flex gap-1 flex-wrap">
              {preset.members.map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                >
                  {name}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── TopStatsBanner ─────────────────────────────────────────────────────
function TopStatsBanner({ members, expenses }) {
  const stats = getGroupStats(members, expenses);
  if (!members.length) return null;

  return (
    <div className="rounded-3xl bg-slate-950 p-5 text-white">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* LEFT */}
        <div>
          <p className="text-xs text-slate-400">Group total</p>
          <p className="text-3xl font-black">{money(stats.totalExpenses)}</p>
          {stats.memberCount > 0 && (
            <p className="text-sm text-slate-300 mt-0.5">
              {money(stats.perPerson)} per person · {stats.memberCount} members
            </p>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex gap-3 flex-wrap">
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
            <p className="text-xs text-slate-400">Expenses</p>
            <p className="text-2xl font-black">{stats.expenseCount}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
            <p className="text-xs text-slate-400">Settlements</p>
            <p className="text-2xl font-black">{stats.settlementCount}</p>
          </div>
          <div
            className={`rounded-2xl px-4 py-3 text-center ${
              stats.isSettled && stats.expenseCount > 0
                ? 'bg-emerald-400/20'
                : 'bg-white/10'
            }`}
          >
            <p className="text-xs text-slate-400">Status</p>
            <p className="text-2xl font-black">
              {stats.expenseCount === 0
                ? '—'
                : stats.isSettled
                ? '✅ Settled'
                : '⏳ Pending'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SectionTabs ────────────────────────────────────────────────────────
function SectionTabs({ selected, onChange, expenseCount }) {
  const tabs = [
    { key: 'split', label: '➕ Add Expense' },
    {
      key: 'settle',
      label: `🧮 Settle Up${expenseCount ? ` (${expenseCount})` : ''}`,
    },
  ];

  return (
    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
            selected === tab.key
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── ResetButton ────────────────────────────────────────────────────────
function ResetButton({ onReset }) {
  const [confirm, setConfirm] = useState(false);

  function handleClick() {
    if (confirm) {
      onReset();
      setConfirm(false);
    } else {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
    }
  }

  return (
    <Button
      variant={confirm ? 'danger' : 'outline'}
      className="text-xs"
      onClick={handleClick}
    >
      {confirm ? '⚠️ Confirm reset?' : '🗑️ Reset group'}
    </Button>
  );
}

// ─── WelcomeScreen ──────────────────────────────────────────────────────
function WelcomeScreen({ onPreset }) {
  return (
    <Card className="p-8">
      <div className="text-center mb-6">
        <p className="text-6xl mb-3">👥</p>
        <h2 className="text-2xl font-black">Group Split</h2>
        <p className="text-slate-500 mt-2 max-w-md mx-auto">
          Trip, roommates, ba bondhura miley khoroch split koro. Minimum
          transactions e settle korar plan automatically banabe.
        </p>
      </div>
      <PresetSelector onPreset={onPreset} />
    </Card>
  );
}

// ─── HowItWorks ─────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      icon: '👥',
      title: 'Members add koro',
      sub: 'Group er shobai ke add koro',
    },
    {
      icon: '💸',
      title: 'Expense add koro',
      sub: 'Ke pay korlo, ke ke involved',
    },
    {
      icon: '⚖️',
      title: 'Split choose koro',
      sub: 'Equal, custom, ba percentage',
    },
    {
      icon: '🧮',
      title: 'Settle up',
      sub: 'Minimum payments e plan dekhao',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {steps.map((step) => (
        <div
          key={step.title}
          className="rounded-2xl bg-slate-50 p-4 text-center"
        >
          <p className="text-3xl mb-2">{step.icon}</p>
          <p className="text-sm font-black">{step.title}</p>
          <p className="text-xs text-slate-400 mt-1">{step.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── GroupSplitTab (DEFAULT EXPORT) ─────────────────────────────────────
function GroupSplitTab() {
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [section, setSection] = useState('split');
  const [showWelcome, setShowWelcome] = useState(true);

  const stats = useMemo(
    () => getGroupStats(members, expenses),
    [members, expenses]
  );

  function handlePreset(preset) {
    const newMembers = preset.members.map((name, i) => createMember(name, i));
    setMembers(newMembers);
    setExpenses([]);
    setShowWelcome(false);
  }

  function handleAddMember(member) {
    setMembers((prev) => [...prev, member]);
    setShowWelcome(false);
  }

  function handleDeleteMember(id) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setExpenses((prev) =>
      prev.filter(
        (e) =>
          e.paidById !== id && !(e.memberIds || []).includes(id)
      )
    );
  }

  function handleAddExpense(expense) {
    setExpenses((prev) => [...prev, expense]);
    if (stats.settlementCount === 0) setSection('settle');
  }

  function handleDeleteExpense(id) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  function handleReset() {
    setMembers([]);
    setExpenses([]);
    setShowWelcome(true);
    setSection('split');
  }

  // ─── Welcome view ─────────────────────────────────────────────
  if (showWelcome && members.length === 0) {
    return (
      <main className="space-y-5">
        <WelcomeScreen onPreset={handlePreset} />
        <HowItWorks />
        <Card padding={false} className="p-6">
          <h3 className="text-lg font-black">Ba manually shuru koro</h3>
          <p className="text-xs text-slate-400">
            Nijer moto member add kore shuru koro.
          </p>
          <div className="mt-4">
            <MemberList
              members={members}
              expenses={expenses}
              onAdd={handleAddMember}
              onDelete={handleDeleteMember}
            />
          </div>
        </Card>
      </main>
    );
  }

  // ─── Main view ────────────────────────────────────────────────
  return (
    <main className="space-y-5">
      <TopStatsBanner members={members} expenses={expenses} />

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTabs
          selected={section}
          onChange={setSection}
          expenseCount={expenses.length}
        />
        <ResetButton onReset={handleReset} />
      </div>

      {/* Main grid */}
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Left */}
        <MemberList
          members={members}
          expenses={expenses}
          onAdd={handleAddMember}
          onDelete={handleDeleteMember}
        />

        {/* Right */}
        {section === 'split' && (
          <ExpenseSplitter
            members={members}
            expenses={expenses}
            onAdd={handleAddExpense}
            onDelete={handleDeleteExpense}
          />
        )}
        {section === 'settle' && (
          <SettlementSummary members={members} expenses={expenses} />
        )}
      </div>
    </main>
  );
}

export default GroupSplitTab;
