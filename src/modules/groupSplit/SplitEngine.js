// SplitEngine.js - Pure JavaScript calculation engine for group expense splitting.
// No React, no JSX, no UI code.

const VALID_SPLIT_TYPES = new Set(["equal", "custom", "percentage"]);
const DIRECT_TOLERANCE_CENTS = 1;

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function toCents(value) {
  return Math.round(finiteNumber(value) * 100);
}

export function fromCents(cents) {
  const safeCents = Math.round(finiteNumber(cents));
  if (Math.abs(safeCents) <= 0) return 0;
  return Number((safeCents / 100).toFixed(2));
}

export function cleanAmount(value, fallback = 0) {
  return fromCents(toCents(finiteNumber(value, fallback)));
}

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
  name: "Shared Fund",
  color: { hex: "#0f172a" },
  joinedAt: 0,
};

function normalizeId(value) {
  return String(value || "").trim();
}

function normalizeAllowedIds(allowedIds = []) {
  return (Array.isArray(allowedIds) ? allowedIds : [])
    .map((item) => normalizeId(item?.id ?? item))
    .filter(Boolean);
}

function rawMemberIds(expense) {
  if (Array.isArray(expense?.memberIds)) {
    return expense.memberIds.map(normalizeId).filter(Boolean);
  }
  if (Array.isArray(expense?.participants)) {
    return expense.participants
      .map((participant) => normalizeId(participant?.memberId))
      .filter(Boolean);
  }
  return [];
}

function rawContributorIds(expense) {
  const payers = Array.isArray(expense?.contributors)
    ? expense.contributors
    : Array.isArray(expense?.payers)
      ? expense.payers
      : [];
  return payers.map((payer) => normalizeId(payer?.memberId)).filter(Boolean);
}

export function isSharedFundDeposit(expense) {
  const memberIds = rawMemberIds(expense);
  const contributorIds = rawContributorIds(expense);
  const hasWalletContributor =
    contributorIds.includes(WALLET_ID) || expense?.paymentSource === "sharedFund";
  if (hasWalletContributor) return false;

  const hasWalletParticipant = memberIds.includes(WALLET_ID);
  const humanParticipantCount = memberIds.filter((id) => id !== WALLET_ID).length;
  const looksLikeDeposit =
    expense?.paymentSource === "fundDeposit" ||
    expense?.kind === "fundDeposit" ||
    /shared fund deposit|fund deposit/i.test(String(expense?.title || ""));

  return (
    hasWalletParticipant &&
    !hasWalletContributor &&
    (humanParticipantCount === 0 || looksLikeDeposit)
  );
}

export function isSharedFundSpend(expense) {
  return (
    expense?.paymentSource === "sharedFund" ||
    rawContributorIds(expense).includes(WALLET_ID)
  );
}

export function isSharedFundExpense(expense) {
  return isSharedFundDeposit(expense) || isSharedFundSpend(expense);
}

export function getSpendExpenses(expenses = []) {
  return (Array.isArray(expenses) ? expenses : []).filter(
    (expense) => !isSharedFundDeposit(expense),
  );
}

export function createMember(name, index) {
  return {
    id: createId("member"),
    name: String(name || "").trim(),
    color: MEMBER_COLORS[index % MEMBER_COLORS.length],
    joinedAt: Date.now(),
  };
}

export function normalizeMember(member, index = 0) {
  if (!member || typeof member !== "object") return null;
  const id = normalizeId(member.id);
  if (!id || id === WALLET_ID) return null;
  const rawName = String(member.name || "").trim();
  if (/^(shared fund|group wallet)$/i.test(rawName)) return null;
  return {
    id,
    name: rawName || `Member ${index + 1}`,
    color: member.color?.hex
      ? member.color
      : MEMBER_COLORS[index % MEMBER_COLORS.length],
    joinedAt: finiteNumber(member.joinedAt, Date.now()),
  };
}

export function normalizeMembers(members = []) {
  const seen = new Set();
  return (Array.isArray(members) ? members : [])
    .map((member, index) => normalizeMember(member, index))
    .filter((member) => {
      if (!member || seen.has(member.id)) return false;
      seen.add(member.id);
      return true;
    });
}

