// SplitEngine.js — Pure JavaScript calculation engine for group expense splitting.
// No React, no JSX, no UI code.

function createId(prefix = "id") {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const MEMBER_COLORS = [
  { bg: "bg-violet-100", text: "text-violet-700", hex: "#7c3aed" },
  { bg: "bg-blue-100", text: "text-blue-700", hex: "#1d4ed8" },
  { bg: "bg-emerald-100", text: "text-emerald-700", hex: "#047857" },
  { bg: "bg-orange-100", text: "text-orange-700", hex: "#c2410c" },
  { bg: "bg-pink-100", text: "text-pink-700", hex: "#be185d" },
  { bg: "bg-amber-100", text: "text-amber-700", hex: "#b45309" },
  { bg: "bg-sky-100", text: "text-sky-700", hex: "#0369a1" },
  { bg: "bg-red-100", text: "text-red-700", hex: "#b91c1c" },
];

export const WALLET_ID = "group-wallet";
export const WALLET_MEMBER = {
  id: WALLET_ID,
  name: "Group Wallet",
  color: { hex: "#0f172a" },
  joinedAt: 0,
};

export function createMember(name, index) {
  return {
    id: createId("member"),
    name: String(name || "").trim(),
    color: MEMBER_COLORS[index % MEMBER_COLORS.length],
    joinedAt: Date.now(),
  };
}

export function createSplitExpense({
  title,
  amount,
  paidById,
  memberIds,
  splitType = "equal",
  customAmounts = {},
  contributors = [],
}) {
  return {
    id: createId("split-expense"),
    title: String(title || "").trim(),
    amount: Number(amount) || 0,
    paidById,
    contributors,
    memberIds,
    splitType,
    customAmounts,
    createdAt: Date.now(),
    date: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    }),
  };
}

export function calcShares(expense) {
  if (!expense.memberIds || expense.memberIds.length === 0) return {};

  const shares = {};

  if (expense.splitType === "equal") {
    const share = expense.amount / expense.memberIds.length;
    for (const id of expense.memberIds) {
      shares[id] = Number(share.toFixed(2));
    }
  } else if (expense.splitType === "custom") {
    for (const id of expense.memberIds) {
      shares[id] = Number(expense.customAmounts[id] || 0);
    }
  } else if (expense.splitType === "percentage") {
    for (const id of expense.memberIds) {
      const pct = Number(expense.customAmounts[id] || 0);
      shares[id] = Number(((expense.amount * pct) / 100).toFixed(2));
    }
  }

  return shares;
}

export function buildBalances(members, expenses) {
  const balances = {};
  for (const member of members) {
    balances[member.id] = 0;
  }

  for (const expense of expenses) {
    const shares = calcShares(expense);
    const contributors = Array.isArray(expense.contributors)
      ? expense.contributors
      : [];
    // Contributors get CREDIT
    if (contributors.length) {
      for (const contributor of contributors) {
        if (balances[contributor.memberId] !== undefined) {
          balances[contributor.memberId] += Number(contributor.amount || 0);
        }
      }
    } else if (balances[expense.paidById] !== undefined) {
      balances[expense.paidById] += expense.amount;
    }
    // Each member gets DEBIT
    for (const memberId of expense.memberIds) {
      if (balances[memberId] !== undefined) {
        balances[memberId] -= shares[memberId] || 0;
      }
    }
  }

  // Round each balance to 2 decimal places
  for (const id in balances) {
    balances[id] = Number(balances[id].toFixed(2));
  }

  return balances;
}

export function calcSettlements(members, expenses) {
  const balances = buildBalances(members, expenses);

  const creditors = [];
  const debtors = [];

  for (const member of members) {
    const balance = balances[member.id] || 0;
    if (balance > 0.01) {
      creditors.push({
        id: member.id,
        name: member.name,
        amount: balance,
        color: member.color,
      });
    } else if (balance < -0.01) {
      debtors.push({
        id: member.id,
        name: member.name,
        amount: -balance,
        color: member.color,
      });
    }
  }

  // Greedy minimum transactions algorithm
  const cred = creditors.map((c) => ({ ...c }));
  const debt = debtors.map((d) => ({ ...d }));
  let i = 0;
  let j = 0;
  const settlements = [];

  while (i < cred.length && j < debt.length) {
    const transfer = Math.min(cred[i].amount, debt[j].amount);
    if (transfer > 0.01) {
      settlements.push({
        id: createId("settlement"),
        from: debt[j],
        to: cred[i],
        amount: Number(transfer.toFixed(2)),
      });
    }
    cred[i].amount -= transfer;
    debt[j].amount -= transfer;
    if (cred[i].amount < 0.01) i++;
    if (debt[j].amount < 0.01) j++;
  }

  return settlements;
}

export function getMemberSummary(members, expenses) {
  const balances = buildBalances(members, expenses);

  return members.map((member) => {
    const paid = expenses.reduce((sum, e) => {
      const contributors = Array.isArray(e.contributors) ? e.contributors : [];
      if (contributors.length) {
        const match = contributors.find((c) => c.memberId === member.id);
        return sum + Number(match?.amount || 0);
      }
      return e.paidById === member.id ? sum + e.amount : sum;
    }, 0);

    const owed = expenses.reduce((sum, e) => {
      const shares = calcShares(e);
      return sum + (shares[member.id] || 0);
    }, 0);

    return {
      ...member,
      paid: Number(paid.toFixed(2)),
      owed: Number(owed.toFixed(2)),
      balance: balances[member.id] || 0,
    };
  });
}

export function validateSplit(expense) {
  if (expense.amount <= 0) {
    return { valid: false, error: "Amount must be greater than 0." };
  }

  if (!expense.memberIds || expense.memberIds.length === 0) {
    return { valid: false, error: "At least one member must be selected." };
  }

  if (Array.isArray(expense.contributors) && expense.contributors.length) {
    const sum = expense.contributors.reduce(
      (s, item) => s + Number(item.amount || 0),
      0,
    );
    if (sum <= 0) {
      return { valid: false, error: "At least one contributor must pay." };
    }
    if (Math.abs(sum - expense.amount) > 0.01) {
      return {
        valid: false,
        error: `Contributions sum (${sum.toFixed(2)}) must equal total (${expense.amount}).`,
      };
    }
  }

  if (expense.splitType === "custom") {
    const sum = expense.memberIds.reduce(
      (s, id) => s + Number(expense.customAmounts[id] || 0),
      0,
    );
    if (Math.abs(sum - expense.amount) > 0.01) {
      return {
        valid: false,
        error: `Custom amounts sum (${sum.toFixed(2)}) must equal total (${expense.amount}).`,
      };
    }
  }

  if (expense.splitType === "percentage") {
    const sum = expense.memberIds.reduce(
      (s, id) => s + Number(expense.customAmounts[id] || 0),
      0,
    );
    if (Math.abs(sum - 100) > 0.01) {
      return {
        valid: false,
        error: `Percentages must sum to 100% (currently ${sum.toFixed(1)}%).`,
      };
    }
  }

  return { valid: true, error: null };
}

export function getGroupStats(members, expenses) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const perPerson = members.length ? total / members.length : 0;
  const settlements = calcSettlements(members, expenses);

  return {
    totalExpenses: total,
    perPerson: Number(perPerson.toFixed(2)),
    expenseCount: expenses.length,
    memberCount: members.length,
    settlementCount: settlements.length,
    isSettled: settlements.length === 0 && expenses.length > 0,
  };
}
