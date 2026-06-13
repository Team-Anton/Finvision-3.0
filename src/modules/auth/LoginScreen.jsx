import React, { useState } from "react";
import { StyleSheet, Text, TextInput } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Button from "../../components/Button";
import {
  clearAuthError,
  login,
} from "../../store/authSlice";
import AuthScreenLayout from "./AuthScreenLayout";

function LoginScreen({ onShowSignUp }) {
  const dispatch = useDispatch();
  const { error, loading } = useSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  function update(setter, value) {
    setter(value);
    setFormError("");
    if (error) dispatch(clearAuthError());
  }

  function handleLogin() {
    if (!email.trim() || !password) {
      setFormError("Please enter your email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }
    dispatch(login({ email, password }));
  }

  return (
    <AuthScreenLayout
      title="Welcome back"
      subtitle="Sign in to continue managing your finances."
    >
      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={(value) => update(setEmail, value)}
        style={styles.input}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        value={password}
        onChangeText={(value) => update(setPassword, value)}
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        autoComplete="password"
        onSubmitEditing={handleLogin}
      />
      {formError || error ? (
        <Text style={styles.error}>{formError || error}</Text>
      ) : null}
      <Button disabled={loading} onPress={handleLogin}>
        {loading ? "Logging in..." : "Login"}
      </Button>
      <Button variant="outline" onPress={onShowSignUp}>
        Create account
      </Button>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#f8fafc",
  },
  error: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "700",
  },
});

export default LoginScreen;