function normalizeIds(ids = [], allowedIds = [], options = {}) {
  const allowed = new Set(normalizeAllowedIds(allowedIds));
  const allowWallet = options.allowWallet !== false;
  return (Array.isArray(ids) ? ids : [])
    .map(normalizeId)
    .filter((id, index, list) => {
      if (!id || list.indexOf(id) !== index) return false;
      if (!allowWallet && id === WALLET_ID) return false;
      return !allowed.size || allowed.has(id);
    });
}

function normalizeContributors(contributors = [], allowedIds = [], options = {}) {
  const allowed = new Set(normalizeAllowedIds(allowedIds));
  const allowWallet = options.allowWallet !== false;
  return (Array.isArray(contributors) ? contributors : [])
    .map((contributor) => ({
      memberId: normalizeId(contributor?.memberId),
      amount: cleanAmount(contributor?.amount),
    }))
    .filter((contributor) => {
      if (!contributor.memberId || contributor.amount <= 0) return false;
      if (!allowWallet && contributor.memberId === WALLET_ID) return false;
      return !allowed.size || allowed.has(contributor.memberId);
    });
}

function reconcileContributors(contributors, amount) {
  const safeContributors = normalizeContributors(contributors);
  const amountCents = toCents(amount);
  const totalCents = safeContributors.reduce(
    (sum, contributor) => sum + toCents(contributor.amount),
    0,
  );

  if (!safeContributors.length || amountCents <= 0) return safeContributors;
  if (totalCents === amountCents) return safeContributors;
  if (safeContributors.length === 1) {
    return [{ ...safeContributors[0], amount: fromCents(amountCents) }];
  }
  if (totalCents <= 0) return safeContributors;

  let used = 0;
  return safeContributors.map((contributor, index) => {
    if (index === safeContributors.length - 1) {
      return { ...contributor, amount: fromCents(amountCents - used) };
    }
    const cents = Math.round((toCents(contributor.amount) / totalCents) * amountCents);
    used += cents;
    return { ...contributor, amount: fromCents(cents) };
  });
}

function splitTypeOf(value) {
  return VALID_SPLIT_TYPES.has(value) ? value : "equal";
}

function participantCustomAmounts(expense, memberIds) {
  const customAmounts = {};
  const participantShares = new Map(
    (Array.isArray(expense?.participants) ? expense.participants : [])
      .map((participant) => [
        normalizeId(participant?.memberId),
        cleanAmount(participant?.shareAmount),
      ])
      .filter(([memberId]) => Boolean(memberId)),
  );

  memberIds.forEach((memberId) => {
    customAmounts[memberId] = cleanAmount(
      expense?.customAmounts?.[memberId] ?? participantShares.get(memberId),
    );
  });
  return customAmounts;
}

export function createSplitExpense({
  title,
  amount,
  paidById,
  memberIds,
  splitType = "equal",
  customAmounts = {},
  contributors = [],
  paymentSource,
}) {
  const safeAmount = cleanAmount(amount);
  const safeContributors = normalizeContributors(contributors);

  return {
    id: createId("split-expense"),
    title: String(title || "").trim() || "Group expense",
    amount: safeAmount,
    paidById: paidById || safeContributors[0]?.memberId,
    contributors: safeContributors,
    memberIds: Array.isArray(memberIds) ? memberIds : [],
    splitType: splitTypeOf(splitType),
    customAmounts: customAmounts || {},
    paymentSource,
    createdAt: Date.now(),
    date: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    }),
  };
}

