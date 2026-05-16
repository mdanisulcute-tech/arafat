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
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BrutalCard, GradientCard, Progress } from "@/src/components/Brutal";
import { AnimatedEntrance } from "@/src/components/AnimatedEntrance";
import { RewardedAdModal } from "@/src/components/RewardedAdModal";
import { useTheme, SPACING, GRADIENTS, softShadow, RADIUS } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";

const COIN_IMG =
  "https://static.prod-images.emergentagent.com/jobs/c89ed141-cb60-4b53-9383-d3ddc653989d/images/6be62e444b6c23b395ab50a6e45337c1a7c7bf6d6a7e364e5dc5d0336fcd9bae.png";

export default function HomeTab() {
  const { colors } = useTheme();
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [adVisible, setAdVisible] = useState(false);

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

  const xpInLevel = user.xp - (user.level - 1) * 100;
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <AnimatedEntrance from="top" delay={0}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image source={{ uri: user.avatar }} style={[styles.avatar, { borderColor: colors.border }]} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.greeting, { color: colors.textMuted }]}>{greeting}</Text>
                <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
                  @{user.username}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              testID="header-coin-balance"
              activeOpacity={0.7}
              style={[styles.coinPill, { backgroundColor: colors.surface, borderColor: colors.border }, softShadow(colors.shadow, 6)]}
            >
              <Image source={{ uri: COIN_IMG }} style={styles.coinIcon} />
              <Text style={[styles.coinText, { color: colors.text }]}>{user.coins.toLocaleString()}</Text>
            </TouchableOpacity>
          </View>
        </AnimatedEntrance>

        {/* Hero level card */}
        <AnimatedEntrance delay={120}>
          <GradientCard gradient="primary" style={{ marginTop: SPACING.lg, padding: 4 }} testID="level-card">
            <View style={styles.heroInner}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroCaption}>LEVEL</Text>
                  <View style={styles.levelRow}>
                    <Text style={styles.heroBig}>{user.level}</Text>
                    <View style={styles.levelChip}>
                      <Ionicons name="trending-up" size={11} color="#fff" />
                      <Text style={styles.levelChipText}>{user.xp.toLocaleString()} XP</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.heroEmoji}>
                  <Ionicons name="rocket" size={32} color="#fff" />
                </View>
              </View>
              <View style={{ marginTop: 18 }}>
                <Progress value={xpInLevel} max={100} gradient="sunset" testID="xp-progress" />
                <Text style={styles.heroCaptionLight}>
                  {Math.max(0, 100 - xpInLevel)} XP to level {user.level + 1}
                </Text>
              </View>
            </View>
          </GradientCard>
        </AnimatedEntrance>

        {/* Stats row */}
        <AnimatedEntrance delay={200}>
          <View style={styles.statsRow}>
            <StatCard
              icon="flame"
              gradient="warm"
              value={user.streak}
              label="DAY STREAK"
              testID="streak-stat"
            />
            <StatCard
              icon="game-controller"
              gradient="cyan"
              value={user.games_played}
              label="GAMES"
              testID="games-stat"
            />
          </View>
        </AnimatedEntrance>

        {/* Daily reward CTA */}
        <AnimatedEntrance delay={260}>
          <TouchableOpacity
            testID="daily-reward-cta"
            activeOpacity={0.9}
            onPress={() => router.push("/games/daily")}
          >
            <BrutalCard style={{ marginTop: SPACING.lg }}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <View style={[styles.miniBadge, { backgroundColor: `${colors.warning}25` }]}>
                    <Ionicons name="gift" size={11} color={colors.warning} />
                    <Text style={[styles.miniBadgeText, { color: colors.warning }]}>DAILY REWARD</Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.text, marginTop: 8 }]}>
                    Claim today&apos;s bonus
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                    +25 XP & streak bonus coins inside
                  </Text>
                </View>
                <View style={[styles.giftWrap, { backgroundColor: `${colors.warning}20` }]}>
                  <Ionicons name="gift" size={28} color={colors.warning} />
                </View>
              </View>
            </BrutalCard>
          </TouchableOpacity>
        </AnimatedEntrance>

        {/* Watch-ad bonus CTA */}
        <AnimatedEntrance delay={300}>
          <TouchableOpacity
            testID="watch-ad-cta"
            activeOpacity={0.9}
            onPress={() => setAdVisible(true)}
            style={{ marginTop: SPACING.md }}
          >
            <GradientCard gradient="warm">
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <View style={styles.adBadge}>
                    <Ionicons name="play" size={10} color="#fff" />
                    <Text style={styles.adBadgeText}>BONUS · HOURLY</Text>
                  </View>
                  <Text style={styles.cardTitleLight}>Watch ad for +50 coins</Text>
                  <Text style={styles.cardSubLight}>Plus +40 XP. 5-second ad.</Text>
                </View>
                <View style={styles.adIconWrap}>
                  <Ionicons name="play-circle" size={32} color="#fff" />
                </View>
              </View>
            </GradientCard>
          </TouchableOpacity>
        </AnimatedEntrance>


        {/* Quick actions */}
        <AnimatedEntrance delay={320}>
          <Text style={[styles.section, { color: colors.text }]}>Quick play</Text>
        </AnimatedEntrance>

        <View style={styles.grid}>
          <AnimatedEntrance delay={360} style={styles.gridItem}>
            <ActionCard
              testID="action-quiz"
              title="Quiz"
              subtitle="Brain busters"
              icon="bulb"
              gradient="cool"
              onPress={() => router.push("/games/quiz")}
            />
          </AnimatedEntrance>
          <AnimatedEntrance delay={400} style={styles.gridItem}>
            <ActionCard
              testID="action-spin"
              title="Spin"
              subtitle="Wheel of luck"
              icon="sync"
              gradient="cyan"
              onPress={() => router.push("/games/spin")}
            />
          </AnimatedEntrance>
          <AnimatedEntrance delay={440} style={styles.gridItem}>
            <ActionCard
              testID="action-tap"
              title="Tap"
              subtitle="Speed sprint"
              icon="flash"
              gradient="primary"
              onPress={() => router.push("/games/tap")}
            />
          </AnimatedEntrance>
          <AnimatedEntrance delay={480} style={styles.gridItem}>
            <ActionCard
              testID="action-missions"
              title="Missions"
              subtitle="Bonus rewards"
              icon="list"
              gradient="success"
              onPress={() => router.push("/missions")}
            />
          </AnimatedEntrance>
        </View>

        <View style={{ height: 130 }} />
      </ScrollView>
      <RewardedAdModal visible={adVisible} onClose={() => setAdVisible(false)} />
    </SafeAreaView>
  );
}

