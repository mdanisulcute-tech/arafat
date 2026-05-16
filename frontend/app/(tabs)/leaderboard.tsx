import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, SPACING, softShadow, GRADIENTS, RADIUS } from "@/src/theme";
import { BrutalCard } from "@/src/components/Brutal";
import { AnimatedEntrance } from "@/src/components/AnimatedEntrance";
import { SkeletonCard } from "@/src/components/Skeleton";
import { api } from "@/src/api/client";
import { LeaderboardEntry } from "@/src/types";
import { useAuth } from "@/src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const TROPHY =
  "https://static.prod-images.emergentagent.com/jobs/c89ed141-cb60-4b53-9383-d3ddc653989d/images/6330244a65c6ce49c40eb77a107c1e59b6ee048956f6f5da348f17f94a4e4954.png";

const TABS: { key: "weekly" | "monthly" | "all"; label: string }[] = [
  { key: "weekly", label: "WEEK" },
  { key: "monthly", label: "MONTH" },
  { key: "all", label: "ALL-TIME" },
];

export default function LeaderboardTab() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all">("all");
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<LeaderboardEntry[]>(`/leaderboard?period=${period}`);
      setData(r);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.headerWrap}>
        <AnimatedEntrance from="top">
          <Text style={[styles.title, { color: colors.text }]}>Leaderboard</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            Top players this {period === "all" ? "season" : period.replace("ly", "")}
          </Text>

          <View style={[styles.tabs, { backgroundColor: colors.surface, borderColor: colors.border }, softShadow(colors.shadow, 6)]}>
            {TABS.map((t) => {
              const active = t.key === period;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.tab, active && { backgroundColor: colors.primary }]}
                  onPress={() => setPeriod(t.key)}
                  testID={`tab-${t.key}`}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.tabText, { color: active ? "#fff" : colors.textMuted }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </AnimatedEntrance>
      </View>

      {loading ? (
        <View style={{ padding: SPACING.lg, gap: 12 }}>
          <SkeletonCard height={160} />
          <SkeletonCard height={70} />
          <SkeletonCard height={70} />
          <SkeletonCard height={70} />
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(item) => `${item.rank}-${item.username}`}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <AnimatedEntrance>
              <View style={styles.podiumRow}>
                <PodiumSlot entry={top3[1]} place={2} gradient="cyan" />
                <PodiumSlot entry={top3[0]} place={1} gradient="sunset" big />
                <PodiumSlot entry={top3[2]} place={3} gradient="cool" />
              </View>
            </AnimatedEntrance>
          }
          renderItem={({ item, index }) => {
            const isMe = user && item.username === user.username;
            return (
              <AnimatedEntrance delay={index * 40}>
                <BrutalCard
                  style={[styles.row, isMe && { borderColor: colors.primary, borderWidth: 1.5 }, { marginBottom: 10 }]}
                  testID={`leaderboard-row-${item.rank}`}
                  background={isMe ? `${colors.primary}10` : undefined}
                >
                  <Text style={[styles.rank, { color: isMe ? colors.primary : colors.textMuted }]}>#{item.rank}</Text>
                  <Image source={{ uri: item.avatar }} style={[styles.av, { borderColor: colors.border }]} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                      @{item.username} {isMe ? "· You" : ""}
                    </Text>
                    <Text style={[styles.lvl, { color: colors.textMuted }]}>LV {item.level}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.xp, { color: colors.text }]}>{item.xp.toLocaleString()}</Text>
                    <Text style={[styles.xpUnit, { color: colors.textMuted }]}>XP</Text>
                  </View>
                </BrutalCard>
              </AnimatedEntrance>
            );
          }}
          ListEmptyComponent={
            <BrutalCard>
              <Text style={{ color: colors.textMuted, fontWeight: "600", textAlign: "center" }}>
                No more players yet. Be the first!
              </Text>
            </BrutalCard>
          }
        />
      )}
    </SafeAreaView>
  );
}

const PodiumSlot = ({
  entry,
  place,
  gradient,
  big,
}: {
  entry?: LeaderboardEntry;
  place: 1 | 2 | 3;
  gradient: keyof typeof GRADIENTS;
  big?: boolean;
}) => {
  const { colors } = useTheme();
  return (
    <View style={[podStyles.slot, big ? podStyles.big : undefined]}>
      {place === 1 && <Image source={{ uri: TROPHY }} style={podStyles.trophy} />}
      <View
        style={[
          podStyles.podiumWrap,
          { height: big ? 140 : 115, ...softShadow(colors.shadow, 12) },
        ]}
      >
        <LinearGradient
          colors={GRADIENTS[gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={podStyles.podiumInner}>
          {entry?.avatar ? (
            <Image source={{ uri: entry.avatar }} style={podStyles.av} />
          ) : (
            <View style={[podStyles.av, { backgroundColor: "rgba(255,255,255,0.3)" }]} />
          )}
          <Text style={podStyles.place}>#{place}</Text>
          <Text style={podStyles.name} numberOfLines={1}>
            {entry ? `@${entry.username}` : "—"}
          </Text>
          <Text style={podStyles.xp}>{entry ? `${entry.xp.toLocaleString()} XP` : ""}</Text>
        </View>
      </View>
    </View>
  );
};

const podStyles = StyleSheet.create({
  slot: { flex: 1, alignItems: "center", paddingHorizontal: 4 },
  big: { marginTop: -16 },
  trophy: { width: 44, height: 44, marginBottom: -6, zIndex: 2 },
  podiumWrap: { width: "100%", borderRadius: RADIUS.lg, overflow: "hidden" },
  podiumInner: { paddingTop: 18, paddingBottom: 10, alignItems: "center" },
  av: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    marginBottom: 4,
  },
  place: { fontSize: 13, fontWeight: "900", color: "#fff" },
  name: { fontSize: 11, fontWeight: "800", color: "#fff", maxWidth: 90 },
  xp: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.9)" },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerWrap: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  title: { fontSize: 32, fontWeight: "900", letterSpacing: -1 },
  sub: { fontWeight: "500", marginTop: 4, fontSize: 14 },
  tabs: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 999,
    marginTop: SPACING.md,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: "center" },
  tabText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  podiumRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 30, marginBottom: SPACING.lg },
  row: { flexDirection: "row", alignItems: "center", padding: 12 },
  rank: { fontSize: 16, fontWeight: "900", width: 38 },
  av: { width: 40, height: 40, borderRadius: 999, borderWidth: 1.5 },
  name: { fontSize: 15, fontWeight: "800" },
  lvl: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginTop: 2 },
  xp: { fontSize: 16, fontWeight: "900" },
  xpUnit: { fontSize: 10, fontWeight: "700" },
});
