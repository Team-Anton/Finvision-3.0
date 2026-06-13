import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { money } from "../../utils/helpers";
import { MemberAvatar } from "./MemberList";
import { calcShares, createSplitExpense, validateSplit } from "./SplitEngine";

function ExpenseSplitter({
  members = [],
  expenses = [],
  onAdd,
  onDelete,
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [contributors, setContributors] = useState({});
  const [memberIds, setMemberIds] = useState([]);
  const [splitType, setSplitType] = useState("equal");
  const [customAmounts, setCustomAmounts] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    setMemberIds((current) => {
      const memberIdSet = new Set(members.map((member) => member.id));
      const kept = current.filter((id) => memberIdSet.has(id));
      const missing = members
        .map((member) => member.id)
        .filter((id) => !kept.includes(id));
      return kept.length
        ? [...kept, ...missing]
        : members.map((member) => member.id);
    });
    setContributors((current) => {
      const validIds = new Set(members.map((member) => member.id));
      return Object.fromEntries(
        Object.entries(current).filter(([id]) => validIds.has(id)),
      );
    });
  }, [members]);

  const selectedIds = memberIds;
  const contributorList = members;
  const contributorIds = Object.keys(contributors).filter(
    (id) => Number(contributors[id] || 0) > 0,
  );
  const previewExpense = useMemo(
    () => ({
      amount: Number(amount) || 0,
      memberIds: selectedIds,
      splitType,
      customAmounts,
    }),
    [amount, selectedIds, splitType, customAmounts],
  );
  const shares = calcShares(previewExpense);

  function toggleMember(id) {
    setMemberIds(
      selectedIds.includes(id)
        ? selectedIds.filter((item) => item !== id)
        : [...selectedIds, id],
    );
  }

  function handleAdd() {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }
    const expense = createSplitExpense({
      title,
      amount: numericAmount,
      contributors: contributorIds.map((id) => ({
        memberId: id,
        amount: Number(contributors[id] || 0),
      })),
      memberIds: selectedIds,
      splitType,
      customAmounts,
    });
    const validation = validateSplit(expense);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    onAdd(expense);
    setTitle("");
    setAmount("");
    setContributors({});
    setCustomAmounts({});
    setMemberIds(members.map((member) => member.id));
    setError("");
  }

  if (!members.length) {
    return (
      <Card>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Aghe member add koro</Text>
          <Text style={styles.emptySubtitle}>
            Member add korle expense split kora jabe.
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Add Group Expense</Text>
        <Text style={styles.subtitle}>Expense add kore split koro.</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            setError("");
          }}
          placeholder="Lunch, Rickshaw, Hotel"
          style={styles.input}
        />
        <TextInput
          value={amount}
          onChangeText={(value) => {
            setAmount(value);
            setError("");
          }}
          placeholder="Amount"
          style={styles.input}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Contributors (multiple)</Text>
        <View style={styles.contributorList}>
          {contributorList.map((member) => (
            <View key={member.id} style={styles.contributorRow}>
              <View style={styles.contributorInfo}>
                <MemberAvatar member={member} size="sm" />
                <Text style={styles.contributorName}>{member.name}</Text>
              </View>
              <TextInput
                value={
                  contributors[member.id] === undefined
                    ? ""
                    : String(contributors[member.id])
                }
                onChangeText={(value) => {
                  setContributors((current) => ({
                    ...current,
                    [member.id]: value,
                  }));
                  setError("");
                }}
                style={styles.contributorInput}
                keyboardType="numeric"
                placeholder="BDT"
              />
            </View>
          ))}
          <Button
            variant="outline"
            onPress={() => {
              const count = members.length || 1;
              const perPerson = Number(amount || 0) / count;
              const next = {};
              members.forEach((member) => {
                next[member.id] = perPerson ? Number(perPerson.toFixed(2)) : "";
              });
              setContributors(next);
              setError("");
            }}
          >
            Split contribution equally
          </Button>
        </View>

        <Text style={styles.label}>Split type</Text>
        <View style={styles.toggleRow}>
          {["equal", "custom", "percentage"].map((type) => (
            <Button
              key={type}
              variant={splitType === type ? "primary" : "outline"}
              onPress={() => {
                setSplitType(type);
                setCustomAmounts({});
                setError("");
              }}
            >
              {type}
            </Button>
          ))}
        </View>

        <Text style={styles.label}>Ke ke involved?</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
        >
          {members.map((member) => (
            <Button
              key={member.id}
              variant={selectedIds.includes(member.id) ? "primary" : "outline"}
              onPress={() => toggleMember(member.id)}
            >
              <View style={styles.memberChip}>
                <MemberAvatar member={member} size="sm" />
                <Text
                  style={[
                    styles.memberChipText,
                    selectedIds.includes(member.id) &&
                      styles.memberChipTextActive,
                  ]}
                >
                  {member.name}
                </Text>
              </View>
            </Button>
          ))}
        </ScrollView>

        {splitType !== "equal" ? (
          <View style={styles.customGrid}>
            {members
              .filter((member) => selectedIds.includes(member.id))
              .map((member) => (
                <View key={member.id} style={styles.customRow}>
                  <Text style={styles.customLabel}>{member.name}</Text>
                  <TextInput
                    value={String(customAmounts[member.id] || "")}
                    onChangeText={(value) => {
                      setCustomAmounts({
                        ...customAmounts,
                        [member.id]: value,
                      });
                      setError("");
                    }}
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder={splitType === "percentage" ? "%" : "BDT"}
                  />
                </View>
              ))}
          </View>
        ) : null}

        {selectedIds.length && Number(amount) > 0 ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Share preview</Text>
            {members
              .filter((member) => selectedIds.includes(member.id))
              .map((member) => (
                <View key={member.id} style={styles.previewRow}>
                  <Text>{member.name}</Text>
                  <Text style={styles.previewValue}>
                    {money(shares[member.id] || 0)}
                  </Text>
                </View>
              ))}
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          onPress={handleAdd}
          disabled={!title.trim() || !amount || !selectedIds.length}
        >
          Add expense
        </Button>
      </View>

      {expenses.length ? (
        <View style={styles.expenseList}>
          <Text style={styles.expenseCount}>
            {expenses.length} ta expense added
          </Text>
          {expenses.map((expense) => (
            <View key={expense.id} style={styles.expenseRow}>
              <View>
                <Text style={styles.expenseTitle}>{expense.title}</Text>
                <Text style={styles.expenseMeta}>
                  {expense.memberIds?.length || 0} jon split - {expense.date}
                </Text>
              </View>
              <View style={styles.expenseAmount}>
                <Text style={styles.expenseValue}>{money(expense.amount)}</Text>
                <Button variant="danger" onPress={() => onDelete(expense.id)}>
                  Delete
                </Button>
              </View>
            </View>
          ))}
        </View>
      ) : null}
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
  form: {
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  chipRow: {
    flexGrow: 0,
  },
  contributorList: {
    gap: 8,
  },
  contributorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 10,
  },
  contributorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contributorName: {
    fontWeight: "700",
    color: "#0f172a",
  },
  contributorInput: {
    minWidth: 90,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
    textAlign: "right",
  },
  toggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberChipText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  memberChipTextActive: {
    color: "#ffffff",
  },
  customGrid: {
    gap: 10,
  },
  customRow: {
    gap: 6,
  },
  customLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  previewCard: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  previewValue: {
    fontWeight: "700",
  },
  error: {
    fontSize: 12,
    fontWeight: "700",
    color: "#dc2626",
  },
  expenseList: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
    gap: 10,
  },
  expenseCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  expenseRow: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  expenseTitle: {
    fontWeight: "700",
    color: "#0f172a",
  },
  expenseMeta: {
    fontSize: 11,
    color: "#64748b",
  },
  expenseAmount: {
    alignItems: "flex-end",
    gap: 6,
  },
  expenseValue: {
    fontWeight: "800",
    color: "#0f172a",
  },
  emptyCard: {
    padding: 20,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
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

export default ExpenseSplitter;
