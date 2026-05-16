import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrutalCard, GradientCard } from "@/src/components/Brutal";
import { AnimatedEntrance } from "@/src/components/AnimatedEntrance";
import { useTheme, SPACING, GRADIENTS } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";

const ASSETS = {
  spin: "https://static.prod-images.emergentagent.com/jobs/c89ed141-cb60-4b53-9383-d3ddc653989d/images/0c66e5ec0986a25fa8c10a53d1196b4ecee940a370b9eaabf3cddf8515e1dd03.png",
  tap: "https://static.prod-images.emergentagent.com/jobs/c89ed141-cb60-4b53-9383-d3ddc653989d/images/ac51f5a0230504f9b1befb8e80dbbc59a9bc49ec00760540fd600749e6c7fad5.png",
  coin: "https://static.prod-images.emergentagent.com/jobs/c89ed141-cb60-4b53-9383-d3ddc653989d/images/6be62e444b6c23b395ab50a6e45337c1a7c7bf6d6a7e364e5dc5d0336fcd9bae.png",
};

export default function GamesTab() {
  const { colors } = useTheme();
  const router = useRouter();

  const games = [
    {
      key: "quiz",
      title: "Quiz Showdown",
      sub: "5 brain-busting questions",
      reward: "Up to +75 XP",
      gradient: "cool" as const,
      icon: "bulb" as const,
      onPress: () => router.push("/games/quiz"),
    },
    {
      key: "spin",
      title: "Spin the Wheel",
      sub: "Limited to once per minute",
      reward: "Up to +100 coins",
      gradient: "cyan" as const,
      img: ASSETS.spin,
      onPress: () => router.push("/games/spin"),
    },
    {
      key: "tap",
      title: "Tap Challenge",
      sub: "15-second tap sprint",
      reward: "+1 XP per 5 taps",
      gradient: "warm" as const,
      img: ASSETS.tap,
      onPress: () => router.push("/games/tap"),
    },
    {
      key: "daily",
      title: "Daily Reward",
      sub: "Claim once a day, build a streak",
      reward: "+25 XP & coins",
      gradient: "sunset" as const,
      icon: "gift" as const,
      onPress: () => router.push("/games/daily"),
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AnimatedEntrance from="top" delay={0}>
          <Text style={[styles.title, { color: colors.text }]}>Games</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            Pick a challenge and stack rewards
          </Text>
        </AnimatedEntrance>

        {/* Missions banner */}
        <AnimatedEntrance delay={120}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/missions")} testID="open-missions">
            <GradientCard gradient="success" style={{ marginTop: SPACING.md }}>
              <View style={styles.row}>
                <View style={styles.iconCircle}>
                  <Ionicons name="ribbon" size={26} color="#fff" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>DAILY MISSIONS</Text>
                  </View>
                  <Text style={styles.bannerTitle}>Bonus rewards await</Text>
                  <Text style={styles.bannerSub}>Tap to view today&apos;s missions →</Text>
                </View>
              </View>
            </GradientCard>
          </TouchableOpacity>
        </AnimatedEntrance>

        {games.map((g, i) => (
          <AnimatedEntrance key={g.key} delay={180 + i * 70}>
            <TouchableOpacity activeOpacity={0.9} onPress={g.onPress} testID={`game-card-${g.key}`}>
              <GradientCard gradient={g.gradient} style={{ marginTop: SPACING.md }}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.liveTag}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                    <Text style={styles.gameTitle}>{g.title}</Text>
                    <Text style={styles.gameSub}>{g.sub}</Text>
                    <View style={styles.rewardRow}>
                      <Image source={{ uri: ASSETS.coin }} style={styles.coinSmall} />
                      <Text style={styles.reward}>{g.reward}</Text>
                    </View>
                  </View>
                  {g.img ? (
                    <Image source={{ uri: g.img }} style={styles.gameImg} />
                  ) : (
                    <View style={styles.gameIconCircle}>
                      <Ionicons name={g.icon!} size={42} color="#fff" />
                    </View>
                  )}
                </View>
              </GradientCard>
            </TouchableOpacity>
          </AnimatedEntrance>
        ))}

        <View style={{ height: 130 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.sm },
  title: { fontSize: 32, fontWeight: "900", letterSpacing: -1 },
  sub: { fontWeight: "500", marginTop: 4, fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  tag: {
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  tagText: { color: "#fff", fontWeight: "900", fontSize: 10, letterSpacing: 0.8 },
  bannerTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginTop: 6 },
  bannerSub: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.9)", marginTop: 2 },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
    gap: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: "#fff" },
  liveText: { color: "#fff", fontWeight: "900", fontSize: 10, letterSpacing: 0.8 },
  gameTitle: { fontSize: 20, fontWeight: "800", color: "#fff", marginTop: 8 },
  gameSub: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.9)", marginTop: 2 },
  rewardRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 6 },
  coinSmall: { width: 16, height: 16 },
  reward: { fontSize: 12, fontWeight: "800", color: "#fff" },
  gameImg: { width: 88, height: 88 },
  gameIconCircle: {
    width: 78,
    height: 78,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
});
