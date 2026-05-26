import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

function ChatHistory({ chatLog = [], isTyping = false }) {
  if (!chatLog.length && !isTyping) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>Kono conversation nei</Text>
        <Text style={styles.emptySubtitle}>
          Upore input box e likhle chat shuru hobe.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
      {chatLog.map((message) => {
        const isUser = message.role === "user";
        return (
          <View
            key={message.id}
            style={[styles.row, isUser && styles.rowRight]}
          >
            <View
              style={[
                styles.bubble,
                isUser ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text style={isUser ? styles.userText : styles.assistantText}>
                {message.text}
              </Text>
              {!isUser && message.insight ? (
                <Text style={styles.insight}>{message.insight}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
      {isTyping ? <Text style={styles.typing}>Typing...</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  list: {
    maxHeight: 420,
  },
  listContent: {
    gap: 10,
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  rowRight: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  userBubble: {
    backgroundColor: "#0f172a",
  },
  assistantBubble: {
    backgroundColor: "#f1f5f9",
  },
  userText: {
    color: "#ffffff",
  },
  assistantText: {
    color: "#0f172a",
  },
  insight: {
    marginTop: 6,
    fontSize: 11,
    color: "#64748b",
  },
  typing: {
    fontSize: 12,
    color: "#94a3b8",
  },
});

export default ChatHistory;
