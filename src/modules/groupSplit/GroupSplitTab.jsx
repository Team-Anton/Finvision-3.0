import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { money } from "../../utils/helpers";
import ExpenseSplitter from "./ExpenseSplitter";
import MemberList from "./MemberList";
import SettlementSummary from "./SettlementSummary";
import WalletPanel from "./WalletPanel";
import {
  createSplitExpense,
  getGroupStats,
  WALLET_MEMBER,
} from "./SplitEngine";

function GroupSplitTab() {
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [section, setSection] = useState("split");
  const walletMember = WALLET_MEMBER;
  const membersWithWallet = useMemo(
    () => [...members, walletMember],
    [members, walletMember],
  );
  const stats = useMemo(
    () => getGroupStats(members, expenses),
    [members, expenses],
  );

  function deleteMember(id) {
    setMembers((current) => current.filter((member) => member.id !== id));
    setExpenses((current) =>
      current.filter(
        (expense) =>
          expense.paidById !== id &&
          !(expense.memberIds || []).includes(id) &&
          !(expense.contributors || []).some(
            (contributor) => contributor.memberId === id,
          ),
      ),
    );
  }

  function addWalletDeposit(memberId, amount) {
    const expense = createSplitExpense({
      title: "Wallet deposit",
      amount: Number(amount),
      contributors: [{ memberId, amount: Number(amount) }],
      memberIds: [walletMember.id],
      splitType: "equal",
      customAmounts: {},
    });
    setExpenses((current) => [...current, expense]);
  }

  return (
    <View style={styles.wrapper}>
      {!members.length ? (
        <Card>
          <View style={styles.center}>
            <Text style={styles.heroTitle}>Group Split</Text>
            <Text style={styles.heroSubtitle}>
              Member add kore group khoroch split koro.
            </Text>
          </View>
        </Card>
      ) : (
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Group total</Text>
              <Text style={styles.summaryValue}>
                {money(stats.totalExpenses)}
              </Text>
              <Text style={styles.summaryHint}>
                {money(stats.perPerson)} per person - {stats.memberCount}{" "}
                members
              </Text>
            </View>
            <View style={styles.summaryActions}>
              <Button
                variant={section === "split" ? "warning" : "outline"}
                onPress={() => setSection("split")}
              >
                Add Expense
              </Button>
              <Button
                variant={section === "settle" ? "warning" : "outline"}
                onPress={() => setSection("settle")}
              >
                Settle Up ({expenses.length})
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  setMembers([]);
                  setExpenses([]);
                  setSection("split");
                }}
              >
                Reset
              </Button>
            </View>
          </View>
        </Card>
      )}

      <View style={styles.grid}>
        <MemberList
          members={members}
          expenses={expenses}
          onAdd={(member) => setMembers((current) => [...current, member])}
          onDelete={deleteMember}
        />
        {section === "split" ? (
          <View style={styles.splitColumn}>
            <WalletPanel
              members={members}
              walletMember={walletMember}
              expenses={expenses}
              onDeposit={addWalletDeposit}
            />
            <ExpenseSplitter
              members={members}
              walletMember={walletMember}
              expenses={expenses}
              onAdd={(expense) => {
                setExpenses((current) => [...current, expense]);
                setSection("settle");
              }}
              onDelete={(id) =>
                setExpenses((current) =>
                  current.filter((expense) => expense.id !== id),
                )
              }
            />
          </View>
        ) : (
          <SettlementSummary members={membersWithWallet} expenses={expenses} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
  },
  center: {
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryLabel: {
    color: "#cbd5f5",
    fontSize: 12,
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  summaryHint: {
    color: "#cbd5f5",
    fontSize: 11,
    marginTop: 2,
  },
  summaryActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  grid: {
    gap: 16,
  },
  splitColumn: {
    gap: 16,
  },
});

export default GroupSplitTab;
