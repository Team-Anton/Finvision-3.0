export const todayLabel = new Date().toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
});

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function createId(prefix = "id") {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function money(n) {
  const amount = finiteNumber(n);
  const normalized = Math.abs(amount) < 0.005 ? 0 : amount;
  return `${normalized.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })} BDT`;
}

export function parseNumber(text) {
  const match = String(text || "")
    .replace(/,/g, "")
    .match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function parseReceiptNumber(token) {
  let cleaned = String(token || "")
    .trim()
    .replace(/[Oo]/g, "0")
    .replace(/[lI]/g, "1");
  cleaned = cleaned
    .split("")
    .filter((ch) => "0123456789.,-".includes(ch))
    .join("");
  if (!cleaned || cleaned === "-") return 0;
  const negative = cleaned.includes("-");
  cleaned = cleaned.replace(/-/g, "");
  if (cleaned.includes(",") && !cleaned.includes(".")) {
    const parts = cleaned.split(",");
    const last = parts[parts.length - 1];
    cleaned =
      last.length === 2
        ? `${parts.slice(0, -1).join("")}.${last}`
        : parts.join("");
  } else {
    cleaned = cleaned.replace(/,/g, "");
  }
  const n = Number(cleaned) || 0;
  return negative ? -n : n;
}

export function detectCategory(text) {
  const lower = String(text || "").toLowerCase();
  if (
    /bus|rickshaw|uber|pathao|cng|fare|transport|bara|bhara|vara|vahara/.test(
      lower,
    )
  ) {
    return {
      category: "Transport",
      subcategory: lower.includes("bus") ? "Bus/Fare" : "Ride/Fare",
    };
  }
  if (
    /suit|shirt|pant|jeans|jacket|clothes|cloth|shopping|boutique|dress|sharee|saree|shoe|bag|accessor|cosmetic/.test(
      lower,
    )
  ) {
    return { category: "Shopping", subcategory: "Clothes" };
  }
  if (/mobile|recharge|internet|data|wifi|sim|flexi/.test(lower)) {
    return { category: "Utilities", subcategory: "Mobile/Internet" };
  }
  if (/biya|biye|wedding|dawat|dawa|gift|party|treat/.test(lower)) {
    return { category: "Social", subcategory: "Gift/Event" };
  }
  if (
    /egg|spinach|palong|alu|amaranth|shak|vegetable|grocery|bazaar|rice|oil|loose|pcs/.test(
      lower,
    )
  ) {
    return { category: "Groceries", subcategory: "Household" };
  }
  if (
    /lunch|dinner|breakfast|coffee|tea|food|snack|singara|burger|pizza|biryani|canteen|khabar|khawa|fuchka/.test(
      lower,
    )
  ) {
    return { category: "Food", subcategory: "Meal" };
  }
  if (/netflix|spotify|movie|cinema|game|subscription/.test(lower)) {
    return { category: "Entertainment", subcategory: "Streaming" };
  }
  if (/book|pen|notebook|stationery|class|exam|tuition|course/.test(lower)) {
    return { category: "Education", subcategory: "Study" };
  }
  if (/medicine|doctor|hospital|pharmacy/.test(lower)) {
    return { category: "Health", subcategory: "Medical" };
  }
  return { category: "Miscellaneous", subcategory: "General" };
}

export function calcTotalSpent(expenses = []) {
  if (!Array.isArray(expenses)) return 0;
  return expenses.reduce((sum, item) => sum + finiteNumber(item?.amount), 0);
}

export function calcRemaining(monthlyBudget, totalSpent) {
  return Math.max(finiteNumber(monthlyBudget) - finiteNumber(totalSpent), 0);
}

export function calcHealthScore(remaining, monthlyBudget) {
  const safeRemaining = Math.max(finiteNumber(remaining), 0);
  const safeBudget = Math.max(finiteNumber(monthlyBudget), 0);
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (safeRemaining / Math.max(safeBudget, 1)) *
          90 +
          10,
      ),
    ),
  );
}

export function calcDailyAvg(totalSpent, daysPassed = 12) {
  const safeDays = finiteNumber(daysPassed);
  return safeDays > 0 ? finiteNumber(totalSpent) / safeDays : 0;
}

export function calcBudgetStatus(monthlyBudget, totalSpent, date = new Date()) {
  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();
  const dayOfMonth = Math.max(1, date.getDate());
  const safeBudget = Math.max(finiteNumber(monthlyBudget), 0);
  const safeSpent = Math.max(finiteNumber(totalSpent), 0);
  const projectedSpend = dayOfMonth
    ? (safeSpent / dayOfMonth) * daysInMonth
    : 0;
  const safeLimit = safeBudget * 1.05;
  const warningLimit = safeBudget * 1.2;

  if (projectedSpend <= safeLimit) {
    return { status: "Safe", projectedSpend };
  }
  if (projectedSpend <= warningLimit) {
    return { status: "Warning", projectedSpend };
  }
  return { status: "Critical", projectedSpend };
}
