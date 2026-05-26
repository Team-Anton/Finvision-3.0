import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Button from "../../components/Button";
import { categories } from "../../utils/constants";
import { money } from "../../utils/helpers";

function itemName(item) {
  return (
    String(item.note || "")
      .split(" x ")[0]
      .trim() || ""
  );
}

function ReceiptItemEditor({
  items = [],
  onUpdate,
  onDelete,
  onAddManual,
  onClearAll,
}) {
  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  if (!items.length) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>Kono item extract hoyni</Text>
        <Text style={styles.emptySubtitle}>
          OCR diye extract koro ba manually item add koro.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Extracted Items</Text>
          <Text style={styles.subtitle}>{items.length} ta item ready</Text>
        </View>
        <View style={styles.actionRow}>
          <Button variant="outline" onPress={onAddManual}>
            Add item
          </Button>
          <Button variant="danger" onPress={onClearAll}>
            Clear all
          </Button>
        </View>
      </View>

      <View style={styles.list}>
        {items.map((item) => {
          const option =
            categories.find((cat) => cat.category === item.category) ||
            categories[0];
          return (
            <View key={item.id} style={styles.itemCard}>
              <TextInput
                value={itemName(item)}
                onChangeText={(value) => onUpdate(item.id, "name", value)}
                style={styles.input}
                placeholder="Item name"
              />
              <TextInput
                value={item.merchant || ""}
                onChangeText={(value) => onUpdate(item.id, "merchant", value)}
                style={styles.input}
                placeholder="Merchant (optional)"
              />
              <View style={styles.row}>
                <TextInput
                  value={item.qty === "" ? "" : String(item.qty ?? "")}
                  onChangeText={(value) => onUpdate(item.id, "qty", value)}
                  style={[styles.input, styles.smallInput]}
                  keyboardType="numeric"
                  placeholder="Qty"
                />
                <TextInput
                  value={item.amount === "" ? "" : String(item.amount ?? "")}
                  onChangeText={(value) => onUpdate(item.id, "amount", value)}
                  style={[styles.input, styles.smallInput]}
                  keyboardType="numeric"
                  placeholder="Amount"
                />
              </View>

              <Text style={styles.label}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipRow}
              >
                {categories.map((cat) => (
                  <Button
                    key={cat.category}
                    variant={
                      cat.category === item.category ? "primary" : "outline"
                    }
                    onPress={() => onUpdate(item.id, "category", cat.category)}
                  >
                    {cat.category}
                  </Button>
                ))}
              </ScrollView>

              <Text style={styles.label}>Subcategory</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipRow}
              >
                {option.subcategories.map((sub) => (
                  <Button
                    key={sub}
                    variant={sub === item.subcategory ? "primary" : "outline"}
                    onPress={() => onUpdate(item.id, "subcategory", sub)}
                  >
                    {sub}
                  </Button>
                ))}
              </ScrollView>

              <View style={styles.footerRow}>
                <Text style={styles.amount}>{money(item.amount)}</Text>
                <Button variant="danger" onPress={() => onDelete(item.id)}>
                  Remove
                </Button>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{money(total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
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
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  list: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
  smallInput: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  chipRow: {
    flexGrow: 0,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  amount: {
    fontWeight: "800",
    color: "#0f172a",
  },
  totalCard: {
    backgroundColor: "#0f172a",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: "#ffffff",
    fontWeight: "700",
  },
  totalValue: {
    color: "#ffffff",
    fontWeight: "800",
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

export default ReceiptItemEditor;