export function normalizeExpense(expense, allowedIds = []) {
  if (!expense || typeof expense !== "object") return null;
  const id = normalizeId(expense.id);
  if (!id) return null;

  const amount = cleanAmount(expense.amount);
  if (amount <= 0) return null;

  const allowedIdStrings = normalizeAllowedIds(allowedIds);
  const memberIds = normalizeIds(rawMemberIds(expense), allowedIdStrings, {
    allowWallet: true,
  });
  if (!memberIds.length) return null;

  const splitType = splitTypeOf(expense.splitType);
  const customAmounts = participantCustomAmounts(expense, memberIds);

  const rawContributors = Array.isArray(expense.contributors)
    ? expense.contributors
    : Array.isArray(expense.payers)
      ? expense.payers
      : [];
  let contributors = reconcileContributors(
    normalizeContributors(rawContributors, allowedIdStrings, { allowWallet: true }),
    amount,
  );

  const explicitSource = expense.paymentSource;
  const paidById = normalizeId(expense.paidById || contributors[0]?.memberId);
  if (
    !contributors.length &&
    explicitSource === "sharedFund" &&
    (!allowedIdStrings.length || allowedIdStrings.includes(WALLET_ID))
  ) {
    contributors = [{ memberId: WALLET_ID, amount }];
  }
  if (
    !contributors.length &&
    paidById &&
    (!allowedIdStrings.length || allowedIdStrings.includes(paidById))
  ) {
    contributors = [{ memberId: paidById, amount }];
  }
  if (!contributors.length) return null;

  return {
    id,
    title: String(expense.title || "").trim() || "Group expense",
    amount,
    paidById: paidById || contributors[0]?.memberId,
    contributors,
    memberIds,
    splitType,
    customAmounts,
    paymentSource: explicitSource,
    createdAt: finiteNumber(expense.createdAt, Date.now()),
    date:
      typeof expense.date === "string" && expense.date.trim()
        ? expense.date
        : new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          }),
  };
}

export function normalizeExpenses(expenses = [], members = []) {
  const allowedIds = [
    ...normalizeMembers(members).map((member) => member.id),
    WALLET_ID,
  ];
  return (Array.isArray(expenses) ? expenses : [])
    .map((expense) => normalizeExpense(expense, allowedIds))
    .filter(Boolean);
}

function splitEquallyCents(amountCents, memberIds, remainderOffset = 0) {
  const shares = {};
  if (!memberIds.length || amountCents <= 0) {
    return { shares, nextOffset: remainderOffset };
  }

  const base = Math.floor(amountCents / memberIds.length);
  const remainder = amountCents - base * memberIds.length;
  memberIds.forEach((memberId) => {
    shares[memberId] = base;
  });
  for (let step = 0; step < remainder; step += 1) {
    const index = (remainderOffset + step) % memberIds.length;
    shares[memberIds[index]] += 1;
  }
  return {
    shares,
    nextOffset: (remainderOffset + remainder) % memberIds.length,
  };
}

function reconcileShareCents(memberIds, sharesById, amountCents, warnings) {
  const currentTotal = memberIds.reduce(
    (sum, memberId) => sum + Math.round(sharesById[memberId] || 0),
    0,
  );
  if (currentTotal === amountCents) return sharesById;

  const next = { ...sharesById };
  const diff = amountCents - currentTotal;
  if (Math.abs(diff) <= 1 && memberIds.length) {
    next[memberIds[memberIds.length - 1]] =
      Math.round(next[memberIds[memberIds.length - 1]] || 0) + diff;
    return next;
  }

  warnings.push(
    `Saved split shares total ${fromCents(currentTotal)} BDT, expected ${fromCents(
      amountCents,
    )} BDT. Shares were normalized for calculation.`,
  );

  if (currentTotal <= 0) {
    return splitEquallyCents(amountCents, memberIds, 0).shares;
  }

  let used = 0;
  memberIds.forEach((memberId, index) => {
    if (index === memberIds.length - 1) {
      next[memberId] = amountCents - used;
      return;
    }
    const cents = Math.round(
      (Math.round(sharesById[memberId] || 0) / currentTotal) * amountCents,
    );
    next[memberId] = cents;
    used += cents;
  });
  return next;
}

