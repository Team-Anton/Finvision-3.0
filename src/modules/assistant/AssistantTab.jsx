import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  addExpense,
  clearExpenses,
  deleteExpense,
  increaseBudget,
  setBudget,
} from "../../store/budgetSlice";
import { setAssistantReply } from "../../store/uiSlice";
import { samplePrompts } from "../../utils/constants";
import { calcRemaining, calcTotalSpent, money } from "../../utils/helpers";
import Button from "../../components/Button";
import Card from "../../components/Card";
import parsePrompt from "./assistantEngine";
import ChatHistory from "./ChatHistory";
import ExpenseList from "./ExpenseList";

function welcomeMessage() {
  return {
    id: `welcome-${Date.now()}`,
    role: "assistant",
    text: "Assalamu Alaikum! Ami FinVision AI. 'bus bara 80 taka' ba 'amar koto baki ache?' likhle ami bujhte parbo.",
    insight: "Help er jonno 'help' likho.",
  };
}

function AssistantTab() {
  const dispatch = useDispatch();
  const monthlyBudget = useSelector((state) => state.budget.monthlyBudget);
  const expenses = useSelector((state) => state.budget.expenses);
  const assistant = useSelector((state) => state.ui.assistant);
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([welcomeMessage()]);

  const totals = useMemo(() => {
    const totalSpent = calcTotalSpent(expenses);
    return {
      totalSpent,
      remaining: calcRemaining(monthlyBudget, totalSpent),
    };
  }, [expenses, monthlyBudget]);

  function handleSubmit(customMessage) {
    const trimmed = String(customMessage ?? message).trim();
    if (!trimmed) return;

    const result = parsePrompt(trimmed, {
      monthlyBudget,
      totalSpent: totals.totalSpent,
      remaining: totals.remaining,
      expenses,
    });

    if (result.action === "set_budget") dispatch(setBudget(result.amount));
    if (result.action === "add_expense")
      dispatch(addExpense(result.transaction));
    if (result.action === "add_income") dispatch(increaseBudget(result.amount));
    if (result.action === "clear_all") dispatch(clearExpenses());

    const userMsg = {
      id: `user-${Date.now()}-${Math.random()}`,
      role: "user",
      text: trimmed,
    };
    const assistantMsg = {
      id: `assistant-${Date.now()}-${Math.random()}`,
      role: "assistant",
      text: result.reply,
      insight: result.insight,
    };

    setChatLog((current) => [...current, userMsg, assistantMsg]);
    dispatch(
      setAssistantReply({ reply: result.reply, insight: result.insight }),
    );
    setMessage("");
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.heroWrapper}>
        <img
          src="/cover-finvision.png"
          alt="FinVision AI - Smart Finance for Students"
          style={styles.heroImage}
        />
      </View>
      <Card>
        <Text style={styles.sectionTitle}>Ask FinVision</Text>
        <Text style={styles.muted}>
          Bangla, Banglish, and English finance prompts bujhte pare.
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="bus bara 80 taka"
            style={styles.input}
            onSubmitEditing={() => handleSubmit()}
          />
          <Button disabled={!message.trim()} onPress={() => handleSubmit()}>
            Send
          </Button>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
        >
          {samplePrompts.map((prompt) => (
            <TouchableOpacity
              key={prompt}
              style={styles.chip}
              onPress={() => handleSubmit(prompt)}
            >
              <Text style={styles.chipText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>

      <Card style={styles.darkCard}>
        <Text style={styles.darkMuted}>Last reply snapshot</Text>
        <Text style={styles.darkTitle}>{assistant.reply}</Text>
        {assistant.insight ? (
          <Text style={styles.darkBody}>{assistant.insight}</Text>
        ) : null}
        <View style={styles.snapshotRow}>
          <View style={styles.snapshotCell}>
            <Text style={styles.snapshotLabel}>Spent</Text>
            <Text style={styles.snapshotValue}>{money(totals.totalSpent)}</Text>
          </View>
          <View style={styles.snapshotCell}>
            <Text style={styles.snapshotLabel}>Left</Text>
            <Text style={styles.snapshotValue}>{money(totals.remaining)}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Conversation</Text>
          <Button
            variant="outline"
            onPress={() => setChatLog([welcomeMessage()])}
          >
            Clear chat
          </Button>
        </View>
        <ChatHistory chatLog={chatLog} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        <Text style={styles.muted}>Delete an entry if needed.</Text>
        <ExpenseList
          expenses={expenses}
          onDelete={(id) => dispatch(deleteExpense(id))}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
    paddingBottom: 24,
  },
  heroWrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  heroImage: {
    width: "100%",
    height: "auto",
    display: "block",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  muted: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
  },
  chipScroll: {
    marginTop: 12,
  },
  chip: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  darkCard: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  darkMuted: {
    color: "#94a3b8",
    fontSize: 12,
  },
  darkTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 6,
  },
  darkBody: {
    color: "#cbd5f5",
    fontSize: 13,
    marginTop: 6,
  },
  snapshotRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  snapshotCell: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 10,
    borderRadius: 12,
  },
  snapshotLabel: {
    color: "#cbd5f5",
    fontSize: 11,
  },
  snapshotValue: {
    color: "#ffffff",
    fontWeight: "800",
    marginTop: 2,
  },
});

export default AssistantTab;
