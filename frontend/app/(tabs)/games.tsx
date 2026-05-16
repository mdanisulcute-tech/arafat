import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrutalCard, BrutalBadge } from "@/src/components/Brutal";
import { useTheme, SPACING } from "@/src/theme";
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
      reward: "+75 XP",
      bg: colors.secondary,
      icon: "bulb" as any,
      onPress: () => router.push("/games/quiz"),
      live: true,
    },
    {
      key: "spin",
      title: "Spin the Wheel",
      sub: "One spin per minute",
      reward: "+100 coins jackpot",
      bg: colors.accent,
      img: ASSETS.spin,
      onPress: () => router.push("/games/spin"),
      live: true,
    },
    {
      key: "daily",
      title: "Daily Reward",
      sub: "Claim once a day, build a streak",
      reward: "+25 XP & coins",
      bg: colors.warning,
      icon: "gift" as any,
      onPress: () => router.push("/games/daily"),
      live: true,
    },
    {
      key: "tap",
      title: "Tap Challenge",
      sub: "Smash the button — coming soon",
      reward: "Coming soon",
      bg: colors.primary,
      img: ASSETS.tap,
      onPress: () => {},
      live: false,
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.text }]}>GAMES</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          Pick a game and stack rewards
        </Text>

        {games.map((g) => (
          <TouchableOpacity
            key={g.key}
            activeOpacity={0.85}
            onPress={g.onPress}
            disabled={!g.live}
            testID={`game-card-${g.key}`}
          >
            <BrutalCard background={g.bg} style={{ marginTop: SPACING.md }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <BrutalBadge label={g.live ? "LIVE" : "SOON"} color={g.live ? colors.success : colors.surface} />
                  <Text style={styles.cardTitle}>{g.title}</Text>
                  <Text style={styles.cardSub}>{g.sub}</Text>
                  <View style={styles.rewardRow}>
                    <Image source={{ uri: ASSETS.coin }} style={styles.coinSmall} />
                    <Text style={styles.reward}>{g.reward}</Text>
                  </View>
                </View>
                {g.img ? (
                  <Image source={{ uri: g.img }} style={styles.gameImg} />
                ) : (
                  <Ionicons name={g.icon} size={72} color="#0A0A0A" />
                )}
              </View>
            </BrutalCard>
          </TouchableOpacity>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.lg },
  title: { fontSize: 36, fontWeight: "900", letterSpacing: -1 },
  sub: { fontWeight: "700", marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontSize: 22, fontWeight: "900", color: "#0A0A0A", marginTop: 8 },
  cardSub: { fontSize: 13, fontWeight: "700", color: "#0A0A0A", marginTop: 4 },
  rewardRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 6 },
  coinSmall: { width: 18, height: 18 },
  reward: { fontSize: 12, fontWeight: "900", color: "#0A0A0A", letterSpacing: 0.5 },
  gameImg: { width: 96, height: 96 },
});
