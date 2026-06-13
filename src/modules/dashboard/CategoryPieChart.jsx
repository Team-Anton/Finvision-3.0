import React, { useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-chart-kit";
import Card from "../../components/Card";
import { money } from "../../utils/helpers";

const COLORS = [
  "#f97316",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#94a3b8",
];

function buildPieData(expenses = []) {
  const totals = expenses
    .filter((item) => Number(item?.amount || 0) > 0)
    .reduce((map, item) => {
      const category = item.category || "Miscellaneous";
      map[category] = (map[category] || 0) + Number(item.amount || 0);
      return map;
    }, {});

  return Object.entries(totals)
    .map(([name, value], index) => ({
      name,
      value: Math.round(value),
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
}

function CategoryPieChart({ expenses = [] }) {
  const data = useMemo(() => buildPieData(expenses), [expenses]);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartWidth = Math.max(280, Dimensions.get("window").width - 64);

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Category Breakdown</Text>
        <Text style={styles.subtitle}>
          Kon category te beshi taka khoroch hocche.
        </Text>
      </View>

      {!data.length ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Kono data nei</Text>
          <Text style={styles.emptySubtitle}>
            Expense add korle category breakdown dekhabe.
          </Text>
        </View>
      ) : (
        <View style={styles.chartRow}>
          <PieChart
            data={data.map((item) => ({
              name: item.name,
              population: item.value,
              color: item.color,
              legendFontColor: "#0f172a",
              legendFontSize: 12,
            }))}
            width={chartWidth}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="16"
            center={[10, 0]}
            hasLegend={false}
          />
          <View style={styles.legend}>
            {data.map((item) => (
              <View key={item.name} style={styles.legendRow}>
                <View
                  style={[styles.legendDot, { backgroundColor: item.color }]}
                />
                <View style={styles.legendText}>
                  <Text style={styles.legendLabel}>{item.name}</Text>
                  <Text style={styles.legendValue}>
                    {money(item.value)} •{" "}
                    {Math.round((item.value / Math.max(total, 1)) * 100)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
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
  chartRow: {
    gap: 16,
  },
  legend: {
    gap: 10,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontWeight: "700",
    color: "#0f172a",
  },
  legendValue: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
});

export default CategoryPieChart;
