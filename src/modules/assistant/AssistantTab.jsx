import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addExpense,
  clearExpenses,
  deleteExpense,
  increaseBudget,
  setBudget,
} from "../../store/budgetSlice";
import { setAssistantReply } from "../../store/uiSlice";
import { calcRemaining, calcTotalSpent } from "../../utils/helpers";
import {
  DAYS_IN_MONTH,
  DAYS_PASSED,
  samplePrompts,
} from "../../utils/constants";
import Button from "../../components/Button";
import Card from "../../components/Card";
import parsePrompt from "./assistantEngine";
import ChatHistory from "./ChatHistory";
import ExpenseList from "./ExpenseList";

function createWelcomeMessage() {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    text: "Assalamu Alaikum! Ami FinVision AI. 'bus bara 80 taka' ba 'amar koto baki ache?' likhle ami bujhte parbo.",
    insight: "Help er jonno 'help' likho.",
  };
}

function AssistantTab() {
  const dispatch = useDispatch();
  const monthlyBudget = useSelector((state) => state.budget.monthlyBudget);
  const expenses = useSelector((state) => state.budget.expenses);
  const assistant = useSelector((state) => state.ui.assistant);
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([createWelcomeMessage()]);

  const totalSpent = calcTotalSpent(expenses);
  const remaining = calcRemaining(monthlyBudget, totalSpent);
  const assistantState = {
    monthly_budget: monthlyBudget,
    total_spent: totalSpent,
    remaining,
    expenses,
    days_passed: DAYS_PASSED,
    days_in_month: DAYS_IN_MONTH,
  };

  function handleSubmit(custom = message) {
    const trimmed = String(custom || "").trim();
    if (!trimmed) return;

    const userMsg = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };
    const result = parsePrompt(trimmed, assistantState);

    if (result.action === "set_budget") {
      dispatch(setBudget(result.amount));
    } else if (result.action === "add_expense") {
      dispatch(addExpense(result.transaction));
    } else if (result.action === "add_income") {
      dispatch(increaseBudget(result.amount));
    } else if (result.action === "clear_all") {
      dispatch(clearExpenses());
    }

    const assistantMsg = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: result.reply,
      insight: result.insight,
    };

    setChatLog((prev) => [...prev, userMsg, assistantMsg]);
    dispatch(
      setAssistantReply({
        reply: result.reply,
        insight: result.insight,
      }),
    );
    setMessage("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleSamplePrompt(prompt) {
    setMessage(prompt);
    handleSubmit(prompt);
  }

  function handleClearChat() {
    setChatLog([createWelcomeMessage()]);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        <Card>
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-black">Ask FinVision</h2>
              <p className="mt-1 text-sm text-slate-500">
                Bangla, Banglish, and English finance prompts bujhte pare.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="bus bara 80 taka"
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
              <Button
                onClick={() => handleSubmit()}
                disabled={!message.trim()}
                className="px-5"
                aria-label="Send message"
              >
                ▶
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSamplePrompt(prompt)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">Conversation</h2>
            <Button variant="outline" onClick={handleClearChat}>
              Clear chat
            </Button>
          </div>
          <ChatHistory chatLog={chatLog} />
        </Card>
      </div>

      <div className="space-y-5">
        <div className="rounded-3xl bg-slate-950 p-5 text-white">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">FinVision Assistant</h2>
              <p className="text-xs text-slate-400">Last reply snapshot</p>
            </div>
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">
              ● Live
            </span>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm leading-relaxed">{assistant.reply}</p>
            {assistant.insight ? (
              <p className="mt-3 whitespace-pre-line border-t border-white/10 pt-3 text-sm text-slate-300">
                💡 {assistant.insight}
              </p>
            ) : null}
          </div>
        </div>

        <Card>
          <div className="mb-4">
            <h2 className="text-xl font-black">Recent Expenses</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tap × twice to delete an entry.
            </p>
          </div>
          <ExpenseList
            expenses={expenses}
            onDelete={(id) => dispatch(deleteExpense(id))}
          />
        </Card>
      </div>
    </div>
  );
}

export default AssistantTab;
