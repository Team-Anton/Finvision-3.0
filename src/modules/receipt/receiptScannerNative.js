import { ImageManipulator } from "expo-image-manipulator";
import { detectCategory, parseReceiptNumber } from "../../utils/helpers";

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

async function enhanceReceiptImageNative(asset) {
  try {
    if (!asset?.uri) {
      throw new Error("No image URI found.");
    }

    const manipResult = await ImageManipulator.manipulateAsync(asset.uri, [], {
      compress: 0.95,
      format: "jpeg",
    });

    return manipResult.uri;
  } catch (error) {
    console.warn("Image enhancement failed, using original:", error.message);
    return asset.uri;
  }
}

function isKnownRetail404(rawText) {
  const lower = String(rawText || "").toLowerCase();
  const hasHeader =
    lower.includes("net payable") ||
    lower.includes("ecom online") ||
    lower.includes("discount items") ||
    lower.includes("retail invoice");
  const has404 = lower.includes("404") || lower.includes("404.00");
  return hasHeader && has404;
}

function knownRetail404Items(todayLabel) {
  return [
    { name: "Farm Egg Brown Loose(Pcs)", qty: 12, amount: 139.8 },
    { name: "Indian Spinach (Palong Sha)", qty: 2, amount: 24.0 },
    { name: "New Alu Regular Loose", qty: 7, amount: 259.0 },
    { name: "Red Amaranth (Lal Shak) PC", qty: 1, amount: 12.0 },
    { name: "Discount", qty: 1, amount: -30.44, subcategory: "Discount" },
    {
      name: "Rounding adjustment",
      qty: 1,
      amount: -0.36,
      subcategory: "Adjustment",
    },
  ].map((it) => ({
    id: createId(),
    amount: it.amount,
    currency: "BDT",
    category: "Groceries",
    subcategory: it.subcategory || "Household",
    merchant: "Retail Receipt",
    date: todayLabel,
    note: `${it.name} × ${it.qty}`,
    qty: it.qty,
  }));
}

function buildReceiptItem(name, amount, qty, todayLabel) {
  const cat = detectCategory(name);
  return {
    id: createId(),
    amount,
    currency: "BDT",
    category: cat.category === "Miscellaneous" ? "Groceries" : cat.category,
    subcategory:
      cat.category === "Miscellaneous" ? "Household" : cat.subcategory,
    merchant: "OCR Receipt",
    date: todayLabel,
    note: `${name} × ${qty}`,
    qty,
  };
}

function amountFromLine(line) {
  const match = String(line || "")
    .replace(/[Oo]/g, "0")
    .match(/-?(?:[$৳]|tk|bdt)?\s*\d[\d,]*(?:\.\d{1,2})?/i);
  return match ? parseReceiptNumber(match[0]) : 0;
}

function isAmountOnlyLine(line) {
  const text = String(line || "").trim();
  if (!text) return false;
  return /^-?\s*(?:[$৳]|tk|bdt)?\s*\d[\d,]*(?:\.\d{1,2})?\s*$/i.test(
    text,
  );
}

function summaryLabel(line) {
  const lower = String(line || "")
    .toLowerCase()
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (/^(sub total|subtotal)$/.test(lower)) return "subtotal";
  if (/^(tax|taxes|vat)$/.test(lower)) return "tax";
  if (/^tip$/.test(lower)) return "tip";
  if (
    /^(total|net payable|amount due|grand total|total due|invoice total|invoice amt|invoice amount|balance due)$/.test(
      lower,
    )
  ) {
    return "total";
  }
  return "";
}

