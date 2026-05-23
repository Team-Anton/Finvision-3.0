import { useState } from "react";
import { useSelector } from "react-redux";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { DAYS_PASSED } from "../../utils/constants";
import { calcRemaining, calcTotalSpent } from "../../utils/helpers";
import CategoryPieChart from "./CategoryPieChart";
import ExportPanel from "./ExportPanel";
import SpendingChart from "./SpendingChart";
import StatsGrid from "./StatsGrid";

function SectionHeader({ title, sub }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-black">{title}</h2>
      {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
    </div>
  );
}

function EmptyDashboard() {
  return (
    <Card className="p-12 text-center">
      <div className="mb-4 text-6xl">📊</div>
      <h2 className="text-2xl font-black">Dashboard empty ache</h2>
      <p className="mx-auto mt-2 max-w-sm text-slate-500">
        Assistant ba receipt tab theke expense add korle analytics ekhane dekha jabe.
      </p>
    </Card>
  );
}

function DateFilter({ selected, onChange }) {
  const options = [
    { key: "all", label: "All time" },
    { key: "7", label: "Last 7 days" },
    { key: "14", label: "Last 14 days" },
    { key: "30", label: "This month" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.key}
          variant={selected === option.key ? "primary" : "outline"}
          onClick={() => onChange(option.key)}
          className="px-3 py-1.5 text-xs"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

function filterExpenses(expenses, range) {
  if (range === "all") return expenses;
  const days = Number(range);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return expenses.filter((expense) => {
    try {
      const parts = String(expense.date || "").split(" ");
      const day = parseInt(parts[0], 10);
      const month = new Date(`${parts[1]} 1 2026`).getMonth();
      const parsed = new Date(2026, month, day);
      if (Number.isNaN(parsed.getTime())) return true;
      return parsed >= cutoff;
    } catch {
      return true;
    }
  });
}

function SectionTabs({ selected, onChange }) {
  const tabs = [
    { key: "overview", label: "🏠 Overview" },
    { key: "charts", label: "📈 Charts" },
    { key: "categories", label: "🥧 Categories" },
    { key: "export", label: "📤 Export" },
  ];

  return (
    <div className="flex w-fit flex-wrap gap-2 rounded-2xl bg-slate-100 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${
            selected === tab.key
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function QuickInsights({ expenses, monthlyBudget }) {
  const totalSpent = calcTotalSpent(expenses);
  const remaining = calcRemaining(monthlyBudget, totalSpent);
  const spentPct = Math.round((totalSpent / Math.max(monthlyBudget, 1)) * 100);
  const dailyAvg = DAYS_PASSED ? totalSpent / DAYS_PASSED : 0;
  const projected = dailyAvg * 30;
  const overProjected = projected > monthlyBudget;
  const insights = [
    spentPct > 80 && {
      type: "warning",
      text: `⚠️ Budget er ${spentPct}% already khoroch hoyeche!`,
    },
    overProjected && {
      type: "danger",
      text: "🚨 Current rate e month shesh e budget cross korbe.",
    },
    remaining < dailyAvg * 3 && {
      type: "danger",
      text: `🔴 Remaining budget matro ${Math.floor(remaining / Math.max(dailyAvg, 1))} din er jonno.`,
    },
    !overProjected &&
      spentPct < 60 && {
        type: "success",
        text: `✅ Budget track e ache. ${Math.round(100 - spentPct)}% baki ache.`,
      },
  ].filter(Boolean);
  const colorMap = {
    warning: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    danger: "bg-red-50 text-red-800 ring-1 ring-red-200",
    success: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  };

  if (!insights.length) return null;

  return (
    <div className="space-y-2">
      {insights.map((insight) => (
        <div
          key={insight.text}
          className={`rounded-2xl px-4 py-3 text-sm font-bold ${colorMap[insight.type]}`}
        >
          {insight.text}
        </div>
      ))}
    </div>
  );
}

function DashboardTab() {
  const [section, setSection] = useState("overview");
  const [dateRange, setDateRange] = useState("all");
  const { monthlyBudget, expenses } = useSelector((s) => s.budget);
  const filteredExpenses = filterExpenses(expenses, dateRange);
  const totalSpent = calcTotalSpent(filteredExpenses);
  const remaining = calcRemaining(monthlyBudget, totalSpent);
  const rangeLabel = dateRange === "all" ? "All time" : `Last ${dateRange} days`;

  if (!expenses.length) return <EmptyDashboard />;

  return (
    <main className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionTabs selected={section} onChange={setSection} />
        <DateFilter selected={dateRange} onChange={setDateRange} />
      </div>

      <QuickInsights expenses={filteredExpenses} monthlyBudget={monthlyBudget} />

      {section === "overview" && (
        <section>
          <SectionHeader
            title="Financial Overview"
            sub={`${filteredExpenses.length} transactions · ${rangeLabel}`}
          />
          <StatsGrid
            monthlyBudget={monthlyBudget}
            totalSpent={totalSpent}
            remaining={remaining}
            expenses={filteredExpenses}
          />
        </section>
      )}

      {section === "charts" && (
        <section>
          <SectionHeader
            title="Spending Charts"
            sub="Daily, cumulative, ar category wise spending trends."
          />
          <SpendingChart expenses={filteredExpenses} monthlyBudget={monthlyBudget} />
        </section>
      )}

      {section === "categories" && (
        <section>
          <SectionHeader
            title="Category Analysis"
            sub="Kon category te beshi taka khoroch hocche."
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <CategoryPieChart expenses={filteredExpenses} />
            <SpendingChart expenses={filteredExpenses} monthlyBudget={monthlyBudget} />
          </div>
        </section>
      )}

      {section === "export" && (
        <section>
          <SectionHeader
            title="Export & Backup"
            sub="Expense data CSV, JSON, ba print e export koro."
          />
          <ExportPanel expenses={filteredExpenses} monthlyBudget={monthlyBudget} />
        </section>
      )}
    </main>
  );
}

export default DashboardTab;
