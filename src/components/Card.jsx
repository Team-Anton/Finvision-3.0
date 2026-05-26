import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

function Card({ children, onPress, padding = true, style }) {
  if (onPress) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onPress}
        style={[styles.card, padding && styles.padding, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return (
    <View style={[styles.card, padding && styles.padding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  padding: {
    padding: 16,
  },
});

export default Card;