function calculateShareCents(expense, memberIds, remainderOffset = 0) {
  const amountCents = toCents(expense?.amount);
  const splitType = splitTypeOf(expense?.splitType);
  const warnings = [];

  if (!memberIds.length || amountCents <= 0) {
    return {
      sharesById: {},
      splitType,
      warnings,
      nextOffset: remainderOffset,
    };
  }

  if (splitType === "custom") {
    const rawShares = {};
    memberIds.forEach((memberId) => {
      rawShares[memberId] = toCents(expense?.customAmounts?.[memberId]);
    });
    return {
      sharesById: reconcileShareCents(memberIds, rawShares, amountCents, warnings),
      splitType,
      warnings,
      nextOffset: remainderOffset,
    };
  }

  if (splitType === "percentage") {
    const totalPercent = memberIds.reduce(
      (sum, memberId) => sum + finiteNumber(expense?.customAmounts?.[memberId]),
      0,
    );
    if (Math.abs(totalPercent - 100) > 0.01) {
      warnings.push(
        `Saved percentages total ${cleanAmount(totalPercent)}%, expected 100%. Shares were normalized for calculation.`,
      );
    }

    if (totalPercent <= 0) {
      const equal = splitEquallyCents(amountCents, memberIds, remainderOffset);
      return {
        sharesById: equal.shares,
        splitType,
        warnings,
        nextOffset: equal.nextOffset,
      };
    }

    const sharesById = {};
    let used = 0;
    memberIds.forEach((memberId, index) => {
      if (index === memberIds.length - 1) {
        sharesById[memberId] = amountCents - used;
        return;
      }
      const cents = Math.round(
        (amountCents * finiteNumber(expense?.customAmounts?.[memberId])) /
          totalPercent,
      );
      sharesById[memberId] = cents;
      used += cents;
    });
    return {
      sharesById,
      splitType,
      warnings,
      nextOffset: remainderOffset,
    };
  }

  const equal = splitEquallyCents(amountCents, memberIds, remainderOffset);
  return {
    sharesById: equal.shares,
    splitType: "equal",
    warnings,
    nextOffset: equal.nextOffset,
  };
}

export function calcShares(expense) {
  const memberIds = normalizeIds(rawMemberIds(expense), [], {
    allowWallet: false,
  });
  const { sharesById } = calculateShareCents(expense, memberIds, 0);
  return Object.fromEntries(
    memberIds.map((memberId) => [memberId, fromCents(sharesById[memberId] || 0)]),
  );
}

function memberNameMap(members) {
  return new Map(members.map((member) => [member.id, member]));
}

function decoratePayer(payer, membersById) {
  const member = membersById.get(payer.memberId);
  return {
    memberId: payer.memberId,
    id: payer.memberId,
    name: member?.name || payer.memberId,
    color: member?.color,
    amount: cleanAmount(payer.amount),
    amountCents: toCents(payer.amount),
  };
}

function buildCalculationModel(members = [], expenses = []) {
  const safeMembers = normalizeMembers(members);
  const humanIds = safeMembers.map((member) => member.id);
  const membersById = memberNameMap(safeMembers);
  const normalizedExpenses = normalizeExpenses(expenses, [
    ...safeMembers,
    WALLET_MEMBER,
  ]);
  let directRemainderOffset = 0;
  let fundRemainderOffset = 0;

  const records = normalizedExpenses.map((expense, index) => {
    const deposit = isSharedFundDeposit(expense);
    const fundSpend = isSharedFundSpend(expense);
    const participantIds = deposit
      ? []
      : normalizeIds(expense.memberIds, humanIds, { allowWallet: false });
    const payerRows = fundSpend
      ? []
      : normalizeContributors(expense.contributors, humanIds, {
          allowWallet: false,
        }).map((payer) => decoratePayer(payer, membersById));
    const shareOffset = fundSpend ? fundRemainderOffset : directRemainderOffset;
    const shareResult = deposit
      ? {
          sharesById: {},
          splitType: splitTypeOf(expense.splitType),
          warnings: [],
          nextOffset: shareOffset,
        }
      : calculateShareCents(expense, participantIds, shareOffset);

    if (!deposit && shareResult.splitType === "equal" && participantIds.length) {
      if (fundSpend) {
        fundRemainderOffset = shareResult.nextOffset;
      } else {
        directRemainderOffset = shareResult.nextOffset;
      }
    }

    const participants = participantIds.map((memberId) => {
      const member = membersById.get(memberId);
      const shareCents = shareResult.sharesById[memberId] || 0;
      return {
        memberId,
        id: memberId,
        name: member?.name || memberId,
        color: member?.color,
        shareAmount: fromCents(shareCents),
        shareCents,
      };
    });

    const paymentSource = fundSpend ? "sharedFund" : "members";
    const kind = deposit ? "fundDeposit" : fundSpend ? "fundExpense" : "directExpense";
    const includedInDirectSettlement =
      kind === "directExpense" && payerRows.length > 0 && participants.length > 0;
    const includedInSharedFund = kind === "fundDeposit" || kind === "fundExpense";

    return {
      ...expense,
      sourceIndex: index,
      kind,
      paymentSource,
      amountCents: toCents(expense.amount),
      payers: payerRows,
      participants,
      splitType: shareResult.splitType,
      shareAmounts: Object.fromEntries(
        participants.map((participant) => [
          participant.memberId,
          participant.shareAmount,
        ]),
      ),
      shareCents: Object.fromEntries(
        participants.map((participant) => [
          participant.memberId,
          participant.shareCents,
        ]),
      ),
      includedInDirectSettlement,
      includedInSharedFund,
      warnings: shareResult.warnings,
    };
  });

  return {
    members: safeMembers,
    expenses: records,
    directExpenses: records.filter((record) => record.kind === "directExpense"),
    fundDeposits: records.filter((record) => record.kind === "fundDeposit"),
    fundSpends: records.filter((record) => record.kind === "fundExpense"),
  };
}

