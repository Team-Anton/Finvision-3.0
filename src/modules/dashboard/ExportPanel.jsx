import React, { useState } from "react";
import { Alert, Share, StyleSheet, Text, View } from "react-native";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { CURRENCY } from "../../utils/constants";
import { money } from "../../utils/helpers";

function buildCsv(expenses = [], monthlyBudget = 0) {
  const headers = [
    "Date",
    "Category",
    "Subcategory",
    "Amount (BDT)",
    "Merchant",
    "Note",
    "Currency",
  ];
  const rows = expenses.map((expense) => [
    expense.date || "",
    expense.category || "",
    expense.subcategory || "",
    Number(expense.amount || 0).toFixed(2),
    expense.merchant || "",
    String(expense.note || "").replace(/,/g, ";"),
    expense.currency || CURRENCY,
  ]);
  return [headers, ...rows, [], ["Monthly Budget", "", "", monthlyBudget]]
    .map((row) => row.join(","))
    .join("\n");
}

function buildJson(expenses = [], monthlyBudget = 0) {
  const totalSpent = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );
  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      summary: {
        monthly_budget: monthlyBudget,
        total_spent: totalSpent,
        remaining: Math.max(monthlyBudget - totalSpent, 0),
        total_transactions: expenses.length,
      },
      expenses,
    },
    null,
    2,
  );
}

function ExportButton({ children, onPress, disabled }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant={done ? "success" : "outline"}
      disabled={disabled}
      onPress={async () => {
        await onPress();
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
    >
      {done ? "Shared" : children}
    </Button>
  );
}

async function shareContent(title, content) {
  try {
    await Share.share({ title, message: content });
  } catch (error) {
    Alert.alert(
      "Export unavailable",
      "Share support nai. Text manually copy korte paren.",
    );
  }
}

function ExportPanel({ expenses = [], monthlyBudget = 0 }) {
  const totalSpent = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );
  const dateStamp = new Date().toISOString().slice(0, 10);
  const disabled = !expenses.length;

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Export Data</Text>
        <Text style={styles.subtitle}>
          Expense data CSV, JSON, ba share e export koro.
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Transactions</Text>
          <Text style={styles.summaryValue}>{expenses.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total spent</Text>
          <Text style={styles.summaryValue}>{money(totalSpent)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Budget</Text>
          <Text style={styles.summaryValue}>{money(monthlyBudget)}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <ExportButton
          disabled={disabled}
          onPress={() =>
            shareContent(
              `finvision-expenses-${dateStamp}.csv`,
              buildCsv(expenses, monthlyBudget),
            )
          }
        >
          Export CSV
        </ExportButton>
        <ExportButton
          disabled={disabled}
          onPress={() =>
            shareContent(
              `finvision-expenses-${dateStamp}.json`,
              buildJson(expenses, monthlyBudget),
            )
          }
        >
          Export JSON
        </ExportButton>
        <Button
          variant="outline"
          disabled={disabled}
          onPress={() =>
            shareContent("FinVision Report", buildJson(expenses, monthlyBudget))
          }
        >
          Share report
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
  },
  summaryRow: {
    gap: 10,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  summaryValue: {
    marginTop: 4,
    fontWeight: "800",
    color: "#0f172a",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});

export default ExportPanel;
