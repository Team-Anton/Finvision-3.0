import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import Button from "../../components/Button";
import { calcRemaining, calcTotalSpent } from "../../utils/helpers";
import CategoryPieChart from "./CategoryPieChart";
import ExportPanel from "./ExportPanel";
import SpendingChart from "./SpendingChart";
import StatsGrid from "./StatsGrid";

function DashboardTab() {
  const [section, setSection] = useState("overview");
  const { monthlyBudget, expenses = [] } = useSelector((state) => state.budget);
  const totalSpent = calcTotalSpent(expenses);
  const remaining = calcRemaining(monthlyBudget, totalSpent);

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionTabs}>
        {[
          ["overview", "Overview"],
          ["charts", "Charts"],
          ["categories", "Categories"],
          ["export", "Export"],
        ].map(([key, label]) => (
          <Button
            key={key}
            variant={section === key ? "primary" : "outline"}
            onPress={() => setSection(key)}
          >
            {label}
          </Button>
        ))}
      </View>

      {section === "overview" ? (
        <StatsGrid
          monthlyBudget={monthlyBudget}
          totalSpent={totalSpent}
          remaining={remaining}
          expenses={expenses}
        />
      ) : null}
      {section === "charts" ? (
        <SpendingChart expenses={expenses} monthlyBudget={monthlyBudget} />
      ) : null}
      {section === "categories" ? (
        <View style={styles.stack}>
          <CategoryPieChart expenses={expenses} />
          <SpendingChart expenses={expenses} monthlyBudget={monthlyBudget} />
        </View>
      ) : null}
      {section === "export" ? (
        <ExportPanel expenses={expenses} monthlyBudget={monthlyBudget} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
  },
  sectionTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  stack: {
    gap: 16,
  },
});

export default DashboardTab;
