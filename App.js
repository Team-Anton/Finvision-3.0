import React, { useEffect } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Provider, useDispatch, useSelector } from "react-redux";
import store from "./src/store/index";
import { loadFromStorage, saveToStorage } from "./src/store/budgetSlice";
import { setActiveTab } from "./src/store/uiSlice";
import { navTabs } from "./src/utils/constants";
import {
  calcHealthScore,
  calcRemaining,
  calcTotalSpent,
  money,
} from "./src/utils/helpers";
import Button from "./src/components/Button";
import AssistantTab from "./src/modules/assistant/AssistantTab";
import DashboardTab from "./src/modules/dashboard/DashboardTab";
import ReceiptTab from "./src/modules/receipt/ReceiptTab";
import GroupSplitTab from "./src/modules/groupSplit/GroupSplitTab";

function RootApp() {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.ui.activeTab);
  const { monthlyBudget, expenses } = useSelector((state) => state.budget);

  useEffect(() => {
    dispatch(loadFromStorage());
  }, [dispatch]);

  useEffect(() => {
    saveToStorage({ budget: { monthlyBudget, expenses } });
  }, [monthlyBudget, expenses]);

  const totalSpent = calcTotalSpent(expenses);
  const remaining = calcRemaining(monthlyBudget, totalSpent);
  const health = calcHealthScore(remaining, monthlyBudget);

  function renderTab() {
    switch (activeTab) {
      case "assistant":
        return <AssistantTab />;
      case "dashboard":
        return <DashboardTab />;
      case "receipt":
        return <ReceiptTab />;
      case "group":
        return <GroupSplitTab />;
      default:
        return <AssistantTab />;
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.containerScroll}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>
            Bangla/Banglish finance assistant
          </Text>
          <Text style={styles.headerTitle}>FinVision AI</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Budget</Text>
              <Text style={styles.summaryValue}>{money(monthlyBudget)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text style={styles.summaryValueGreen}>{money(remaining)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Health</Text>
              <Text style={styles.summaryValue}>{health}/100</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabRow}>
          {navTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "primary" : "outline"}
              onPress={() => dispatch(setActiveTab(tab.key))}
            >
              {tab.label}
            </Button>
          ))}
        </View>

        <View style={styles.body}>{renderTab()}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <RootApp />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  containerScroll: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: "#0f172a",
    padding: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerEyebrow: {
    color: "#34d399",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 6,
  },
  summaryRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 14,
  },
  summaryLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
  },
  summaryValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  summaryValueGreen: {
    color: "#34d399",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
