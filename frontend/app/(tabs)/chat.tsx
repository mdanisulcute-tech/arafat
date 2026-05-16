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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useTheme, SPACING, RADIUS, softShadow } from "@/src/theme";
import { AnimatedEntrance } from "@/src/components/AnimatedEntrance";
import { SkeletonCard } from "@/src/components/Skeleton";
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

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <AnimatedEntrance from="top">
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Global Chat</Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>Say hi to other players</Text>
          </View>
          <View style={[styles.online, { backgroundColor: `${colors.success}1A`, borderColor: colors.success }]}>
            <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.onlineText, { color: colors.success }]}>LIVE</Text>
          </View>
        </View>
      </AnimatedEntrance>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {loading ? (
          <View style={{ padding: SPACING.lg, gap: 10 }}>
            <SkeletonCard height={60} />
            <SkeletonCard height={60} />
            <SkeletonCard height={60} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 130 }}
            showsVerticalScrollIndicator={false}
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
                        marginLeft: isMe ? 0 : 8,
                        marginRight: isMe ? 8 : 0,
                        borderTopLeftRadius: isMe ? 18 : 4,
                        borderTopRightRadius: isMe ? 4 : 18,
                      },
                      softShadow(colors.shadow, 4),
                    ]}
                  >
                    {!isMe && (
                      <Text style={[styles.who, { color: colors.primary }]}>@{item.username}</Text>
                    )}
                    <Text style={[styles.bubbleText, { color: isMe ? "#fff" : colors.text }]}>
                      {item.text}
                    </Text>
                    <Text style={[styles.time, { color: isMe ? "rgba(255,255,255,0.7)" : colors.textSubtle }]}>
                      {formatTime(item.created_at)}
                    </Text>
                  </View>
                  {isMe && (
                    <Image source={{ uri: item.avatar }} style={[styles.av, { borderColor: colors.border }]} />
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 60, fontWeight: "600" }}>
                Be the first to say hi 👋
              </Text>
            }
          />
        )}

        <View style={[
          styles.inputBar,
          { backgroundColor: colors.surface, borderColor: colors.border },
          softShadow(colors.shadow, 14),
        ]}>
          <TextInput
            testID="chat-input"
            value={text}
            onChangeText={setText}
            placeholder="Say something…"
            placeholderTextColor={colors.textSubtle}
            style={[styles.input, { color: colors.text }]}
            maxLength={300}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity
            testID="chat-send"
            onPress={send}
            disabled={sending || !text.trim()}
            activeOpacity={0.8}
            style={[
              styles.sendBtn,
              { backgroundColor: colors.primary, opacity: sending || !text.trim() ? 0.4 : 1 },
            ]}
          >
            <Ionicons name="send" size={18} color="#fff" />
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
  title: { fontSize: 28, fontWeight: "900", letterSpacing: -0.8 },
  sub: { fontWeight: "500", fontSize: 13, marginTop: 2 },
  online: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    gap: 5,
  },
  onlineDot: { width: 6, height: 6, borderRadius: 999 },
  onlineText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", marginVertical: 6 },
  av: { width: 32, height: 32, borderRadius: 999, borderWidth: 1 },
  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  who: { fontSize: 11, fontWeight: "800", marginBottom: 2 },
  bubbleText: { fontSize: 15, fontWeight: "500", lineHeight: 20 },
  time: { fontSize: 10, fontWeight: "600", marginTop: 3, alignSelf: "flex-end" },
  inputBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 92,
    left: 16,
    right: 16,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  input: { flex: 1, fontSize: 15, fontWeight: "500", paddingHorizontal: 12, paddingVertical: 10 },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
