import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrutalButton, BrutalCard, BrutalBadge } from "@/src/components/Brutal";
import { useTheme, SPACING, RADIUS } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { api } from "@/src/api/client";
import { User } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileTab() {
  const { colors } = useTheme();
  const { user, logout, setUser } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.username ?? "");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const save = async () => {
    setSaving(true);
    try {
      const u = await api.patch<User>("/profile", { username: name.trim() });
      setUser(u);
      setEditing(false);
    } catch (e: any) {
      Alert.alert("Update failed", e.message);
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const joinedDate = new Date(user.created_at).toLocaleDateString();

  const stats = [
    { label: "TOTAL XP", value: user.xp, color: colors.primary },
    { label: "LEVEL", value: user.level, color: colors.secondary },
    { label: "COINS", value: user.coins, color: colors.warning },
    { label: "STREAK", value: user.streak, color: colors.accent },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <BrutalCard background={colors.secondary}>
          <View style={{ alignItems: "center" }}>
            <Image source={{ uri: user.avatar }} style={[styles.avatar, { borderColor: colors.border }]} />
            {editing ? (
              <TextInput
                testID="profile-username-input"
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
                style={[
                  styles.input,
                  { color: "#0A0A0A", borderColor: colors.border, backgroundColor: colors.surface },
                ]}
              />
            ) : (
              <Text style={styles.username} testID="profile-username">@{user.username}</Text>
            )}
            <Text style={styles.email}>{user.email}</Text>
            <BrutalBadge label={`JOINED ${joinedDate}`} color={colors.warning} />
          </View>
        </BrutalCard>

        <Text style={[styles.section, { color: colors.text }]}>STATS</Text>
        <View style={styles.grid}>
          {stats.map((s) => (
            <BrutalCard
              key={s.label}
              background={s.color}
              style={styles.statCard}
              testID={`stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </BrutalCard>
          ))}
        </View>

        <Text style={[styles.section, { color: colors.text }]}>BADGES</Text>
        <BrutalCard>
          {user.badges?.length ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {user.badges.map((b) => (
                <BrutalBadge key={b} label={b} color={colors.accent} />
              ))}
            </View>
          ) : (
            <Text style={{ color: colors.textMuted, fontWeight: "700" }}>
              Play more games to unlock badges!
            </Text>
          )}
        </BrutalCard>

        <View style={{ marginTop: SPACING.lg, gap: 10 }}>
          {editing ? (
            <>
              <BrutalButton
                testID="profile-save"
                title="SAVE"
                onPress={save}
                loading={saving}
                variant="primary"
              />
              <BrutalButton
                testID="profile-cancel-edit"
                title="Cancel"
                onPress={() => {
                  setEditing(false);
                  setName(user.username);
                }}
                variant="outline"
              />
            </>
          ) : (
            <BrutalButton
              testID="profile-edit"
              title="EDIT PROFILE"
              onPress={() => setEditing(true)}
              variant="secondary"
            />
          )}
          <BrutalButton
            testID="profile-logout"
            title="LOG OUT"
            onPress={onLogout}
            variant="warning"
          />
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.lg },
  avatar: { width: 100, height: 100, borderRadius: 999, borderWidth: 3, marginBottom: 10 },
  username: { fontSize: 26, fontWeight: "900", color: "#0A0A0A" },
  email: { color: "#0A0A0A", fontWeight: "700", marginBottom: 8 },
  input: {
    fontSize: 22,
    fontWeight: "900",
    borderWidth: 2,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 200,
    textAlign: "center",
  },
  section: { fontSize: 12, fontWeight: "900", letterSpacing: 1.5, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: { width: "47.5%", alignItems: "flex-start" },
  statValue: { fontSize: 32, fontWeight: "900", color: "#0A0A0A", letterSpacing: -1 },
  statLabel: { fontSize: 10, fontWeight: "900", color: "#0A0A0A", letterSpacing: 1.2, marginTop: 4 },
});
