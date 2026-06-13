import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Card from "../../components/Card";
import { DAYS_IN_MONTH, DAYS_PASSED } from "../../utils/constants";
import {
  calcBudgetStatus,
  calcDailyAvg,
  calcHealthScore,
  money,
} from "../../utils/helpers";

function StatCell({ label, value, sub, color = "slate" }) {
  const colors = {
    slate: "#f8fafc",
    green: "#ecfdf5",
    red: "#fee2e2",
    amber: "#fef3c7",
    blue: "#e0f2fe",
  };

  return (
    <Card
      style={[
        styles.statCard,
        { backgroundColor: colors[color] || colors.slate },
      ]}
    >
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </Card>
  );
}

function StatsGrid({ monthlyBudget, totalSpent, remaining, expenses = [] }) {
  const dailyAvg = calcDailyAvg(totalSpent, DAYS_PASSED);
  const healthScore = calcHealthScore(remaining, monthlyBudget);
  const safeBudget = Math.max(Number(monthlyBudget) || 0, 0);
  const safeSpent = Math.max(Number(totalSpent) || 0, 0);
  const spentPct = Math.max(
    0,
    Math.min(999, Math.round((safeSpent / Math.max(safeBudget, 1)) * 100)),
  );
  const daysLeft = dailyAvg
    ? Math.max(0, Math.floor(remaining / dailyAvg))
    : Math.max(0, DAYS_IN_MONTH - DAYS_PASSED);
  const biggestExpense = (Array.isArray(expenses) ? expenses : []).reduce(
    (max, item) =>
      Number(item.amount || 0) > Number(max.amount || 0) ? item : max,
    { amount: 0, category: "-", note: "-" },
  );
  const { status, projectedSpend } = calcBudgetStatus(
    monthlyBudget,
    totalSpent,
  );
  const statusColor =
    status === "Critical" ? "red" : status === "Warning" ? "amber" : "green";

  return (
    <View style={styles.wrapper}>
      <Card>
        <View style={styles.healthRow}>
          <View>
            <Text style={styles.healthLabel}>Financial Health Score</Text>
            <Text style={styles.healthScore}>{healthScore}</Text>
          </View>
          <View style={styles.healthProgressWrap}>
            <View style={styles.healthTrack}>
              <View style={[styles.healthFill, { width: `${healthScore}%` }]} />
            </View>
            <Text style={styles.healthCaption}>Budget used: {spentPct}%</Text>
          </View>
        </View>
      </Card>

      <View style={styles.grid}>
        <StatCell
          label="Daily avg spend"
          value={money(Math.round(dailyAvg))}
          sub={`Based on last ${DAYS_PASSED} days`}
        />
        <StatCell
          label="Budget lasts"
          value={`${daysLeft} days`}
          sub={`At ${money(Math.round(dailyAvg))}/day`}
          color={daysLeft < 5 ? "red" : daysLeft < 10 ? "amber" : "green"}
        />
        <StatCell
          label="Biggest expense"
          value={money(biggestExpense.amount)}
          sub={`${biggestExpense.category} - ${String(biggestExpense.note || "").slice(0, 30)}`}
        />
        <StatCell
          label="Month-end projection"
          value={money(Math.round(projectedSpend))}
          sub={
            projectedSpend > monthlyBudget
              ? `Budget ${money(Math.round(projectedSpend - monthlyBudget))} cross korbe`
              : `${money(Math.round(monthlyBudget - projectedSpend))} bachbe`
          }
          color={statusColor}
        />
        <StatCell
          label="Budget status"
          value={status}
          sub={`Pace check on day ${DAYS_PASSED}`}
          color={statusColor}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
  },
  healthRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  healthLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  healthScore: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 4,
  },
  healthProgressWrap: {
    minWidth: 160,
    flex: 1,
  },
  healthTrack: {
    height: 10,
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    overflow: "hidden",
  },
  healthFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 999,
  },
  healthCaption: {
    marginTop: 6,
    fontSize: 11,
    color: "#64748b",
  },
  grid: {
    gap: 12,
  },
  statCard: {
    borderColor: "#e2e8f0",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  statValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  statSub: {
    marginTop: 6,
    fontSize: 11,
    color: "#64748b",
  },
});

export default StatsGrid;
