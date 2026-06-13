import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { createMember } from "./SplitEngine";

export function MemberAvatar({ member, size = "md", showName = false }) {
  const sizes = {
    sm: 28,
    md: 36,
    lg: 48,
  };
  const initials = String(member?.name || "?")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.avatarRow}>
      <View
        style={[
          styles.avatar,
          {
            width: sizes[size] || sizes.md,
            height: sizes[size] || sizes.md,
            backgroundColor: member?.color?.hex || "#0f172a",
          },
        ]}
      >
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      {showName ? <Text style={styles.avatarName}>{member?.name}</Text> : null}
    </View>
  );
}

function MemberList({
  members = [],
  expenses = [],
  message = "",
  onAdd,
  onDelete,
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name likhte hobe.");
      return;
    }
    const duplicate = members.some(
      (member) => member.name.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      setError("Ei name already added ache.");
      return;
    }
    onAdd(createMember(trimmed, members.length));
    setName("");
    setError("");
  }

  function expenseCount(memberId) {
    return expenses.filter(
      (expense) =>
        expense.paidById === memberId ||
        (expense.memberIds || []).includes(memberId) ||
        (expense.contributors || []).some(
          (contributor) => contributor.memberId === memberId,
        ),
    ).length;
  }

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Group Members</Text>
        <Text style={styles.subtitle}>{members.length} members added</Text>
      </View>

      <View style={styles.addRow}>
        <TextInput
          value={name}
          onChangeText={(value) => {
            setName(value);
            setError("");
          }}
          placeholder="Member er naam likho..."
          style={styles.input}
        />
        <Button onPress={handleAdd}>Add</Button>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.error}>{message}</Text> : null}

      <View style={styles.list}>
        {!members.length ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Kono member nei</Text>
            <Text style={styles.emptySubtitle}>
              Upore naam likhe member add koro.
            </Text>
          </View>
        ) : (
          members.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <MemberAvatar member={member} />
                <View>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberMeta}>
                    {expenseCount(member.id)} ta expense e involved
                  </Text>
                </View>
              </View>
              <Button variant="danger" onPress={() => onDelete(member.id)}>
                Delete
              </Button>
            </View>
          ))
        )}
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
  addRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
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
  list: {
    marginTop: 12,
    gap: 10,
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
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 12,
  },
  memberInfo: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  memberName: {
    fontWeight: "700",
    color: "#0f172a",
  },
  memberMeta: {
    fontSize: 11,
    color: "#64748b",
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  avatar: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 12,
  },
  avatarName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
});

export default MemberList;
