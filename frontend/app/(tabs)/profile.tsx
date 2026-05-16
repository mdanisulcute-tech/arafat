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
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrutalButton, BrutalCard, BrutalBadge } from "@/src/components/Brutal";
import { AnimatedEntrance } from "@/src/components/AnimatedEntrance";
import { useTheme, SPACING, RADIUS, GRADIENTS, softShadow } from "@/src/theme";
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

  const joinedDate = new Date(user.created_at).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });

  const stats = [
    { label: "TOTAL XP", value: user.xp, icon: "flash" as const, gradient: "primary" as const },
    { label: "LEVEL", value: user.level, icon: "rocket" as const, gradient: "cool" as const },
    { label: "COINS", value: user.coins, icon: "cash" as const, gradient: "warm" as const },
    { label: "STREAK", value: user.streak, icon: "flame" as const, gradient: "sunset" as const },
    { label: "GAMES", value: user.games_played, icon: "game-controller" as const, gradient: "cyan" as const },
    { label: "BEST TAP", value: user.best_tap_score, icon: "flash-outline" as const, gradient: "success" as const },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AnimatedEntrance from="top">
          <View style={{ overflow: "hidden", borderRadius: RADIUS.xl, ...softShadow(colors.shadow, 14) }}>
            <LinearGradient
              colors={GRADIENTS.night}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileHeader}
            >
              <View style={styles.avatarRing}>
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              </View>
              {editing ? (
                <TextInput
                  testID="profile-username-input"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="none"
                  style={styles.usernameInput}
                />
              ) : (
                <Text style={styles.username} testID="profile-username">@{user.username}</Text>
              )}
              <Text style={styles.email}>{user.email}</Text>
              <View style={styles.joinChip}>
                <Ionicons name="calendar-outline" size={11} color="#fff" />
                <Text style={styles.joinText}>Joined {joinedDate}</Text>
              </View>
            </LinearGradient>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance delay={120}>
          <Text style={[styles.section, { color: colors.text }]}>Statistics</Text>
        </AnimatedEntrance>

        <View style={styles.grid}>
          {stats.map((s, i) => (
            <AnimatedEntrance key={s.label} delay={160 + i * 50} style={styles.statCell}>
              <BrutalCard
                style={{ flex: 1 }}
                testID={`stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <View style={styles.statIconWrap}>
                  <LinearGradient colors={GRADIENTS[s.gradient]} style={StyleSheet.absoluteFill} />
                  <Ionicons name={s.icon} size={18} color="#fff" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{s.value.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
              </BrutalCard>
            </AnimatedEntrance>
          ))}
        </View>

        <AnimatedEntrance delay={420}>
          <Text style={[styles.section, { color: colors.text }]}>Badges</Text>
          <BrutalCard>
            {user.badges?.length ? (
              <View style={styles.badgeRow}>
                {user.badges.map((b) => (
                  <View
                    key={b}
                    style={[styles.badgeChip, { backgroundColor: `${colors.primary}1A` }]}
                  >
                    <Ionicons name="medal" size={14} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 12, marginLeft: 4 }}>
                      {b}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ color: colors.textMuted, fontWeight: "600", textAlign: "center" }}>
                Play more games to unlock badges!
              </Text>
            )}
          </BrutalCard>
        </AnimatedEntrance>

        <AnimatedEntrance delay={480}>
          <View style={{ marginTop: SPACING.lg, gap: 12 }}>
            {editing ? (
              <>
                <BrutalButton
                  testID="profile-save"
                  title="Save changes"
                  onPress={save}
                  loading={saving}
                />
                <BrutalButton
                  testID="profile-cancel-edit"
                  title="Cancel"
                  variant="outline"
                  onPress={() => {
                    setEditing(false);
                    setName(user.username);
                  }}
                />
              </>
            ) : (
              <BrutalButton
                testID="profile-edit"
                title="Edit profile"
                variant="outline"
                onPress={() => setEditing(true)}
                icon={<Ionicons name="create-outline" size={16} color={colors.text} />}
              />
            )}
            <BrutalButton
              testID="profile-logout"
              title="Log out"
              variant="outline"
              onPress={onLogout}
              icon={<Ionicons name="log-out-outline" size={16} color={colors.danger} />}
              textStyle={{ color: colors.danger }}
            />
          </View>
        </AnimatedEntrance>

        <View style={{ height: 150 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.sm },
  profileHeader: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  avatar: { width: 100, height: 100, borderRadius: 999 },
  username: { fontSize: 24, fontWeight: "900", color: "#fff", marginTop: 14, letterSpacing: -0.5 },
  usernameInput: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
    textAlign: "center",
    minWidth: 200,
  },
  email: { color: "rgba(255,255,255,0.75)", fontWeight: "600", marginTop: 4 },
  joinChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 12,
    gap: 6,
  },
  joinText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  section: { fontSize: 18, fontWeight: "800", marginTop: SPACING.lg, marginBottom: SPACING.sm, letterSpacing: -0.3 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCell: { width: "47.7%" },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 24, fontWeight: "900", marginTop: 8, letterSpacing: -1 },
  statLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginTop: 2 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badgeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
});