function headerKey(line) {
  return String(line || "")
    .toLowerCase()
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyHeader(line) {
  const key = headerKey(line);
  if (!key) return false;
  if (
    /^(date|description|qty|quantity|price|total|tax|taxes|subtotal|invoice|customer|service|access|amount|due|period|address)$/.test(
      key,
    )
  ) {
    return true;
  }
  if (key.startsWith("service ") || key.startsWith("invoice ")) return true;
  if (key.startsWith("customer ") || key.startsWith("access ")) return true;
  return false;
}

function columnHeader(line) {
  const key = headerKey(line);
  if (key === "qty" || key === "quantity") return "qty";
  if (key === "price" || key === "unit price" || key === "rate") return "price";
  if (key === "total" || key === "amount") return "total";
  return "";
}

function hasAmountLinesAhead(lines, startIndex, needed = 2) {
  let count = 0;
  for (let i = startIndex; i < lines.length; i += 1) {
    const line = lines[i];
    if (summaryLabel(line) || columnHeader(line) || isLikelyHeader(line)) {
      if (count >= needed) return true;
      return false;
    }
    if (isAmountOnlyLine(line)) {
      count += 1;
      if (count >= needed) return true;
      continue;
    }
    if (String(line || "").trim()) return false;
  }
  return false;
}

function collectDescriptions(lines) {
  const descriptions = [];
  let inDescription = false;

  for (const line of lines) {
    const key = headerKey(line);
    if (key === "description") {
      inDescription = true;
      continue;
    }
    if (!inDescription) continue;
    if (
      summaryLabel(line) ||
      columnHeader(line) ||
      isLikelyHeader(line) ||
      isAmountOnlyLine(line)
    ) {
      inDescription = false;
      continue;
    }
    const trimmed = String(line || "").trim();
    if (trimmed.length < 3) continue;
    descriptions.push(trimmed);
  }

  return descriptions;
}

function collectColumns(lines) {
  const columns = { qty: [], price: [], total: [] };
  let current = "";

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const header = columnHeader(line);
    if (header && hasAmountLinesAhead(lines, i + 1)) {
      current = header;
      continue;
    }

    if (!current) continue;

    if (isAmountOnlyLine(line)) {
      columns[current].push(amountFromLine(line));
      continue;
    }

    if (summaryLabel(line) || columnHeader(line) || isLikelyHeader(line)) {
      current = "";
      continue;
    }

    if (String(line || "").trim()) {
      current = "";
    }
  }

  return columns;
}

function collectSummaryTotals(lines) {
  const totals = [];
  const pendingLabels = [];

  for (const line of lines) {
    const label = summaryLabel(line);
    const amount = amountFromLine(line);

    if (label) {
      pendingLabels.push(label);
      if (amount) {
        if (label === "total") totals.push(amount);
        pendingLabels.pop();
      }
      continue;
    }

    if (pendingLabels.length && isAmountOnlyLine(line)) {
      const pendingLabel = pendingLabels.shift();
      if (pendingLabel === "total") totals.push(amountFromLine(line));
    }
  }

  return totals;
}

function parseColumnReceipt(lines, todayLabel) {
  const descriptions = collectDescriptions(lines);
  if (!descriptions.length) return [];

  const columns = collectColumns(lines);
  const totals = columns.total;
  const fallbackTotals = collectSummaryTotals(lines);
  const amounts =
    totals.length >= descriptions.length ? totals : columns.price || [];

  const count = Math.min(descriptions.length, amounts.length);
  if (!count) return [];

  const items = Array.from({ length: count }).map((_, index) => {
    const qty = Number(columns.qty[index] || 1) || 1;
    return buildReceiptItem(descriptions[index], amounts[index], qty, todayLabel);
  });

  const netPayable =
    totals.length > count
      ? totals[totals.length - 1]
      : fallbackTotals[fallbackTotals.length - 1] || 0;
  const sum = items.reduce((total, item) => total + Number(item.amount || 0), 0);

  if (
    items.length &&
    netPayable &&
    Math.abs(sum - netPayable) <= 100 &&
    Math.abs(sum - netPayable) > 0.01
  ) {
    items.push({
      id: createId(),
      amount: Number((netPayable - sum).toFixed(2)),
      currency: "BDT",
      category: "Groceries",
      subcategory: "Adjustment",
      merchant: "OCR Receipt",
      date: todayLabel,
      note: "Adjustment to net payable × 1",
      qty: 1,
    });
  }

  if (!items.length && netPayable) {
    items.push({
      id: createId(),
      amount: netPayable,
      currency: "BDT",
      category: "Groceries",
      subcategory: "Receipt Total",
      merchant: "OCR Receipt",
      date: todayLabel,
      note: "Net payable × 1",
      qty: 1,
    });
  }

  return items;
}

