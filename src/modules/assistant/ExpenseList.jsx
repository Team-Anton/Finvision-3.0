import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { money } from "../../utils/helpers";
import Button from "../../components/Button";

const filters = [
  "All",
  "Food",
  "Transport",
  "Groceries",
  "Utilities",
  "Shopping",
  "Health",
  "Income",
];

function ExpenseList({ expenses = [], onDelete }) {
  const [filter, setFilter] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "All") return expenses;
    return expenses.filter((expense) => expense.category === filter);
  }, [expenses, filter]);

  const visible = showAll ? filtered : filtered.slice(0, 5);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
      >
        {filters.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setFilter(item)}
            style={[
              styles.filterChip,
              filter === item && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === item && styles.filterTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!filtered.length ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Kono khoroch nei</Text>
          <Text style={styles.emptySubtitle}>
            Assistant e expense add korle ekhane dekhabe.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {visible.map((expense) => (
            <View key={expense.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View>
                  <View style={styles.categoryRow}>
                    <Text style={styles.category}>{expense.category}</Text>
                    <View style={styles.subcategoryPill}>
                      <Text style={styles.subcategoryText}>
                        {expense.subcategory}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.note}>{expense.note}</Text>
                  <Text style={styles.meta}>
                    {expense.merchant || "No merchant"} - {expense.date}
                  </Text>
                </View>
                <View style={styles.amountBlock}>
                  <Text style={styles.amount}>{money(expense.amount)}</Text>
                  <Button
                    variant="danger"
                    onPress={() => onDelete?.(expense.id)}
                  >
                    Delete
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {filtered.length > 5 ? (
        <Button variant="outline" onPress={() => setShowAll((value) => !value)}>
          {showAll ? "Kom dekhao" : `Aro ${filtered.length - 5} ta dekhao`}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
    gap: 12,
  },
  filterRow: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#0f172a",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  filterTextActive: {
    color: "#ffffff",
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
  list: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  category: {
    fontWeight: "800",
    color: "#0f172a",
  },
  subcategoryPill: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subcategoryText: {
    fontSize: 11,
    color: "#64748b",
  },
  note: {
    marginTop: 4,
    fontSize: 12,
    color: "#475569",
  },
  meta: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  amountBlock: {
    alignItems: "flex-end",
    gap: 8,
  },
  amount: {
    fontWeight: "800",
    color: "#0f172a",
  },
});

export default ExpenseList;
