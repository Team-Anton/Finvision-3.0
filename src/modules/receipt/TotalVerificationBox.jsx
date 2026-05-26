import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View, ScrollView } from "react-native";
import Button from "../../components/Button";
import { money } from "../../utils/helpers";

export default function TotalVerificationBox({
  extractedTotal,
  itemsSum,
  items,
  onConfirm,
  onCancel,
}) {
  const [verified, setVerified] = useState(extractedTotal);
  const difference = Math.abs(itemsSum - verified);
  const hasDifference = difference > 0.01;

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.title}>Verify Receipt Total</Text>
        <Text style={styles.subtitle}>
          নিশ্চিত করুন মোট পরিমাণ সঠিক আছে কিনা
        </Text>

        {/* Items Summary */}
        {items && items.length > 0 && (
          <View style={styles.itemsPreview}>
            <Text style={styles.itemsPreviewTitle}>
              Items ({items.length})
            </Text>
            <ScrollView
              style={styles.itemsList}
              scrollEnabled={items.length > 3}
              nestedScrollEnabled
            >
              {items.slice(0, 5).map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.note || "Item"}
                  </Text>
                  <Text style={styles.itemAmount}>{money(item.amount)}</Text>
                </View>
              ))}
              {items.length > 5 && (
                <Text style={styles.moreItems}>+{items.length - 5} more</Text>
              )}
            </ScrollView>
          </View>
        )}

        {/* OCR and Calculated Values */}
        <View style={styles.section}>
          <View style={styles.valueRow}>
            <Text style={styles.label}>OCR Extracted Total:</Text>
            <Text style={styles.extractedValue}>{money(extractedTotal)}</Text>
          </View>

          <View style={styles.valueRow}>
            <Text style={styles.label}>Items Sum:</Text>
            <Text style={styles.itemsValue}>{money(itemsSum)}</Text>
          </View>
        </View>

        {/* Difference Warning */}
        {hasDifference && (
          <View style={[styles.section, styles.differenceWarning]}>
            <Text style={styles.warningLabel}>⚠ Difference Detected:</Text>
            <Text style={styles.warningValue}>{money(difference)}</Text>
            <Text style={styles.warningHint}>
              OCR may have errors. Please verify the total manually and edit if
              needed.
            </Text>
          </View>
        )}

        {/* Confirmation Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Confirm Final Total:</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>৳</Text>
            <TextInput
              style={styles.input}
              value={String(verified)}
              onChangeText={(text) => {
                const num = parseFloat(text) || 0;
                setVerified(Math.max(0, num));
              }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#cbd5e1"
            />
          </View>
          <Text style={styles.inputHint}>
            Edit this amount if OCR detected incorrectly
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={onCancel}
            style={styles.buttonHalf}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onPress={() => onConfirm(verified)}
            style={styles.buttonHalf}
          >
            Confirm {money(verified)}
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  box: {
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 12,
  },
  itemsPreview: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  itemsPreviewTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  itemsList: {
    maxHeight: 120,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  itemName: {
    fontSize: 12,
    color: "#64748b",
    flex: 1,
    marginRight: 8,
  },
  itemAmount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  moreItems: {
    fontSize: 11,
    color: "#94a3b8",
    fontStyle: "italic",
    marginTop: 6,
  },
  section: {
    gap: 6,
  },
  valueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  label: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  extractedValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3b82f6",
  },
  itemsValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10b981",
  },
  differenceWarning: {
    padding: 10,
    backgroundColor: "#fef3c7",
    borderRadius: 6,
    borderLeftWidth: 0,
  },
  warningLabel: {
    fontSize: 13,
    color: "#92400e",
    fontWeight: "600",
  },
  warningValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#dc2626",
  },
  warningHint: {
    fontSize: 11,
    color: "#92400e",
    fontStyle: "italic",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    backgroundColor: "#fff",
    paddingLeft: 10,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10b981",
    marginRight: 4,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    padding: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  inputHint: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  buttonHalf: {
    flex: 1,
  },
});