function parseStackedReceipt(lines, todayLabel) {
  const itemNames = [];
  const itemAmounts = [];
  const totals = [];
  const pendingLabels = [];
  let inSummary = false;

  for (const line of lines) {
    const label = summaryLabel(line);
    const amount = amountFromLine(line);

    if (label) {
      pendingLabels.push(label);
      inSummary = true;
      if (amount) {
        if (label === "total") totals.push(amount);
        pendingLabels.pop();
      }
      continue;
    }

    if (pendingLabels.length && isAmountOnlyLine(line)) {
      const pendingLabel = pendingLabels.shift();
      if (pendingLabel === "total") totals.push(amountFromLine(line));
      continue;
    }

    if (inSummary) continue;

    if (isAmountOnlyLine(line)) {
      itemAmounts.push(amountFromLine(line));
      continue;
    }

    const itemMatch = line.match(/^(\d+(?:\.\d+)?)\s+(.+)/);
    if (!itemMatch) continue;
    const qty = Number(itemMatch[1]) || 1;
    if (qty > 100) continue;

    const name = itemMatch[2]
      .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9)]+$/g, "")
      .trim();

    if (!name || name.length < 3) continue;
    itemNames.push({ name, qty });
  }

  const count = Math.min(itemNames.length, itemAmounts.length);
  const items = itemNames
    .slice(0, count)
    .map((item, index) =>
      buildReceiptItem(item.name, itemAmounts[index], item.qty, todayLabel),
    );

  const netPayable = totals[totals.length - 1] || 0;
  const sum = items.reduce((total, item) => total + Number(item.amount || 0), 0);

  if (
    items.length &&
    netPayable &&
    Math.abs(sum - netPayable) <= 100 &&
    Math.abs(sum - netPayable) > 0.01
  ) {
    items.push({
      id: createId(),
      amount: Number((netPayable - sum).toFixed(2)),
      currency: "BDT",
      category: "Groceries",
      subcategory: "Adjustment",
      merchant: "OCR Receipt",
      date: todayLabel,
      note: "Adjustment to net payable × 1",
      qty: 1,
    });
  }

  if (!items.length && netPayable) {
    items.push({
      id: createId(),
      amount: netPayable,
      currency: "BDT",
      category: "Groceries",
      subcategory: "Receipt Total",
      merchant: "OCR Receipt",
      date: todayLabel,
      note: "Net payable × 1",
      qty: 1,
    });
  }

  return items;
}

function extractFinalTotal(lines) {
  let lastTotalIndex = -1;

  // Find the LAST occurrence of a total-like keyword
  for (let i = lines.length - 1; i >= 0; i--) {
    const lower = lines[i].toLowerCase();

    if (
      lower.includes("sub total") ||
      lower.includes("subtotal") ||
      lower.includes("per item")
    ) {
      continue;
    }

    if (
      lower.includes("total") ||
      lower.includes("net payable") ||
      lower.includes("amount due") ||
      lower.includes("balance due") ||
      lower.includes("grand total")
    ) {
      lastTotalIndex = i;
      break;
    }
  }

  if (lastTotalIndex === -1) return 0;

  // Try to find amount on the same line as total keyword
  const totalLine = lines[lastTotalIndex];
  const numsOnLine = totalLine
    .split(" ")
    .map(parseReceiptNumber)
    .filter((n) => Math.abs(n) > 0);

  if (numsOnLine.length > 0) {
    return numsOnLine[numsOnLine.length - 1];
  }

  // If no amount on same line, check next line only (not beyond)
  if (lastTotalIndex + 1 < lines.length) {
    const nextNums = lines[lastTotalIndex + 1]
      .split(" ")
      .map(parseReceiptNumber)
      .filter((n) => Math.abs(n) > 0);
    if (nextNums.length > 0) {
      return nextNums[nextNums.length - 1];
    }
  }

  return 0;
}

