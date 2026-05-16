import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BrutalCard, BrutalBadge, Progress } from "@/src/components/Brutal";
import { useTheme, SPACING, hardShadow, RADIUS } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";

const COIN_IMG =
  "https://static.prod-images.emergentagent.com/jobs/c89ed141-cb60-4b53-9383-d3ddc653989d/images/6be62e444b6c23b395ab50a6e45337c1a7c7bf6d6a7e364e5dc5d0336fcd9bae.png";

export default function HomeTab() {
  const { colors } = useTheme();
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (!user) return null;

  const xpToNext = user.level * 100;
  const xpInLevel = user.xp - (user.level - 1) * 100;
  const progress = Math.max(0, Math.min(100, (xpInLevel / 100) * 100));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={{ uri: user.avatar }}
              style={[styles.avatar, { borderColor: colors.border }]}
            />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.hello, { color: colors.textMuted }]}>WELCOME BACK</Text>
              <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
                @{user.username}
              </Text>
            </View>
          </View>
          <View style={[styles.coinPill, { backgroundColor: colors.warning, borderColor: colors.border }, hardShadow(colors.border, 3)]}>
            <Image source={{ uri: COIN_IMG }} style={styles.coinIcon} />
            <Text style={styles.coinText} testID="header-coin-balance">{user.coins}</Text>
          </View>
        </View>

        {/* Level + XP card */}
        <BrutalCard
          testID="level-card"
          background={colors.primary}
          style={{ marginTop: SPACING.lg }}
        >
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.heroCaption}>LEVEL</Text>
              <Text style={styles.heroBig}>{user.level}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.heroCaption}>TOTAL XP</Text>
              <Text style={styles.heroBig}>{user.xp}</Text>
            </View>
          </View>
          <View style={{ marginTop: SPACING.md }}>
            <Progress value={xpInLevel} max={100} testID="xp-progress" />
            <Text style={{ color: "#0A0A0A", fontWeight: "800", marginTop: 6 }}>
              {Math.max(0, 100 - xpInLevel)} XP to level {user.level + 1}
            </Text>
          </View>
        </BrutalCard>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <BrutalCard background={colors.secondary} style={styles.statCard}>
            <Ionicons name="flame" size={28} color="#0A0A0A" />
            <Text style={styles.statNum} testID="streak-stat">{user.streak}</Text>
            <Text style={styles.statLabel}>DAY STREAK</Text>
          </BrutalCard>
          <BrutalCard background={colors.accent} style={styles.statCard}>
            <Ionicons name="game-controller" size={28} color="#0A0A0A" />
            <Text style={styles.statNum} testID="games-stat">{user.games_played}</Text>
            <Text style={styles.statLabel}>GAMES PLAYED</Text>
          </BrutalCard>
        </View>

        {/* Daily reward CTA */}
        <TouchableOpacity
          testID="daily-reward-cta"
          activeOpacity={0.85}
          onPress={() => router.push("/games/daily")}
        >
          <BrutalCard background={colors.warning} style={{ marginTop: SPACING.lg }}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <BrutalBadge label="DAILY" color={colors.primary} />
                <Text style={[styles.cardTitle, { color: "#0A0A0A", marginTop: 8 }]}>
                  Claim today&apos;s reward
                </Text>
                <Text style={[styles.cardSub, { color: "#0A0A0A" }]}>
                  Free coins + XP. Streak bonus inside!
                </Text>
              </View>
              <Ionicons name="gift" size={56} color="#0A0A0A" />
            </View>
          </BrutalCard>
        </TouchableOpacity>

        {/* Quick actions grid */}
        <Text style={[styles.section, { color: colors.text }]}>PLAY & EARN</Text>
        <View style={styles.grid}>
          <ActionCard
            testID="action-quiz"
            title="Quiz"
            subtitle="Brain busters"
            icon="bulb"
            color={colors.secondary}
            onPress={() => router.push("/games/quiz")}
          />
          <ActionCard
            testID="action-spin"
            title="Spin"
            subtitle="Wheel of luck"
            icon="sync"
            color={colors.accent}
            onPress={() => router.push("/games/spin")}
          />
          <ActionCard
            testID="action-tap"
            title="Tap"
            subtitle="Speed sprint"
            icon="flash"
            color={colors.primary}
            onPress={() => router.push("/games/tap")}
          />
          <ActionCard
            testID="action-missions"
            title="Missions"
            subtitle="Bonus rewards"
            icon="list"
            color={colors.success}
            onPress={() => router.push("/missions")}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const ActionCard = ({
  title,
  subtitle,
  icon,
  color,
  onPress,
  testID,
}: {
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  onPress: () => void;
  testID?: string;
}) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.gridItem} testID={testID}>
      <BrutalCard background={color} style={{ flex: 1 }}>
        <Ionicons name={icon} size={32} color="#0A0A0A" />
        <Text style={[styles.cardTitle, { color: "#0A0A0A", marginTop: 10 }]}>{title}</Text>
        <Text style={[styles.cardSub, { color: "#0A0A0A" }]}>{subtitle}</Text>
      </BrutalCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.lg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: { width: 52, height: 52, borderRadius: 999, borderWidth: 2 },
  hello: { fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  username: { fontSize: 18, fontWeight: "900", maxWidth: 180 },
  coinPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    gap: 6,
  },
  coinIcon: { width: 22, height: 22 },
  coinText: { fontSize: 16, fontWeight: "900", color: "#0A0A0A" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroBig: { fontSize: 44, fontWeight: "900", color: "#0A0A0A", letterSpacing: -2 },
  heroCaption: { fontSize: 11, fontWeight: "900", color: "#0A0A0A", letterSpacing: 1.4 },
  statsRow: { flexDirection: "row", gap: 12, marginTop: SPACING.md },
  statCard: { flex: 1, alignItems: "flex-start" },
  statNum: { fontSize: 32, fontWeight: "900", color: "#0A0A0A", marginTop: 6 },
  statLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2, color: "#0A0A0A" },
  cardTitle: { fontSize: 18, fontWeight: "900" },
  cardSub: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  section: { fontSize: 12, fontWeight: "900", letterSpacing: 1.5, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridItem: { width: "47.5%", minHeight: 130 },
});