const StatCard = ({
  icon,
  gradient,
  value,
  label,
  testID,
}: {
  icon: any;
  gradient: keyof typeof GRADIENTS;
  value: number;
  label: string;
  testID?: string;
}) => {
  const { colors } = useTheme();
  return (
    <BrutalCard testID={testID} style={{ flex: 1 }}>
      <View style={[styles.statIconWrap]}>
        <LinearGradient colors={GRADIENTS[gradient]} style={StyleSheet.absoluteFill} />
        <Ionicons name={icon} size={20} color="#fff" />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value.toLocaleString()}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </BrutalCard>
  );
};

const ActionCard = ({
  title,
  subtitle,
  icon,
  gradient,
  onPress,
  testID,
}: {
  title: string;
  subtitle: string;
  icon: any;
  gradient: keyof typeof GRADIENTS;
  onPress: () => void;
  testID?: string;
}) => {
  return (
    <GradientCard gradient={gradient} onPress={onPress} testID={testID} style={{ flex: 1 }}>
      <View style={{ minHeight: 110 }}>
        <View style={styles.actionIconWrap}>
          <Ionicons name={icon} size={22} color="#fff" />
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub}>{subtitle}</Text>
      </View>
    </GradientCard>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.sm },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 999, borderWidth: 1.5 },
  greeting: { fontSize: 12, fontWeight: "600" },
  username: { fontSize: 18, fontWeight: "800", maxWidth: 180 },
  coinPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  coinIcon: { width: 20, height: 20 },
  coinText: { fontSize: 15, fontWeight: "800" },
  heroInner: { padding: 18 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroCaption: { fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.75)", letterSpacing: 1.4 },
  heroCaptionLight: { color: "rgba(255,255,255,0.85)", fontWeight: "700", fontSize: 12, marginTop: 8 },
  heroBig: { fontSize: 56, fontWeight: "900", color: "#fff", letterSpacing: -3, lineHeight: 58 },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  levelChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  levelChipText: { color: "#fff", fontWeight: "800", fontSize: 11, letterSpacing: 0.4 },
  heroEmoji: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  miniBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
    gap: 4,
  },
  miniBadgeText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  giftWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: { flexDirection: "row", gap: 12, marginTop: SPACING.md },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 28, fontWeight: "900", marginTop: 8, letterSpacing: -1 },
  statLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginTop: 2 },
  cardTitle: { fontSize: 17, fontWeight: "800" },
  cardSub: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  cardTitleLight: { fontSize: 17, fontWeight: "800", color: "#fff", marginTop: 8 },
  cardSubLight: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.9)", marginTop: 2 },
  adBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
    gap: 4,
  },
  adBadgeText: { color: "#fff", fontWeight: "900", fontSize: 10, letterSpacing: 0.6 },
  adIconWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  section: { fontSize: 18, fontWeight: "800", marginTop: SPACING.lg, marginBottom: SPACING.sm, letterSpacing: -0.3 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridItem: { width: "47.7%" },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginTop: 12 },
  actionSub: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.85)", marginTop: 2 },
});
