const fs = require("fs");
const path = require("path");
const assert = require("assert");

async function loadEngine() {
  const enginePath = path.join(
    process.cwd(),
    "src",
    "modules",
    "groupSplit",
    "SplitEngine.js",
  );
  const source = fs.readFileSync(enginePath, "utf8");
  const url = `data:text/javascript;base64,${Buffer.from(source).toString(
    "base64",
  )}`;
  return import(url);
}

function member(id) {
  return { id, name: id, color: { hex: "#0f172a" } };
}

function expense({
  id,
  title,
  amount,
  contributors,
  memberIds,
  splitType = "equal",
  customAmounts = {},
  paymentSource,
}) {
  return {
    id,
    title,
    amount,
    contributors,
    memberIds,
    splitType,
    customAmounts,
    paymentSource,
    createdAt: 1,
    date: "01 Jan",
  };
}

function findSettlement(settlements, from, to) {
  return settlements.find(
    (settlement) => settlement.from.id === from && settlement.to.id === to,
  );
}

function assertAmount(actual, expected, label, tolerance = 0.01) {
  assert(
    Math.abs(Number(actual) - Number(expected)) <= tolerance,
    `${label}: expected ${expected}, got ${actual}`,
  );
}

function assertSettlement(settlements, from, to, amount, tolerance = 0.01) {
  const match = findSettlement(settlements, from, to);
  assert(match, `Missing settlement ${from} -> ${to}`);
  assertAmount(match.amount, amount, `${from} -> ${to}`, tolerance);
}

function logPass(name) {
  console.log(`PASS ${name}`);
}