function buildSettlementsFromCents(members, balancesById, prefix = "settlement") {
  const creditors = [];
  const debtors = [];

  members.forEach((member) => {
    const balanceCents = Math.round(balancesById[member.id] || 0);
    if (balanceCents > DIRECT_TOLERANCE_CENTS) {
      creditors.push({
        id: member.id,
        name: member.name,
        color: member.color,
        amountCents: balanceCents,
      });
    } else if (balanceCents < -DIRECT_TOLERANCE_CENTS) {
      debtors.push({
        id: member.id,
        name: member.name,
        color: member.color,
        amountCents: -balanceCents,
      });
    }
  });

  const cred = creditors
    .map((creditor) => ({ ...creditor }))
    .sort((a, b) => b.amountCents - a.amountCents || a.name.localeCompare(b.name));
  const debt = debtors
    .map((debtor) => ({ ...debtor }))
    .sort((a, b) => b.amountCents - a.amountCents || a.name.localeCompare(b.name));
  const settlements = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < cred.length && debtorIndex < debt.length) {
    const transferCents = Math.min(
      cred[creditorIndex].amountCents,
      debt[debtorIndex].amountCents,
    );
    if (transferCents > DIRECT_TOLERANCE_CENTS) {
      settlements.push({
        id: `${prefix}-${debt[debtorIndex].id}-${cred[creditorIndex].id}-${settlements.length}`,
        from: {
          id: debt[debtorIndex].id,
          name: debt[debtorIndex].name,
          color: debt[debtorIndex].color,
        },
        to: {
          id: cred[creditorIndex].id,
          name: cred[creditorIndex].name,
          color: cred[creditorIndex].color,
        },
        amount: fromCents(transferCents),
        amountCents: transferCents,
      });
    }
    cred[creditorIndex].amountCents -= transferCents;
    debt[debtorIndex].amountCents -= transferCents;
    if (cred[creditorIndex].amountCents <= DIRECT_TOLERANCE_CENTS) {
      creditorIndex += 1;
    }
    if (debt[debtorIndex].amountCents <= DIRECT_TOLERANCE_CENTS) {
      debtorIndex += 1;
    }
  }

  return settlements;
}

