import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

const variants = {
  primary: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
    color: "#ffffff",
  },
  outline: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    color: "#0f172a",
  },
  danger: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
    color: "#b91c1c",
  },
  success: {
    backgroundColor: "#059669",
    borderColor: "#059669",
    color: "#ffffff",
  },
  warning: {
    backgroundColor: "#f59e0b",
    borderColor: "#f59e0b",
    color: "#0f172a",
  },
};

function Button({
  children,
  onPress,
  disabled = false,
  variant = "primary",
  style,
}) {
  const theme = variants[variant] || variants.primary;
  const content =
    typeof children === "string" || typeof children === "number" ? (
      <Text style={[styles.text, { color: theme.color }]}>{children}</Text>
    ) : (
      children
    );
  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: theme.backgroundColor,
          borderColor: theme.borderColor,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 13,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.55,
  },
});

export default Button;