(async () => {
  const engine = await loadEngine();
  const {
    WALLET_ID,
    WALLET_MEMBER,
    calcDirectSettlement,
    getSharedFundSummary,
    validateSplit,
  } = engine;

  {
    const members = [member("shanto"), member("sifat"), member("shahriar")];
    const all = members.map((item) => item.id);
    const expenses = [
      expense({
        id: "tour",
        title: "Tour",
        amount: 9000,
        contributors: [
          { memberId: "shanto", amount: 3000 },
          { memberId: "sifat", amount: 2500 },
          { memberId: "shahriar", amount: 3500 },
        ],
        memberIds: all,
      }),
      expense({
        id: "hotel",
        title: "hotel",
        amount: 4000,
        contributors: [
          { memberId: "shanto", amount: 2000 },
          { memberId: "shahriar", amount: 2000 },
        ],
        memberIds: all,
      }),
      expense({
        id: "shopping",
        title: "shopping",
        amount: 1200,
        contributors: [{ memberId: "shanto", amount: 1200 }],
        memberIds: all,
      }),
      expense({
        id: "eating",
        title: "eating",
        amount: 300,
        contributors: [{ memberId: "shanto", amount: 300 }],
        memberIds: all,
      }),
      expense({
        id: "puran",
        title: "Tour to puran dhaka",
        amount: 1000,
        contributors: [
          { memberId: "shanto", amount: 400 },
          { memberId: "sifat", amount: 300 },
          { memberId: "shahriar", amount: 300 },
        ],
        memberIds: all,
      }),
      expense({
        id: "dep-shanto",
        title: "Shared Fund deposit",
        amount: 1150,
        contributors: [{ memberId: "shanto", amount: 1150 }],
        memberIds: [WALLET_ID],
      }),
      expense({
        id: "dep-sifat",
        title: "Shared Fund deposit",
        amount: 500,
        contributors: [{ memberId: "sifat", amount: 500 }],
        memberIds: [WALLET_ID],
      }),
      expense({
        id: "dep-shahriar",
        title: "Shared Fund deposit",
        amount: 300,
        contributors: [{ memberId: "shahriar", amount: 300 }],
        memberIds: [WALLET_ID],
      }),
      expense({
        id: "food",
        title: "food",
        amount: 400,
        contributors: [{ memberId: WALLET_ID, amount: 400 }],
        memberIds: all,
        paymentSource: "sharedFund",
      }),
    ];
    const direct = calcDirectSettlement(members, expenses);
    const byId = Object.fromEntries(
      direct.memberSummaries.map((summary) => [summary.id, summary]),
    );
    assertAmount(byId.shanto.directPaid, 6900, "shanto direct paid");
    assertAmount(byId.sifat.directPaid, 2800, "sifat direct paid");
    assertAmount(byId.shahriar.directPaid, 5800, "shahriar direct paid");
    assertAmount(direct.totalDirectExpense, 15500, "total direct expense");
    assertAmount(byId.shanto.directOwed, 5166.67, "shanto direct owed");
    assertAmount(byId.sifat.directOwed, 5166.67, "sifat direct owed");
    assertAmount(byId.shahriar.directOwed, 5166.66, "shahriar direct owed");
    assertSettlement(direct.settlements, "sifat", "shanto", 1733.33);
    assertSettlement(direct.settlements, "sifat", "shahriar", 633.34);

    const fund = getSharedFundSummary(members, expenses);
    assertAmount(fund.balance, 1550, "fund balance");
    const fundById = Object.fromEntries(
      fund.memberPositions.map((position) => [position.id, position]),
    );
    assertAmount(fundById.shanto.net, 1016.67, "shanto fund position");
    assertAmount(fundById.sifat.net, 366.67, "sifat fund position");
    assertAmount(fundById.shahriar.net, 166.67, "shahriar fund position");
    assertAmount(
      fund.memberPositions.reduce((sum, position) => sum + position.net, 0),
      fund.balance,
      "fund positions sum to balance",
    );
    logPass("Test 1: screenshot direct + fund case");
  }

  {
    const members = [member("A"), member("B"), member("C")];
    const direct = calcDirectSettlement(members, [
      expense({
        id: "equal",
        title: "Equal",
        amount: 900,
        contributors: [{ memberId: "A", amount: 900 }],
        memberIds: ["A", "B", "C"],
      }),
    ]);
    assertSettlement(direct.settlements, "B", "A", 300);
    assertSettlement(direct.settlements, "C", "A", 300);
    logPass("Test 2: direct equal split only");
  }

  {
    const members = [member("A"), member("B"), member("C")];
    const direct = calcDirectSettlement(members, [
      expense({
        id: "multi",
        title: "Multiple contributors",
        amount: 1000,
        contributors: [
          { memberId: "A", amount: 600 },
          { memberId: "B", amount: 400 },
        ],
        memberIds: ["A", "B", "C"],
      }),
    ]);
    assertSettlement(direct.settlements, "C", "A", 266.66);
    assertSettlement(direct.settlements, "C", "B", 66.67);
    assert.strictEqual(getSharedFundSummary(members, direct.expenses).hasActivity, false);
    logPass("Test 3: multiple contributors");
  }

  {
    const members = [member("A"), member("B"), member("C")];
    const direct = calcDirectSettlement(members, [
      expense({
        id: "custom",
        title: "Custom",
        amount: 1000,
        contributors: [{ memberId: "B", amount: 1000 }],
        memberIds: ["A", "B", "C"],
        splitType: "custom",
        customAmounts: { A: 200, B: 300, C: 500 },
      }),
    ]);
    assertSettlement(direct.settlements, "A", "B", 200);
    assertSettlement(direct.settlements, "C", "B", 500);
    assert(!Number.isNaN(direct.memberSummaries[0].directOwed));
    logPass("Test 4: custom split");
  }

  {
    const members = [member("A"), member("B"), member("C")];
    const direct = calcDirectSettlement(members, [
      expense({
        id: "percent",
        title: "Percentage",
        amount: 2000,
        contributors: [{ memberId: "C", amount: 2000 }],
        memberIds: ["A", "B", "C"],
        splitType: "percentage",
        customAmounts: { A: 25, B: 25, C: 50 },
      }),
    ]);
    const byId = Object.fromEntries(
      direct.memberSummaries.map((summary) => [summary.id, summary]),
    );
    assertAmount(byId.A.directOwed, 500, "A percent owed");
    assertAmount(byId.B.directOwed, 500, "B percent owed");
    assertAmount(byId.C.directOwed, 1000, "C percent owed");
    assertSettlement(direct.settlements, "A", "C", 500);
    assertSettlement(direct.settlements, "B", "C", 500);
    logPass("Test 5: percentage split");
  }

  {
    const members = [member("A"), member("B"), member("C")];
    const expenses = [
      expense({
        id: "dep-a",
        title: "Shared Fund deposit",
        amount: 2000,
        contributors: [{ memberId: "A", amount: 2000 }],
        memberIds: [WALLET_ID],
      }),
      expense({
        id: "dep-b",
        title: "Shared Fund deposit",
        amount: 500,
        contributors: [{ memberId: "B", amount: 500 }],
        memberIds: [WALLET_ID],
      }),
      expense({
        id: "fund-only",
        title: "Fund only",
        amount: 900,
        contributors: [{ memberId: WALLET_ID, amount: 900 }],
        memberIds: ["A", "B", "C"],
        paymentSource: "sharedFund",
      }),
    ];
    assert.strictEqual(calcDirectSettlement(members, expenses).settlements.length, 0);
    const fund = getSharedFundSummary(members, expenses);
    const byId = Object.fromEntries(
      fund.memberPositions.map((position) => [position.id, position]),
    );
    assertAmount(fund.balance, 1600, "fund-only balance");
    assertAmount(byId.A.net, 1700, "fund-only A net");
    assertAmount(byId.B.net, 200, "fund-only B net");
    assertAmount(byId.C.net, -300, "fund-only C net");
    logPass("Test 6: shared fund only");
  }

  {
    const members = [member("A"), member("B"), member("C")];
    const expenses = [
      expense({
        id: "direct",
        title: "Direct",
        amount: 900,
        contributors: [{ memberId: "A", amount: 900 }],
        memberIds: ["A", "B", "C"],
      }),
      expense({
        id: "dep-a",
        title: "Shared Fund deposit",
        amount: 2000,
        contributors: [{ memberId: "A", amount: 2000 }],
        memberIds: [WALLET_ID],
      }),
      expense({
        id: "fund-spend",
        title: "Fund spend",
        amount: 600,
        contributors: [{ memberId: WALLET_ID, amount: 600 }],
        memberIds: ["A", "B", "C"],
        paymentSource: "sharedFund",
      }),
    ];
    const direct = calcDirectSettlement(members, expenses);
    assertSettlement(direct.settlements, "B", "A", 300);
    assertSettlement(direct.settlements, "C", "A", 300);
    const fund = getSharedFundSummary(members, expenses);
    assertAmount(fund.balance, 1400, "mixed fund balance");
    logPass("Test 7: mixed direct + fund");
  }

  {
    const invalid = validateSplit(
      expense({
        id: "invalid-custom",
        title: "Invalid custom",
        amount: 1000,
        contributors: [{ memberId: "A", amount: 1000 }],
        memberIds: ["A", "B", "C"],
        splitType: "custom",
        customAmounts: { A: 300, B: 300, C: 300 },
      }),
    );
    assert.strictEqual(invalid.valid, false);
    assert.strictEqual(invalid.error, "Custom split total must equal 1,000 BDT.");
    logPass("Test 8: invalid custom split");
  }

  {
    const invalid = validateSplit(
      expense({
        id: "invalid-percent",
        title: "Invalid percent",
        amount: 1000,
        contributors: [{ memberId: "A", amount: 1000 }],
        memberIds: ["A", "B", "C"],
        splitType: "percentage",
        customAmounts: { A: 30, B: 30, C: 30 },
      }),
    );
    assert.strictEqual(invalid.valid, false);
    assert.strictEqual(invalid.error, "Percentages must total 100%.");
    logPass("Test 9: invalid percentage split");
  }

  {
    const members = [member("A"), member("B"), WALLET_MEMBER];
    const direct = calcDirectSettlement(members, [
      expense({
        id: "old-wallet-member",
        title: "Old direct expense",
        amount: 300,
        contributors: [{ memberId: "A", amount: 300 }],
        memberIds: ["A", "B", WALLET_ID],
      }),
    ]);
    assertSettlement(direct.settlements, "B", "A", 150);
    assert(
      direct.memberSummaries.every((summary) => summary.id !== WALLET_ID),
      "Shared Fund pseudo-member should be removed",
    );
    assert(
      direct.settlements.every(
        (settlement) =>
          settlement.from.id !== WALLET_ID && settlement.to.id !== WALLET_ID,
      ),
      "Shared Fund should not appear in main settlement",
    );
    logPass("Test 10: old data migration");
  }

  console.log("All Group Split math tests passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