export function calcDirectSettlement(members = [], expenses = []) {
  const model = buildCalculationModel(members, expenses);
  const rowsById = new Map(
    model.members.map((member) => [
      member.id,
      {
        ...member,
        directPaidCents: 0,
        directOwedCents: 0,
      },
    ]),
  );

  model.expenses
    .filter((expense) => expense.includedInDirectSettlement)
    .forEach((expense) => {
      expense.payers.forEach((payer) => {
        const row = rowsById.get(payer.memberId);
        if (row) row.directPaidCents += payer.amountCents;
      });
      expense.participants.forEach((participant) => {
        const row = rowsById.get(participant.memberId);
        if (row) row.directOwedCents += participant.shareCents;
      });
    });

  const balancesCents = {};
  const memberSummaries = model.members.map((member) => {
    const row = rowsById.get(member.id);
    const directBalanceCents =
      row.directPaidCents - row.directOwedCents;
    balancesCents[member.id] =
      Math.abs(directBalanceCents) <= DIRECT_TOLERANCE_CENTS
        ? 0
        : directBalanceCents;
    return {
      ...member,
      directPaid: fromCents(row.directPaidCents),
      directOwed: fromCents(row.directOwedCents),
      directShare: fromCents(row.directOwedCents),
      directBalance: fromCents(balancesCents[member.id]),
      paid: fromCents(row.directPaidCents),
      owed: fromCents(row.directOwedCents),
      balance: fromCents(balancesCents[member.id]),
    };
  });

  const settlements = buildSettlementsFromCents(
    model.members,
    balancesCents,
    "direct-settlement",
  );
  const totalDirectExpenseCents = model.expenses
    .filter((expense) => expense.includedInDirectSettlement)
    .reduce((sum, expense) => sum + expense.amountCents, 0);

  return {
    members: model.members,
    expenses: model.expenses.filter((expense) => expense.includedInDirectSettlement),
    memberSummaries,
    balancesCents,
    balances: Object.fromEntries(
      Object.entries(balancesCents).map(([memberId, cents]) => [
        memberId,
        fromCents(cents),
      ]),
    ),
    settlements,
    totalDirectExpense: fromCents(totalDirectExpenseCents),
  };
}

export function buildBalances(members = [], expenses = []) {
  return calcDirectSettlement(members, expenses).balances;
}

export function calcSettlements(members = [], expenses = []) {
  return calcDirectSettlement(members, expenses).settlements;
}

export function getPersonalExpenses(expenses = []) {
  return (Array.isArray(expenses) ? expenses : []).filter(
    (expense) => !isSharedFundExpense(expense),
  );
}

export function calcPersonalSettlements(members = [], expenses = []) {
  return calcDirectSettlement(normalizeMembers(members), getPersonalExpenses(expenses))
    .settlements;
}

export function getSharedFundSummary(members = [], expenses = []) {
  const model = buildCalculationModel(members, expenses);
  const rowsById = new Map(
    model.members.map((member) => [
      member.id,
      {
        ...member,
        depositedCents: 0,
        usedCents: 0,
      },
    ]),
  );

  model.fundDeposits.forEach((deposit) => {
    deposit.payers.forEach((payer) => {
      const row = rowsById.get(payer.memberId);
      if (row) row.depositedCents += payer.amountCents;
    });
  });

  model.fundSpends.forEach((expense) => {
    expense.participants.forEach((participant) => {
      const row = rowsById.get(participant.memberId);
      if (row) row.usedCents += participant.shareCents;
    });
  });

  const depositsCents = model.fundDeposits.reduce(
    (sum, expense) => sum + expense.amountCents,
    0,
  );
  const spendCents = model.fundSpends.reduce(
    (sum, expense) => sum + expense.amountCents,
    0,
  );
  const balanceCents = depositsCents - spendCents;

  const memberPositions = model.members.map((member) => {
    const row = rowsById.get(member.id);
    const netCents = row.depositedCents - row.usedCents;
    return {
      ...member,
      deposited: fromCents(row.depositedCents),
      used: fromCents(row.usedCents),
      net: fromCents(netCents),
      fundPosition: fromCents(netCents),
    };
  });

  return {
    balance: fromCents(balanceCents),
    balanceCents,
    deposits: fromCents(depositsCents),
    totalDeposited: fromCents(depositsCents),
    spend: fromCents(spendCents),
    spentFromFund: fromCents(spendCents),
    fundDeposits: model.fundDeposits,
    fundSpends: model.fundSpends,
    memberPositions,
    hasActivity: model.fundDeposits.length > 0 || model.fundSpends.length > 0,
    hasDifferentDeposits:
      new Set(memberPositions.map((row) => row.deposited)).size > 1,
    settlementSuggestions: [],
  };
}

