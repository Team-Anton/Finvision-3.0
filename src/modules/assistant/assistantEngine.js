import { detectCategory, money, parseNumber } from "../../utils/helpers";

function detectIntent(lower) {
  if (/(budget|bajet|set|বাজেট)/i.test(lower)) return "set_budget";
  if (/(baki|remaining|left|balance|koto baki|কত বাকি)/i.test(lower)) {
    return "check_balance";
  }
  if (/(afford|parbo|kinte parbo|can i)/i.test(lower)) return "check_afford";
  if (/(income|salary|paisi|pelam|allowance|refund|joma)/i.test(lower)) {
    return "add_income";
  }
  if (/(delete|remove|muchi|bade dao|bad dao)/i.test(lower)) {
    return "delete_expense";
  }
  if (/(clear|reset|sob bad|shob bad)/i.test(lower)) return "clear_all";
  if (/(history|list|show|dekhao|khoroch list)/i.test(lower)) {
    return "show_history";
  }
  if (/(help|ki korbo|ki likhbo|commands)/i.test(lower)) return "show_help";
  return "add_expense";
}

function getHelpText() {
  return {
    reply: "FinVision e je commands use korte parbe:",
    insight: [
      '💸 Expense: "bus bara 80 taka" / "lunch 150"',
      '💰 Income: "salary paisi 15000 taka"',
      '🎯 Budget: "set budget 12000"',
      '📊 Balance: "amar koto baki ache?"',
      '🤔 Afford: "can i afford 500 taka?"',
      '📋 History: "show khoroch list"',
    ].join("\n"),
  };
}

function parsePrompt(text, state) {
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

  if (intent === "show_help") {
    return { action: "answer_query", ...getHelpText() };
  }

  if (intent === "show_history") {
    const lines = (state.expenses || [])
      .slice(0, 5)
      .map((expense) => {
        return `• ${expense.category} — ${money(expense.amount)} (${expense.date})`;
      });

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
      reply: `Budget ${money(amount)} set holo. ✅`,
      insight: "Ekhon theke sob khoroch ei budget er against track hobe.",
    };
  }

  if (intent === "check_balance") {
    const avg = state.days_passed ? state.total_spent / state.days_passed : 0;
    const daysLeft = avg
      ? Math.floor(state.remaining / avg)
      : state.days_in_month - state.days_passed;
    const percent = Math.round(
      (state.total_spent / Math.max(state.monthly_budget, 1)) * 100,
    );

    return {
      action: "answer_query",
      reply: `Tomar baki ache ${money(state.remaining)}. 🛡️`,
      insight: [
        `Budget er ${percent}% khoroch hoyeche.`,
        `Daily burn-rate ${money(Math.round(avg))}/day.`,
        `Approx ${daysLeft} din cholbe.`,
      ].join("\n"),
    };
  }

  if (intent === "check_afford" && amount) {
    const after = state.remaining - amount;
    const safe = after >= 0;

    return {
      action: "answer_query",
      reply: safe
        ? `Haan, ${money(amount)} afford korte parba. ✅`
        : `Na, ${money(amount)} dile budget ${money(Math.abs(after))} cross korbe. ⚠️`,
      insight: safe
        ? `Kinar por baki thakbe ${money(after)}.`
        : "Budget barao nahole chotto khabar order koro.",
    };
  }

  if (intent === "add_income" && amount) {
    return {
      action: "add_income",
      amount,
      reply: `${money(amount)} income add holo. 💰`,
      insight: "Income budget e jog hoyeche. Remaining balance update hoyeche.",
    };
  }

  if (intent === "delete_expense") {
    return {
      action: "answer_query",
      reply: "Delete korte Recent Expenses list er × button use koro.",
      insight: "Safety er jonno first tap confirm kore, second tap delete kore.",
    };
  }

  if (intent === "clear_all") {
    return {
      action: "clear_all",
      reply: "Sob khoroch clear hoyeche. 🗑️",
      insight: "Budget same thakbe, shudhu expense list clear hoyeche.",
    };
  }

  if (!amount) {
    return {
      action: "answer_query",
      reply: "Amount ta clear na. 🤔",
      insight: 'Example: "bus bara 80 taka" ba "lunch 150".',
    };
  }

  const cat = detectCategory(trimmed);
  const expenseIntent =
    /(spent|spend|paid|buy|bought|kinlam|kinsi|diya|dilam|khoroch|expense|bill|fare|bara|bhara|vara|vahara|ভাড়া|bus|rickshaw|uber|pathao|recharge|lunch|dinner|coffee|tea|grocery|bazaar|gift|biya|dawa|mobile)/i.test(
      trimmed,
    ) || cat.category !== "Miscellaneous";

  if (!expenseIntent) {
    return {
      action: "answer_query",
      reply: `${money(amount)} ta expense, income, na budget set? 🤷`,
      insight:
        'Context dao. Example: "lunch 200 taka" ba "income 5000".',
    };
  }

  const transaction = {
    id: crypto.randomUUID(),
    amount,
    currency: "BDT",
    ...cat,
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
    reply: `${money(amount)} ${cat.category} — ${cat.subcategory} e add holo. ✅`,
    insight: `Remaining: ${money(Math.max(state.remaining - amount, 0))}.`,
  };
}

export default parsePrompt;
