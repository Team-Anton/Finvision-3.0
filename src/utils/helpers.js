export const todayLabel = new Date().toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
});

export function money(n) {
  return `${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} BDT`;
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
    /bus|বাস|rickshaw|রিকশা|uber|pathao|cng|fare|transport|bara|bhara|vara|vahara|ভাড়া|ভাড়া/.test(
      lower,
    )
  ) {
    return {
      category: "Transport",
      subcategory:
        lower.includes("bus") || lower.includes("বাস")
          ? "Bus/Fare"
          : "Ride/Fare",
    };
  }
  if (/mobile|recharge|internet|data|wifi|sim|flexi/.test(lower))
    return { category: "Utilities", subcategory: "Mobile/Internet" };
  if (/biya|biye|wedding|dawat|dawa|gift|party|treat/.test(lower))
    return { category: "Social", subcategory: "Gift/Event" };
  if (
    /egg|spinach|palong|alu|amaranth|shak|vegetable|grocery|bazaar|rice|oil|loose|pcs/.test(
      lower,
    )
  ) {
    return { category: "Groceries", subcategory: "Household" };
  }
  if (
    /lunch|dinner|breakfast|coffee|tea|food|snack|singara|burger|pizza|biryani|canteen|khabar|khawa/.test(
      lower,
    )
  ) {
    return { category: "Food", subcategory: "Meal" };
  }
  if (/netflix|spotify|movie|cinema|game|subscription/.test(lower))
    return { category: "Entertainment", subcategory: "Streaming" };
  if (/beer|whisky|vodka|drink|pub\b|bar\b/.test(lower))
    return { category: "Entertainment", subcategory: "Drinks" };
  if (/book|pen|notebook|stationery|class|exam|tuition|course/.test(lower))
    return { category: "Education", subcategory: "Study" };
  if (/medicine|doctor|hospital|pharmacy/.test(lower))
    return { category: "Health", subcategory: "Medical" };
  return { category: "Miscellaneous", subcategory: "General" };
}

export function calcTotalSpent(expenses) {
  return expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

export function calcRemaining(monthlyBudget, totalSpent) {
  return Math.max(monthlyBudget - totalSpent, 0);
}

export function calcHealthScore(remaining, monthlyBudget) {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round((remaining / Math.max(monthlyBudget, 1)) * 90 + 10),
    ),
  );
}

export function calcDailyAvg(totalSpent, daysPassed = 12) {
  return daysPassed ? totalSpent / daysPassed : 0;
}