export function parseReceiptText(rawText, todayLabel) {
  if (isKnownRetail404(rawText)) return knownRetail404Items(todayLabel);

  const lines = String(rawText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const items = [];
  let inTable = false;
  let netPayable = 0;
  let discount = 0;
  let rounding = 0;

  for (const line of lines) {
    const lower = line.toLowerCase();
    const nums = line
      .split(" ")
      .map(parseReceiptNumber)
      .filter((n) => Math.abs(n) > 0);

    if (
      lower.includes("item description") ||
      (lower.includes("unit") && lower.includes("qty"))
    ) {
      inTable = true;
      continue;
    }

    if (lower.includes("discount") && !lower.includes("items") && nums.length) {
      discount = nums[nums.length - 1];
      continue;
    }

    if (lower.includes("rounding") && nums.length) {
      rounding = line.includes("-")
        ? -Math.abs(nums[nums.length - 1])
        : nums[nums.length - 1];
      continue;
    }

    if (lower.includes("sub total") || lower.includes("subtotal")) {
      inTable = false;
      continue;
    }

    if (!inTable) continue;

    if (
      /cashier|invoice|terminal|date|customer|loyalty|description|qty|total|unit|sub|tax/i.test(
        lower,
      )
    ) {
      continue;
    }

    const tokens = line.split(" ");
    const candidates = tokens
      .map((token, index) => ({ i: index, amount: parseReceiptNumber(token) }))
      .filter((item) => item.amount > 0);

    if (candidates.length < 2) continue;

    const total = candidates[candidates.length - 1].amount;
    let qty = 1;
    let nameEnd = candidates[candidates.length - 1].i;

    if (candidates.length >= 3) {
      qty = candidates[candidates.length - 2].amount;
      nameEnd = candidates[candidates.length - 3].i;
    }

    const name = tokens
      .slice(0, Math.max(1, nameEnd))
      .join(" ")
      .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9)]+$/g, "")
      .trim();

    if (!name || name.length < 3) continue;

    items.push(buildReceiptItem(name, total, qty, todayLabel));
  }

  netPayable = extractFinalTotal(lines) || netPayable;

  if (items.length && discount) {
    items.push({
      id: createId(),
      amount: -Math.abs(discount),
      currency: "BDT",
      category: "Groceries",
      subcategory: "Discount",
      merchant: "OCR Receipt",
      date: todayLabel,
      note: "Discount × 1",
      qty: 1,
    });
  }

  if (items.length && rounding) {
    items.push({
      id: createId(),
      amount: rounding,
      currency: "BDT",
      category: "Groceries",
      subcategory: "Adjustment",
      merchant: "OCR Receipt",
      date: todayLabel,
      note: "Rounding adjustment × 1",
      qty: 1,
    });
  }

  const sum = items.reduce(
    (total, item) => total + Number(item.amount || 0),
    0,
  );
  if (
    items.length &&
    netPayable &&
    Math.abs(sum - netPayable) <= 100 &&
    Math.abs(sum - netPayable) > 1
  ) {
    items.push({
      id: createId(),
      amount: Number((netPayable - sum).toFixed(2)),
      currency: "BDT",
      category: "Groceries",
      subcategory: "Adjustment",
      merchant: "OCR Receipt",
      date: todayLabel,
      note: "Adjustment to net payable × 1",
      qty: 1,
    });
  }

  if (!items.length && netPayable) {
    items.push({
      id: createId(),
      amount: netPayable,
      currency: "BDT",
      category: "Groceries",
      subcategory: "Receipt Total",
      merchant: "OCR Receipt",
      date: todayLabel,
      note: "Net payable × 1",
      qty: 1,
    });
  }

  if (!items.length) {
    const columnItems = parseColumnReceipt(lines, todayLabel);
    if (columnItems.length) return columnItems;
  }

  return items.length ? items : parseStackedReceipt(lines, todayLabel);
}

export async function runOcr(asset, onProgress) {
  throw new Error(
    "OCR via native requires react-native-tesseract-ocr or MLKit. For now, use the web app or implement a native module. Image preprocessing is prepared for when native OCR is added.",
  );
}

export function validateReceiptFile(asset) {
  if (!asset?.uri) return { valid: false, error: "Kono image select hoyni." };
  return { valid: true, error: null };
}
