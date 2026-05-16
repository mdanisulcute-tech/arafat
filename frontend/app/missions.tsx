import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, SPACING, hardShadow } from "@/src/theme";
import { BrutalButton, BrutalCard, BrutalBadge, Progress } from "@/src/components/Brutal";
import { api } from "@/src/api/client";
import { Mission } from "@/src/types";
import { useAuth } from "@/src/contexts/AuthContext";

export default function MissionsScreen() {
  const { colors } = useTheme();
  const { refresh } = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const m = await api.get<Mission[]>("/missions");
      setMissions(m);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const claim = async (m: Mission) => {
    setClaiming(m.key);
    try {
      await api.post(`/missions/${m.key}/claim`);
      await load();
      await refresh();
    } catch {
      // ignore
    } finally {
      setClaiming(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} testID="missions-close">
          <Ionicons name="close-circle" size={32} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>DAILY MISSIONS</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            Complete missions today to earn bonus rewards. Resets at midnight UTC.
          </Text>

          {missions.map((m) => {
            const done = m.progress >= m.goal;
            const canClaim = done && !m.claimed;
            return (
              <BrutalCard
                key={m.key}
                background={m.claimed ? colors.success : colors.surface}
                style={{ marginTop: SPACING.md }}
                testID={`mission-${m.key}`}
              >
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    {m.claimed ? (
                      <BrutalBadge label="CLAIMED" color={colors.warning} />
                    ) : done ? (
                      <BrutalBadge label="READY!" color={colors.warning} />
                    ) : (
                      <BrutalBadge label={`${m.progress}/${m.goal}`} color={colors.accent} />
                    )}
                    <Text style={[styles.mTitle, { color: m.claimed ? "#0A0A0A" : colors.text }]}>
                      {m.title}
                    </Text>
                    <Text style={[styles.mDesc, { color: m.claimed ? "#0A0A0A" : colors.textMuted }]}>
                      {m.description}
                    </Text>
                    <View style={{ marginTop: 10 }}>
                      <Progress value={m.progress} max={m.goal} />
                    </View>
                    <Text style={[styles.reward, { color: m.claimed ? "#0A0A0A" : colors.text }]}>
                      Reward: +{m.xp_reward} XP · +{m.coin_reward} coins
                    </Text>
                  </View>
                </View>
                {!m.claimed && (
                  <BrutalButton
                    testID={`mission-claim-${m.key}`}
                    title={canClaim ? "CLAIM" : "IN PROGRESS"}
                    onPress={() => claim(m)}
                    disabled={!canClaim}
                    loading={claiming === m.key}
                    variant={canClaim ? "primary" : "outline"}
                    style={{ marginTop: SPACING.sm }}
                  />
                )}
              </BrutalCard>
            );
          })}
        </ScrollView>
      )}
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
  },
  title: { fontSize: 18, fontWeight: "900", letterSpacing: 1 },
  sub: { fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "flex-start" },
  mTitle: { fontSize: 18, fontWeight: "900", marginTop: 8 },
  mDesc: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  reward: { fontSize: 13, fontWeight: "900", marginTop: 8 },
});