export function buildGroupBalances(members = [], expenses = []) {
  return buildBalances(members, expenses);
}

export function calcGroupSettlements(members = [], expenses = []) {
  return calcDirectSettlement(members, expenses).settlements;
}

export function getMemberSummary(members = [], expenses = []) {
  return calcDirectSettlement(members, expenses).memberSummaries;
}

export function getCalculationReport(members = [], expenses = []) {
  const model = buildCalculationModel(members, expenses);
  const direct = calcDirectSettlement(model.members, model.expenses);
  const sharedFund = getSharedFundSummary(model.members, model.expenses);

  return {
    members: model.members,
    expenses: model.expenses.map((expense) => ({
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      paymentSource: expense.paymentSource,
      kind: expense.kind,
      payers: expense.payers,
      participants: expense.participants,
      splitType: expense.splitType,
      shareAmounts: expense.shareAmounts,
      includedInDirectSettlement: expense.includedInDirectSettlement,
      includedInSharedFund: expense.includedInSharedFund,
      warnings: expense.warnings,
    })),
    direct,
    sharedFund,
  };
}

export function validateSplit(expense) {
  const amount = cleanAmount(expense?.amount);
  const amountCents = toCents(amount);
  if (amountCents <= 0) {
    return { valid: false, error: "Amount must be greater than 0." };
  }

  const memberIds = normalizeIds(rawMemberIds(expense), [], {
    allowWallet: false,
  });
  if (!memberIds.length) {
    return { valid: false, error: "At least one member must be selected." };
  }

  if (!Array.isArray(expense?.contributors) || !expense.contributors.length) {
    return { valid: false, error: "At least one contributor must pay." };
  }

  const contributorCents = expense.contributors.reduce(
    (sum, contributor) => sum + toCents(contributor.amount),
    0,
  );
  if (expense.contributors.some((item) => toCents(item.amount) <= 0)) {
    return { valid: false, error: "Contributor amounts must be positive." };
  }
  if (contributorCents !== amountCents) {
    return {
      valid: false,
      error: `Paid amounts must total ${formatEngineMoney(amount)}.`,
    };
  }

  if (expense.splitType === "custom") {
    const hasNegative = memberIds.some(
      (id) => finiteNumber(expense.customAmounts?.[id]) < 0,
    );
    if (hasNegative) {
      return { valid: false, error: "Custom amounts cannot be negative." };
    }
    const customCents = memberIds.reduce(
      (total, id) => total + toCents(expense.customAmounts?.[id]),
      0,
    );
    if (customCents !== amountCents) {
      return {
        valid: false,
        error: `Custom split total must equal ${formatEngineMoney(amount)}.`,
      };
    }
  }

  if (expense.splitType === "percentage") {
    const hasNegative = memberIds.some(
      (id) => finiteNumber(expense.customAmounts?.[id]) < 0,
    );
    if (hasNegative) {
      return { valid: false, error: "Percentages cannot be negative." };
    }
    const sum = memberIds.reduce(
      (total, id) => total + finiteNumber(expense.customAmounts?.[id]),
      0,
    );
    if (Math.abs(sum - 100) > 0.01) {
      return {
        valid: false,
        error: "Percentages must total 100%.",
      };
    }
  }

  return { valid: true, error: null };
}

function formatEngineMoney(value) {
  return `${cleanAmount(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })} BDT`;
}

export function getGroupStats(members = [], expenses = []) {
  const safeMembers = normalizeMembers(members);
  const direct = calcDirectSettlement(safeMembers, expenses);
  const total = toCents(direct.totalDirectExpense);

  return {
    totalExpenses: fromCents(total),
    perPerson: safeMembers.length ? fromCents(Math.round(total / safeMembers.length)) : 0,
    expenseCount: direct.expenses.length,
    memberCount: safeMembers.length,
    settlementCount: direct.settlements.length,
    isSettled: direct.settlements.length === 0 && direct.expenses.length > 0,
  };
}
