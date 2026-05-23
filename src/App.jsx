import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setActiveTab } from "./store/uiSlice";
import { navTabs, LOCAL_STORAGE_KEY } from "./utils/constants";
import {
  calcTotalSpent,
  calcRemaining,
  calcHealthScore,
  money,
} from "./utils/helpers";
import Button from "./components/Button";
import Card from "./components/Card";
import AssistantTab from "./modules/assistant/AssistantTab";
import DashboardTab from "./modules/dashboard/DashboardTab";
import ReceiptTab from "./modules/receipt/ReceiptTab";
import GroupSplitTab from "./modules/groupSplit/GroupSplitTab";

function usePersist(monthlyBudget, expenses) {
  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ monthlyBudget, expenses }),
    );
  }, [monthlyBudget, expenses]);
}

function useSummaryCards(monthlyBudget, totalSpent, remaining, expenses) {
  const dailyAvg = totalSpent / 12;
  return [
    {
      icon: "💼",
      label: "Budget",
      value: money(monthlyBudget),
      help: "Editable through prompt",
    },
    {
      icon: "📉",
      label: "Spent",
      value: money(totalSpent),
      help: `${money(Math.round(dailyAvg))}/day burn rate`,
    },
    {
      icon: "🛡️",
      label: "Remaining",
      value: money(remaining),
      help: "Live remaining balance",
    },
    {
      icon: "🧾",
      label: "Transactions",
      value: expenses.length,
      help: "Saved in local browser",
    },
  ];
}

function App() {
  const dispatch = useDispatch();
  const monthlyBudget = useSelector((state) => state.budget.monthlyBudget);
  const expenses = useSelector((state) => state.budget.expenses);
  const activeTab = useSelector((state) => state.ui.activeTab);

  const totalSpent = calcTotalSpent(expenses);
  const remaining = calcRemaining(monthlyBudget, totalSpent);
  const healthScore = calcHealthScore(remaining, monthlyBudget);

  usePersist(monthlyBudget, expenses);

  const summaryCards = useSummaryCards(
    monthlyBudget,
    totalSpent,
    remaining,
    expenses,
  );

  function renderTab() {
    switch (activeTab) {
      case "assistant":
        return <AssistantTab />;
      case "dashboard":
        return <DashboardTab />;
      case "receipt":
        return <ReceiptTab />;
      case "group":
        return <GroupSplitTab />;
      case "store":
        return (
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-black">Store Ready</h2>
            <p className="mt-2 text-slate-500">
              Core preview ready. Use Assistant and Receipt tabs for main demo.
            </p>
          </Card>
        );
      default:
        return (
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-black">Unknown tab</h2>
            <p className="mt-2 text-slate-500">This tab is not wired yet.</p>
          </Card>
        );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-3xl bg-white/10 p-4 text-3xl">💳</div>
              <div>
                <p className="inline-block rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-200">
                  ✦ AI Powered Preview
                </p>
                <h1 className="mt-2 text-4xl font-black">FinVision AI</h1>
                <p className="text-sm text-slate-300">
                  Bangla/Banglish finance assistant with receipt OCR, budgeting,
                  burn-rate, and group split.
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-slate-300">Health score</p>
              <p className="text-4xl font-black">{healthScore}</p>
            </div>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
          {navTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "primary" : "outline"}
              onClick={() => dispatch(setActiveTab(tab.key))}
            >
              {tab.label}
            </Button>
          ))}
        </nav>

        <section className="grid gap-4 md:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.label} className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-2xl">
                  {card.icon}
                </div>
                <div>
                  <p className="text-xs text-slate-500">{card.label}</p>
                  <p className="text-2xl font-black">{card.value}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">{card.help}</p>
            </Card>
          ))}
        </section>

        {renderTab()}
      </div>
    </div>
  );
}

export default App;
