import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Modal, Animated } from "react-native";
import Button from "../../components/Button";
import { money } from "../../utils/helpers";

export default function CompletionDialog({
  visible,
  totalAmount,
  itemCount,
  categories,
  onContinue,
}) {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const categoryList = Object.entries(categories || {})
    .filter(([_, count]) => count > 0)
    .slice(0, 5);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.content}>
            {/* Success Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>✓</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>Expense Added!</Text>
            <Text style={styles.subtitle}>আপনার খরচ সফলভাবে যুক্ত হয়েছে</Text>

            {/* Amount Highlight */}
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amount}>{money(totalAmount)}</Text>
              <Text style={styles.itemCountLabel}>
                {itemCount} {itemCount === 1 ? "item" : "items"} added
              </Text>
            </View>

            {/* Category Breakdown */}
            {categoryList.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>Category Breakdown</Text>
                <View style={styles.categoryList}>
                  {categoryList.map(([category, count]) => (
                    <View key={category} style={styles.categoryItem}>
                      <Text style={styles.categoryName}>{category}</Text>
                      <Text style={styles.categoryCount}>×{count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action Button */}
            <Button
              variant="success"
              onPress={onContinue}
              style={styles.button}
            >
              Continue to AI Assistant
            </Button>

            <Text style={styles.footer}>
              আপনার বাজেট দেখতে AI সহায়ক ট্যাবে যান
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
    color: "#ffffff",
    fontWeight: "900",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
    textAlign: "center",
  },
  amountBox: {
    width: "100%",
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 4,
  },
  amount: {
    fontSize: 28,
    fontWeight: "900",
    color: "#10b981",
    marginBottom: 6,
  },
  itemCountLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  categorySection: {
    width: "100%",
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 10,
  },
  categoryList: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    overflow: "hidden",
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  categoryName: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  categoryCount: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "600",
  },
  button: {
    width: "100%",
    marginBottom: 12,
  },
  footer: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    fontStyle: "italic",
  },
});
