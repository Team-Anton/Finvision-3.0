import React from "react";
import { Alert, Share, StyleSheet, Text, View } from "react-native";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { money } from "../../utils/helpers";
import { MemberAvatar } from "./MemberList";
import {
  calcSettlements,
  getGroupStats,
  getMemberSummary,
  WALLET_ID,
} from "./SplitEngine";

function SettlementSummary({ members = [], expenses = [] }) {
  const settlements = calcSettlements(members, expenses);
  const memberSummaries = getMemberSummary(members, expenses);
  const displayMembers = members.filter((member) => member.id !== WALLET_ID);
  const stats = getGroupStats(displayMembers, expenses);

  async function sharePlan() {
    const text = settlements
      .map(
        (settlement, index) =>
          `${index + 1}. ${settlement.from.name} pays ${money(settlement.amount)} to ${settlement.to.name}`,
      )
      .join("\n");
    try {
      await Share.share({ message: text || "No settlements needed" });
    } catch (error) {
      Alert.alert(
        "Share unavailable",
        "Share support nai. Text manually copy korte paren.",
      );
    }
  }

  return (
    <Card>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Settlement Plan</Text>
          <Text style={styles.subtitle}>
            Minimum transactions e settle korar plan.
          </Text>
        </View>
        <Button
          variant="outline"
          disabled={!settlements.length}
          onPress={sharePlan}
        >
          Share plan
        </Button>
      </View>

      {expenses.length ? (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>
              {money(stats.totalExpenses)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Per person</Text>
            <Text style={styles.summaryValue}>{money(stats.perPerson)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Transactions</Text>
            <Text style={styles.summaryValue}>{stats.expenseCount}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Settlements</Text>
            <Text style={styles.summaryValue}>{stats.settlementCount}</Text>
          </View>
        </View>
      ) : null}

      {!expenses.length ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Kono expense nei</Text>
          <Text style={styles.emptySubtitle}>
            Expense add korle settlement plan dekhabe.
          </Text>
        </View>
      ) : !settlements.length ? (
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>Sob settle hoyeche!</Text>
          <Text style={styles.successSubtitle}>
            Group er keu karo kache theke taka pabe na.
          </Text>
        </View>
      ) : (
        <View style={styles.settlementList}>
          {settlements.map((settlement, index) => (
            <View key={settlement.id} style={styles.settlementRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepText}>{index + 1}</Text>
              </View>
              <MemberAvatar member={settlement.from} size="sm" showName />
              <Text style={styles.settlementLabel}>pays</Text>
              <Text style={styles.settlementValue}>
                {money(settlement.amount)}
              </Text>
              <Text style={styles.settlementLabel}>to</Text>
              <MemberAvatar member={settlement.to} size="sm" showName />
            </View>
          ))}
        </View>
      )}

      {members.length && expenses.length ? (
        <View style={styles.balanceSection}>
          <Text style={styles.balanceTitle}>Individual balances</Text>
          <View style={styles.balanceList}>
            {memberSummaries.map((summary) => (
              <View key={summary.id} style={styles.balanceRow}>
                <MemberAvatar member={summary} showName />
                <View style={styles.balanceRight}>
                  <Text
                    style={[
                      styles.balanceValue,
                      summary.balance > 0
                        ? styles.balancePositive
                        : summary.balance < 0
                          ? styles.balanceNegative
                          : styles.balanceNeutral,
                    ]}
                  >
                    {summary.balance > 0
                      ? `+${money(summary.balance)}`
                      : summary.balance < 0
                        ? money(summary.balance)
                        : "Settled"}
                  </Text>
                  <Text style={styles.balanceMeta}>
                    Paid {money(summary.paid)} - Owes {money(summary.owed)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}
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
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#64748b",
  },
  summaryValue: {
    marginTop: 4,
    fontWeight: "800",
    color: "#0f172a",
  },
  emptyCard: {
    backgroundColor: "#f8fafc",
    padding: 20,
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
  successCard: {
    backgroundColor: "#ecfdf5",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  successTitle: {
    fontWeight: "800",
    color: "#047857",
  },
  successSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#047857",
    textAlign: "center",
  },
  settlementList: {
    gap: 10,
  },
  settlementRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10,
    borderRadius: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 12,
  },
  settlementLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  settlementValue: {
    fontWeight: "800",
    color: "#0f172a",
  },
  balanceSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
  },
  balanceTitle: {
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  balanceList: {
    gap: 8,
  },
  balanceRow: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  balanceRight: {
    alignItems: "flex-end",
  },
  balanceValue: {
    fontWeight: "800",
  },
  balancePositive: {
    color: "#047857",
  },
  balanceNegative: {
    color: "#b91c1c",
  },
  balanceNeutral: {
    color: "#64748b",
  },
  balanceMeta: {
    fontSize: 11,
    color: "#64748b",
  },
});

export default SettlementSummary;
