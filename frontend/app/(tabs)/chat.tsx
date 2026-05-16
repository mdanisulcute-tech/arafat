import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useTheme, SPACING, RADIUS, hardShadow } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { api } from "@/src/api/client";
import { ChatMessage } from "@/src/types";

export default function ChatTab() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const load = useCallback(async () => {
    try {
      const msgs = await api.get<ChatMessage[]>("/chat/messages?limit=50");
      setMessages(msgs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      pollRef.current = setInterval(load, 4000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [load])
  );

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const msg = await api.post<ChatMessage>("/chat/messages", { text: trimmed });
      setMessages((m) => [...m, msg]);
      setText("");
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>GLOBAL CHAT</Text>
        <View style={[styles.online, { backgroundColor: colors.success, borderColor: colors.border }]}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>LIVE</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}
            renderItem={({ item }) => {
              const isMe = user && item.user_id === user.id;
              return (
                <View
                  style={[styles.bubbleRow, { justifyContent: isMe ? "flex-end" : "flex-start" }]}
                  testID={`chat-msg-${item.id.slice(0, 8)}`}
                >
                  {!isMe && (
                    <Image source={{ uri: item.avatar }} style={[styles.av, { borderColor: colors.border }]} />
                  )}
                  <View
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: isMe ? colors.primary : colors.surface,
                        borderColor: colors.border,
                        marginLeft: isMe ? 0 : 8,
                        marginRight: isMe ? 8 : 0,
                      },
                      hardShadow(colors.border, 3),
                    ]}
                  >
                    {!isMe && (
                      <Text style={[styles.who, { color: colors.textMuted }]}>@{item.username}</Text>
                    )}
                    <Text style={[styles.bubbleText, { color: isMe ? "#0A0A0A" : colors.text }]}>
                      {item.text}
                    </Text>
                  </View>
                  {isMe && (
                    <Image source={{ uri: item.avatar }} style={[styles.av, { borderColor: colors.border }]} />
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 60, fontWeight: "700" }}>
                Be the first to say hi 👋
              </Text>
            }
          />
        )}

        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderColor: colors.border }, hardShadow(colors.border, 4)]}>
          <TextInput
            testID="chat-input"
            value={text}
            onChangeText={setText}
            placeholder="Say something..."
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text }]}
            maxLength={300}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity
            testID="chat-send"
            onPress={send}
            disabled={sending || !text.trim()}
            style={[
              styles.sendBtn,
              {
                backgroundColor: colors.primary,
                borderColor: colors.border,
                opacity: sending || !text.trim() ? 0.5 : 1,
              },
            ]}
          >
            <Ionicons name="send" size={20} color="#0A0A0A" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  title: { fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  online: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 2,
    gap: 5,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: "#0A0A0A" },
  onlineText: { fontSize: 11, fontWeight: "900", color: "#0A0A0A", letterSpacing: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", marginVertical: 4 },
  av: { width: 32, height: 32, borderRadius: 999, borderWidth: 2 },
  bubble: {
    maxWidth: "75%",
    borderWidth: 2,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  who: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 2 },
  bubbleText: { fontSize: 15, fontWeight: "700" },
  inputBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 92,
    left: 16,
    right: 16,
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  input: { flex: 1, fontSize: 15, fontWeight: "600", paddingHorizontal: 10, paddingVertical: 8 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
