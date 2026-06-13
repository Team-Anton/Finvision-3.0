import React, { useState } from "react";
import { StyleSheet, Text, TextInput } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Button from "../../components/Button";
import {
  clearAuthError,
  register,
} from "../../store/authSlice";
import AuthScreenLayout from "./AuthScreenLayout";

function SignUpScreen({ onShowLogin }) {
  const dispatch = useDispatch();
  const { error, loading } = useSelector((state) => state.auth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");

  function update(setter, value) {
    setter(value);
    setFormError("");
    if (error) dispatch(clearAuthError());
  }

  function handleSignUp() {
    if (!name.trim()) {
      setFormError("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setFormError("Please enter a password.");
      return;
    }
    if (confirmPassword !== password) {
      setFormError("Passwords do not match.");
      return;
    }
    dispatch(register({ fullName: name, email, password }));
  }

  return (
    <AuthScreenLayout
      title="Create your account"
      subtitle="Set up your profile to start managing your finances."
    >
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        value={name}
        onChangeText={(value) => update(setName, value)}
        style={styles.input}
        placeholder="Full name"
      />
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
        autoComplete="new-password"
      />
      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        value={confirmPassword}
        onChangeText={(value) => update(setConfirmPassword, value)}
        style={styles.input}
        placeholder="Confirm password"
        secureTextEntry
        onSubmitEditing={handleSignUp}
      />
      {formError || error ? (
        <Text style={styles.error}>{formError || error}</Text>
      ) : null}
      <Button disabled={loading} onPress={handleSignUp}>
        {loading ? "Creating account..." : "Sign Up"}
      </Button>
      <Button variant="outline" onPress={onShowLogin}>
        Back to login
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

export default SignUpScreen;
