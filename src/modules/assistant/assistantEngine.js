import {
  createId,
  detectCategory,
  money,
  parseNumber,
} from "../../utils/helpers";

function detectIntent(text) {
  if (/(clear|reset|sob bad|shob bad)/i.test(text)) return "clear_all";
  if (/(income|salary|paisi|pelam|allowance|refund|joma)/i.test(text)) {
    return "add_income";
  }
  if (/(budget|bajet|set)/i.test(text)) return "set_budget";
  if (/(baki|remaining|left|balance|koto baki)/i.test(text)) {
    return "check_balance";
  }
  if (/(afford|parbo|kinte parbo|can i)/i.test(text)) return "check_afford";
  if (/(history|list|show|dekhao|khoroch list)/i.test(text)) {
    return "show_history";
  }
  if (/(help|ki korbo|ki likhbo|commands)/i.test(text)) return "show_help";
  return "add_expense";
}

export function parsePrompt(text, state = {}) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    return {
      action: "answer_query",
      reply: 'Kichu likho, e.g. "bus bara 80 taka".',
      insight: 'Help er jonno likho "help".',
    };
  }

  const lower = trimmed.toLowerCase();
  const intent = detectIntent(lower);
  const amount = parseNumber(trimmed);
  const expenses = state.expenses || [];
  const monthlyBudget = state.monthlyBudget ?? state.monthly_budget ?? 0;
  const totalSpent = state.totalSpent ?? state.total_spent ?? 0;
  const remaining = state.remaining ?? 0;

  if (intent === "show_help") {
    return {
      action: "answer_query",
      reply: "FinVision e je commands use korte parbe:",
      insight:
        'Expense: "bus bara 80 taka"\nIncome: "salary paisi 15000"\nBudget: "set budget 12000"\nBalance: "amar koto baki ache?"',
    };
  }

  if (intent === "show_history") {
    const lines = expenses
      .slice(0, 5)
      .map(
        (expense) =>
          `${expense.category} - ${money(expense.amount)} (${expense.date})`,
      );
    return {
      action: "answer_query",
      reply: "Last 5 khoroch:",
      insight: lines.join("\n") || "Kono khoroch nei.",
    };
  }

  if (intent === "set_budget" && amount) {
    return {
      action: "set_budget",
      amount,
      reply: `Budget ${money(amount)} set holo.`,
      insight: "Ekhon theke sob khoroch ei budget er against track hobe.",
    };
  }

  if (intent === "check_balance") {
    const percent = Math.round((totalSpent / Math.max(monthlyBudget, 1)) * 100);
    return {
      action: "answer_query",
      reply: `Tomar baki ache ${money(remaining)}.`,
      insight: `Budget er ${percent}% khoroch hoyeche. Total spent ${money(totalSpent)}.`,
    };
  }

  if (intent === "check_afford" && amount) {
    const after = remaining - amount;
    return {
      action: "answer_query",
      reply:
        after >= 0
          ? `Haan, ${money(amount)} afford korte parba.`
          : `Na, ${money(amount)} dile budget ${money(Math.abs(after))} cross korbe.`,
      insight:
        after >= 0
          ? `Kinar por baki thakbe ${money(after)}.`
          : "Budget safe rakhte eta skip kora bhalo.",
    };
  }

  if (intent === "add_income" && amount) {
    return {
      action: "add_income",
      amount,
      reply: `${money(amount)} income add holo.`,
      insight: "Income budget e jog hoyeche.",
    };
  }

  if (intent === "clear_all") {
    return {
      action: "clear_all",
      reply: "Sob khoroch clear hoyeche.",
      insight: "Budget same thakbe, shudhu expense list clear hoyeche.",
    };
  }

  if (!amount) {
    return {
      action: "answer_query",
      reply: "Amount ta clear na.",
      insight: 'Example: "bus bara 80 taka" ba "lunch 150".',
    };
  }

  const category = detectCategory(trimmed);
  const transaction = {
    id: createId("expense"),
    amount,
    currency: "BDT",
    type: "expense",
    ...category,
    merchant: lower.includes("uber")
      ? "Uber"
      : lower.includes("pathao")
        ? "Pathao"
        : null,
    date: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    }),
    note: trimmed,
  };

  return {
    action: "add_expense",
    amount,
    transaction,
    reply: `Expense added: ${money(amount)} ${category.category} - ${category.subcategory}.`,
    insight: `Remaining: ${money(Math.max(remaining - amount, 0))}.`,
  };
}

export default parsePrompt;
