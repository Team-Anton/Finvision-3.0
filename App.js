import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Provider, useDispatch, useSelector } from "react-redux";
import store from "./src/store/index";
import {
  clearAuthError,
  loadAuth,
  logout,
  updateProfile,
} from "./src/store/authSlice";
import { loadFromStorage, saveToStorage } from "./src/store/budgetSlice";
import { setActiveTab } from "./src/store/uiSlice";
import { navTabs } from "./src/utils/constants";
import {
  calcHealthScore,
  calcRemaining,
  calcTotalSpent,
  money,
} from "./src/utils/helpers";
import Button from "./src/components/Button";
import AssistantTab from "./src/modules/assistant/AssistantTab";
import DashboardTab from "./src/modules/dashboard/DashboardTab";
import ReceiptTab from "./src/modules/receipt/ReceiptTab";
import GroupSplitTab from "./src/modules/groupSplit/GroupSplitTab";
import LoginScreen from "./src/modules/auth/LoginScreen";
import SignUpScreen from "./src/modules/auth/SignUpScreen";

function RootApp() {
  const dispatch = useDispatch();
  const [authScreen, setAuthScreen] = useState("login");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    error: "",
  });
  const auth = useSelector((state) => state.auth);
  const activeTab = useSelector((state) => state.ui.activeTab);
  const { monthlyBudget, expenses, hydrated } = useSelector(
    (state) => state.budget,
  );

  useEffect(() => {
    dispatch(loadAuth());
    dispatch(loadFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (auth.hydrated && !auth.loggedIn) {
      setAuthScreen("login");
      setShowAccountMenu(false);
      setShowProfileModal(false);
    }
  }, [auth.hydrated, auth.loggedIn]);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage({ budget: { monthlyBudget, expenses } });
  }, [hydrated, monthlyBudget, expenses]);

  const totalSpent = calcTotalSpent(expenses);
  const remaining = calcRemaining(monthlyBudget, totalSpent);
  const health = calcHealthScore(remaining, monthlyBudget);
  const displayName = auth.user?.fullName || auth.user?.name || "FinVision User";
  const initials = String(displayName || "FV")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (!auth.hydrated) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={styles.loadingText}>
          Loading your local FinVision data...
        </Text>
      </SafeAreaView>
    );
  }

  if (!auth.loggedIn) {
    return authScreen === "signup" ? (
      <SignUpScreen onShowLogin={() => setAuthScreen("login")} />
    ) : (
      <LoginScreen onShowSignUp={() => setAuthScreen("signup")} />
    );
  }

  function renderTab() {
    switch (activeTab) {
      case "assistant":
        return <AssistantTab />;
      case "dashboard":
        return <DashboardTab />;
      case "receipt":
        return <ReceiptTab />;
      case "group":
        return <GroupSplitTab />;
      default:
        return <AssistantTab />;
    }
  }

  async function handleLogout() {
    setShowAccountMenu(false);
    await dispatch(logout());
  }

  function openProfileEditor() {
    setProfileForm({
      fullName: displayName,
      email: auth.user?.email || "",
      error: "",
    });
    if (auth.error) dispatch(clearAuthError());
    setShowAccountMenu(false);
    setShowProfileModal(true);
  }

  function patchProfileForm(patch) {
    setProfileForm((current) => ({
      ...current,
      ...patch,
      error: Object.prototype.hasOwnProperty.call(patch, "error")
        ? patch.error
        : "",
    }));
    if (auth.error) dispatch(clearAuthError());
  }

  async function handleProfileSave() {
    const fullName = profileForm.fullName.trim();
    const email = profileForm.email.trim();
    if (!fullName) {
      patchProfileForm({ error: "Please enter your full name." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      patchProfileForm({ error: "Please enter a valid email address." });
      return;
    }
    const result = await dispatch(updateProfile({ fullName, email }));
    if (updateProfile.fulfilled.match(result)) {
      setShowProfileModal(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.containerScroll}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerText}>
              <Text style={styles.headerEyebrow}>
                Bangla/Banglish finance assistant
              </Text>
              <Text style={styles.headerTitle}>FinVision AI</Text>
              <Text style={styles.headerUser}>
                Welcome, {displayName}
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Open account menu"
              onPress={() => setShowAccountMenu(true)}
              style={styles.profileButton}
            >
              <Text style={styles.profileButtonText}>{initials}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Budget</Text>
              <Text style={styles.summaryValue}>{money(monthlyBudget)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text style={styles.summaryValueGreen}>{money(remaining)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Health</Text>
              <Text style={styles.summaryValue}>{health}/100</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabRow}>
          {navTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "primary" : "outline"}
              onPress={() => dispatch(setActiveTab(tab.key))}
            >
              {tab.label}
            </Button>
          ))}
        </View>

        <View style={styles.body}>{renderTab()}</View>
      </ScrollView>
      <Modal
        transparent
        animationType="fade"
        visible={showAccountMenu}
        onRequestClose={() => setShowAccountMenu(false)}
      >
        <View style={styles.menuOverlay}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close account menu"
            activeOpacity={1}
            onPress={() => setShowAccountMenu(false)}
            style={styles.menuBackdrop}
          />
          <View style={styles.accountMenu}>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{displayName}</Text>
              <Text style={styles.accountEmail}>{auth.user?.email}</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={openProfileEditor}
              style={styles.editProfileButton}
            >
              <Text style={styles.editProfileText}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowAccountMenu(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        transparent
        animationType="fade"
        visible={showProfileModal}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.menuOverlay}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close profile editor"
            activeOpacity={1}
            onPress={() => setShowProfileModal(false)}
            style={styles.menuBackdrop}
          />
          <View style={styles.profileModal}>
            <Text style={styles.profileModalTitle}>Edit profile</Text>
            <Text style={styles.profileLabel}>Full Name</Text>
            <TextInput
              value={profileForm.fullName}
              onChangeText={(value) => patchProfileForm({ fullName: value })}
              placeholder="Full name"
              style={styles.profileInput}
            />
            <Text style={styles.profileLabel}>Email</Text>
            <TextInput
              value={profileForm.email}
              onChangeText={(value) => patchProfileForm({ email: value })}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.profileInput}
            />
            {profileForm.error || auth.error ? (
              <Text style={styles.profileError}>
                {profileForm.error || auth.error}
              </Text>
            ) : null}
            <View style={styles.profileActions}>
              <Button
                variant="outline"
                onPress={() => setShowProfileModal(false)}
              >
                Cancel
              </Button>
              <Button disabled={auth.profileSaving} onPress={handleProfileSave}>
                {auth.profileSaving ? "Saving..." : "Save"}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <RootApp />
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20,
  },
  loadingText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  containerScroll: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: "#0f172a",
    padding: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  headerEyebrow: {
    color: "#34d399",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 6,
  },
  headerUser: {
    color: "#cbd5f5",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#dc2626",
    borderWidth: 2,
    borderColor: "#fecaca",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  profileButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  summaryRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 14,
  },
  summaryLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
  },
  summaryValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  summaryValueGreen: {
    color: "#34d399",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    alignItems: "flex-end",
    paddingTop: 84,
    paddingHorizontal: 16,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  accountMenu: {
    width: 220,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    alignItems: "center",
    gap: 10,
  },
  accountInfo: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 10,
    gap: 3,
  },
  accountName: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
  },
  accountEmail: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
  },
  editProfileButton: {
    width: "100%",
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    alignItems: "center",
    justifyContent: "center",
  },
  editProfileText: {
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: "900",
  },
  logoutButton: {
    width: "100%",
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "900",
  },
  cancelButton: {
    width: "100%",
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "800",
  },
  profileModal: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 18,
    gap: 10,
  },
  profileModalTitle: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "900",
  },
  profileLabel: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },
  profileInput: {
    borderWidth: 1,
    borderColor: "#dbe4ee",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
  },
  profileError: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "800",
  },
  profileActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
});
