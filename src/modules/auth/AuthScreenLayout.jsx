import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Card from "../../components/Card";

function AuthScreenLayout({ title, subtitle, children }) {
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <Image
            source={require("../../assets/cover-finvision.png")}
            style={styles.cover}
            resizeMode="cover"
          />
          <Text style={styles.eyebrow}>Smart finance for students</Text>
          <Text style={styles.brandTitle}>FinVision AI</Text>
        </View>
        <Card style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.form}>{children}</View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    gap: 16,
  },
  brand: {
    alignItems: "center",
  },
  cover: {
    width: "100%",
    maxWidth: 520,
    height: 130,
    borderRadius: 18,
    marginBottom: 14,
  },
  eyebrow: {
    color: "#059669",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  brandTitle: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
  },
  subtitle: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 6,
  },
  form: {
    gap: 12,
    marginTop: 18,
  },
});

export default AuthScreenLayout;
