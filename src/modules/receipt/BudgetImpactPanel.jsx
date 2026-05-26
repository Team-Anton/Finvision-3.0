import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { calcRemaining, calcTotalSpent, money } from "../../utils/helpers";

function BudgetImpactPanel({ receiptItems = [] }) {
  const { monthlyBudget, expenses } = useSelector((state) => state.budget);
  const totalSpent = calcTotalSpent(expenses);
  const remaining = calcRemaining(monthlyBudget, totalSpent);
  const receiptTotal = receiptItems.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );
  const afterSpent = totalSpent + receiptTotal;
  const afterRemaining = Math.max(monthlyBudget - afterSpent, 0);

  if (!receiptItems.length) {
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>Budget Impact</Text>
        <Text style={styles.subtitle}>
          Receipt extract korle ekhane budget impact dekhabe.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Budget Impact</Text>
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.label}>Current remaining</Text>
          <Text style={styles.value}>{money(remaining)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>This receipt</Text>
          <Text style={styles.value}>{money(receiptTotal)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>After spent</Text>
          <Text style={styles.value}>{money(afterSpent)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>After left</Text>
          <Text style={styles.value}>{money(afterRemaining)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#0f172a",
    padding: 16,
    borderRadius: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#cbd5f5",
  },
  grid: {
    marginTop: 12,
    gap: 10,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 10,
    borderRadius: 12,
  },
  label: {
    fontSize: 11,
    color: "#cbd5f5",
  },
  value: {
    marginTop: 4,
    fontWeight: "800",
    color: "#ffffff",
  },
});

export default BudgetImpactPanel;
