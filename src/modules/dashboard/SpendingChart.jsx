import React, { useMemo, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { money } from "../../utils/helpers";

function buildDailyData(expenses = [], monthlyBudget = 0) {
  const dayMap = expenses.reduce((map, item) => {
    const date = item.date || "Unknown";
    const amount = Number(item.amount || 0);
    if (!map[date]) map[date] = { date, spent: 0, income: 0 };
    if (amount > 0) map[date].spent += amount;
    if (amount < 0) map[date].income += Math.abs(amount);
    return map;
  }, {});
  let cumulative = 0;
  return Object.values(dayMap).map((item) => {
    cumulative += item.spent;
    return {
      ...item,
      spent: Math.round(item.spent),
      cumulative: Math.round(cumulative),
      dailyBudget: Math.round(monthlyBudget / 30),
    };
  });
}

function EmptyChart() {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>Kono data nei</Text>
      <Text style={styles.emptySubtitle}>Expense add korle chart dekhabe.</Text>
    </View>
  );
}

function SpendingChart({ expenses = [], monthlyBudget = 0 }) {
  const [chartType, setChartType] = useState("bar");
  const data = useMemo(
    () => buildDailyData(expenses, monthlyBudget),
    [expenses, monthlyBudget],
  );
  const dailyBudget = Math.round(monthlyBudget / 30);
  const chartWidth = Dimensions.get("window").width - 64;
  const displayData = data.slice(-7);

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#0f172a",
    },
  };

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {chartType === "bar" ? "Daily Spending" : "Cumulative Spending"}
          </Text>
          <Text style={styles.subtitle}>
            Daily limit: {money(dailyBudget)}/day.
          </Text>
        </View>
        <View style={styles.toggleRow}>
          <Button
            variant={chartType === "bar" ? "primary" : "outline"}
            onPress={() => setChartType("bar")}
          >
            Daily
          </Button>
          <Button
            variant={chartType === "line" ? "primary" : "outline"}
            onPress={() => setChartType("line")}
          >
            Cumulative
          </Button>
        </View>
      </View>

      {!data.length ? (
        <EmptyChart />
      ) : chartType === "bar" ? (
        <BarChart
          data={{
            labels: displayData.map((item) => item.date),
            datasets: [{ data: displayData.map((item) => item.spent) }],
          }}
          width={chartWidth}
          height={240}
          fromZero
          chartConfig={chartConfig}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      ) : (
        <LineChart
          data={{
            labels: displayData.map((item) => item.date),
            datasets: [{ data: displayData.map((item) => item.cumulative) }],
          }}
          width={chartWidth}
          height={240}
          fromZero
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
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
  toggleRow: {
    flexDirection: "row",
    gap: 8,
  },
  chart: {
    borderRadius: 12,
  },
  emptyCard: {
    backgroundColor: "#f8fafc",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyTitle: {
    fontWeight: "800",
    color: "#1e293b",
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
});

export default SpendingChart;
