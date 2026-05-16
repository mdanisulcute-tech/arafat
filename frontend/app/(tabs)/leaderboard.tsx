import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, SPACING, hardShadow } from "@/src/theme";
import { BrutalCard } from "@/src/components/Brutal";
import { api } from "@/src/api/client";
import { LeaderboardEntry } from "@/src/types";
import { useAuth } from "@/src/contexts/AuthContext";

const TROPHY =
  "https://static.prod-images.emergentagent.com/jobs/c89ed141-cb60-4b53-9383-d3ddc653989d/images/6330244a65c6ce49c40eb77a107c1e59b6ee048956f6f5da348f17f94a4e4954.png";

const TABS: { key: "weekly" | "monthly" | "all"; label: string }[] = [
  { key: "weekly", label: "WEEKLY" },
  { key: "monthly", label: "MONTHLY" },
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
    } catch (e) {
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
      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.md }}>
        <Text style={[styles.title, { color: colors.text }]}>LEADERBOARD</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>Top players this {period === "all" ? "year" : period.replace("ly", "")}</Text>

        {/* segmented tabs */}
        <View
          style={[
            styles.tabs,
            { backgroundColor: colors.surface, borderColor: colors.border },
            hardShadow(colors.border, 3),
          ]}
        >
          {TABS.map((t) => {
            const active = t.key === period;
            return (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.tab,
                  { backgroundColor: active ? colors.primary : "transparent" },
                ]}
                onPress={() => setPeriod(t.key)}
                testID={`tab-${t.key}`}
              >
                <Text style={[styles.tabText, { color: active ? "#0A0A0A" : colors.text }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(item) => `${item.rank}-${item.username}`}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 140 }}
          ListHeaderComponent={
            <View style={styles.podiumRow}>
              <PodiumSlot entry={top3[1]} place={2} color={colors.secondary} />
              <PodiumSlot entry={top3[0]} place={1} color={colors.warning} big />
              <PodiumSlot entry={top3[2]} place={3} color={colors.accent} />
            </View>
          }
          renderItem={({ item }) => {
            const isMe = user && item.username === user.username;
            return (
              <BrutalCard
                background={isMe ? colors.primary : colors.surface}
                style={{ marginBottom: 10 }}
                testID={`leaderboard-row-${item.rank}`}
              >
                <View style={styles.row}>
                  <Text style={[styles.rank, { color: isMe ? "#0A0A0A" : colors.text }]}>#{item.rank}</Text>
                  <Image source={{ uri: item.avatar }} style={[styles.av, { borderColor: colors.border }]} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.name, { color: isMe ? "#0A0A0A" : colors.text }]} numberOfLines={1}>
                      @{item.username} {isMe ? "(YOU)" : ""}
                    </Text>
                    <Text style={[styles.lvl, { color: isMe ? "#0A0A0A" : colors.textMuted }]}>
                      LEVEL {item.level}
                    </Text>
                  </View>
                  <Text style={[styles.xp, { color: isMe ? "#0A0A0A" : colors.text }]}>{item.xp} XP</Text>
                </View>
              </BrutalCard>
            );
          }}
          ListEmptyComponent={
            <BrutalCard>
              <Text style={{ color: colors.text, fontWeight: "700", textAlign: "center" }}>
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
  color,
  big,
}: {
  entry?: LeaderboardEntry;
  place: 1 | 2 | 3;
  color: string;
  big?: boolean;
}) => {
  const { colors } = useTheme();
  return (
    <View style={[podStyles.slot, big ? podStyles.big : undefined]}>
      {place === 1 && <Image source={{ uri: TROPHY }} style={podStyles.trophy} />}
      <View
        style={[
          podStyles.podium,
          { backgroundColor: color, borderColor: colors.border, height: big ? 130 : 105 },
          hardShadow(colors.border, 4),
        ]}
      >
        {entry?.avatar ? (
          <Image source={{ uri: entry.avatar }} style={[podStyles.av, { borderColor: colors.border }]} />
        ) : (
          <View style={[podStyles.av, { backgroundColor: colors.surface, borderColor: colors.border }]} />
        )}
        <Text style={podStyles.place}>#{place}</Text>
        <Text style={podStyles.name} numberOfLines={1}>
          {entry ? `@${entry.username}` : "—"}
        </Text>
        <Text style={podStyles.xp}>{entry ? `${entry.xp} XP` : ""}</Text>
      </View>
    </View>
  );
};

const podStyles = StyleSheet.create({
  slot: { flex: 1, alignItems: "center", paddingHorizontal: 4 },
  big: { marginTop: -20 },
  trophy: { width: 50, height: 50, marginBottom: -8, zIndex: 2 },
  podium: {
    width: "100%",
    borderWidth: 2,
    borderRadius: 18,
    paddingTop: 20,
    paddingBottom: 8,
    alignItems: "center",
  },
  av: { width: 44, height: 44, borderRadius: 999, borderWidth: 2, marginBottom: 4 },
  place: { fontSize: 14, fontWeight: "900", color: "#0A0A0A" },
  name: { fontSize: 12, fontWeight: "900", color: "#0A0A0A", maxWidth: 90 },
  xp: { fontSize: 11, fontWeight: "800", color: "#0A0A0A" },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  title: { fontSize: 32, fontWeight: "900", letterSpacing: -1 },
  sub: { fontWeight: "700", marginTop: 4 },
  tabs: {
    flexDirection: "row",
    borderWidth: 2,
    borderRadius: 999,
    marginTop: SPACING.md,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: "center" },
  tabText: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  podiumRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 30,
    marginBottom: SPACING.lg,
  },
  row: { flexDirection: "row", alignItems: "center" },
  rank: { fontSize: 18, fontWeight: "900", width: 40 },
  av: { width: 40, height: 40, borderRadius: 999, borderWidth: 2 },
  name: { fontSize: 15, fontWeight: "900" },
  lvl: { fontSize: 10, fontWeight: "800", letterSpacing: 1, marginTop: 2 },
  xp: { fontSize: 16, fontWeight: "900" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
