import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { money } from "../../utils/helpers";
import { MemberAvatar } from "./MemberList";
import { getSharedFundSummary } from "./SplitEngine";

function WalletPanel({ members = [], expenses = [], onDeposit }) {
  const [amount, setAmount] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [error, setError] = useState("");

  const fundSummary = useMemo(
    () => getSharedFundSummary(members, expenses),
    [expenses, members],
  );
  const walletBalance = fundSummary.balance;
  const totalDeposits = fundSummary.deposits;
  const totalSpent = fundSummary.spend;

  function handleDeposit() {
    const numericAmount = Number(amount);
    if (!selectedMember) {
      setError("Depositor select koro.");
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      setError("Deposit amount dite hobe.");
      return;
    }
    onDeposit(selectedMember, numericAmount);
    setAmount("");
    setError("");
  }

  return (
    <Card>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Shared Fund</Text>
          <Text style={styles.subtitle}>
            Use Shared Fund when your group collects money first.
          </Text>
        </View>
        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>Fund balance</Text>
          <Text
            style={[
              styles.balanceValue,
              walletBalance >= 0
                ? styles.balancePositive
                : styles.balanceNegative,
            ]}
          >
            {money(walletBalance)}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Deposits</Text>
          <Text style={styles.statValue}>{money(totalDeposits)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Fund spend</Text>
          <Text style={styles.statValue}>{money(totalSpent)}</Text>
        </View>
      </View>

      <Text style={styles.label}>Deposit from</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
      >
        {members.map((member) => (
          <Button
            key={member.id}
            variant={selectedMember === member.id ? "primary" : "outline"}
            onPress={() => {
              setSelectedMember(member.id);
              setError("");
            }}
          >
            <View style={styles.memberChip}>
              <MemberAvatar member={member} size="sm" />
              <Text style={styles.memberChipText}>{member.name}</Text>
            </View>
          </Button>
        ))}
      </ScrollView>

      <View style={styles.depositRow}>
        <TextInput
          value={amount}
          onChangeText={(value) => {
            setAmount(value);
            setError("");
          }}
          placeholder="Deposit amount"
          keyboardType="numeric"
          style={styles.input}
        />
        <Button onPress={handleDeposit} disabled={!members.length}>
          Add deposit
        </Button>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  balanceBox: {
    backgroundColor: "#0f172a",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  balanceLabel: {
    fontSize: 10,
    color: "#cbd5f5",
    textTransform: "uppercase",
  },
  balanceValue: {
    marginTop: 4,
    fontWeight: "800",
    color: "#ffffff",
  },
  balancePositive: {
    color: "#86efac",
  },
  balanceNegative: {
    color: "#fca5a5",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
  },
  statValue: {
    marginTop: 4,
    fontWeight: "800",
    color: "#0f172a",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  chipRow: {
    flexGrow: 0,
    marginBottom: 10,
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  depositRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  error: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#dc2626",
  },
});

export default WalletPanel;
