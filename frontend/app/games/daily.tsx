import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrutalButton, BrutalCard } from "@/src/components/Brutal";
import { useTheme, SPACING } from "@/src/theme";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const COIN =
  "https://static.prod-images.emergentagent.com/jobs/c89ed141-cb60-4b53-9383-d3ddc653989d/images/6be62e444b6c23b395ab50a6e45337c1a7c7bf6d6a7e364e5dc5d0336fcd9bae.png";

type Claim = { coins_awarded: number; xp_awarded: number; streak: number };

export default function DailyRewardScreen() {
  const { colors } = useTheme();
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const claimReward = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r: any = await api.post("/rewards/daily-claim");
      setClaim({
        coins_awarded: r.coins_awarded,
        xp_awarded: r.xp_awarded,
        streak: r.streak,
      });
      await refresh();
    } catch (e: any) {
      setErr(e.message || "Could not claim");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.warning }]} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} testID="daily-close">
          <Ionicons name="close-circle" size={32} color="#0A0A0A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DAILY REWARD</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.center}>
        <Image source={{ uri: COIN }} style={styles.coin} />

        {!claim ? (
          <>
            <Text style={[styles.title, { color: "#0A0A0A" }]}>READY FOR{"\n"}YOUR DAILY BAG?</Text>
            <Text style={[styles.sub, { color: "#0A0A0A" }]}>
              Current streak: <Text style={{ fontWeight: "900" }}>{user?.streak ?? 0} day{user?.streak === 1 ? "" : "s"}</Text>
            </Text>

            <BrutalCard background={colors.surface} style={{ marginTop: SPACING.lg, alignSelf: "stretch" }}>
              <Text style={[styles.rewardLine, { color: colors.text }]}>
                +25 XP guaranteed
              </Text>
              <Text style={[styles.rewardLine, { color: colors.text }]}>
                +20 coins (+5 extra per streak day)
              </Text>
              <Text style={[styles.rewardLine, { color: colors.textMuted, marginTop: 4 }]}>
                Come back tomorrow to keep your streak alive 🔥
              </Text>
            </BrutalCard>

            {err && (
              <BrutalCard background={colors.danger} style={{ marginTop: SPACING.md, alignSelf: "stretch" }}>
                <Text style={{ color: "#0A0A0A", fontWeight: "800" }} testID="daily-error">
                  {err}
                </Text>
              </BrutalCard>
            )}

            <BrutalButton
              testID="daily-claim"
              title="CLAIM REWARD"
              onPress={claimReward}
              loading={busy}
              variant="primary"
              style={{ marginTop: SPACING.lg, alignSelf: "stretch" }}
            />
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: "#0A0A0A" }]}>BOOM! 🎉</Text>
            <BrutalCard background={colors.success} style={{ marginTop: SPACING.lg, alignSelf: "stretch" }} testID="daily-result">
              <Text style={styles.bigPrize}>+{claim.coins_awarded} COINS</Text>
              <Text style={styles.bigPrize}>+{claim.xp_awarded} XP</Text>
              <Text style={styles.streakText}>🔥 {claim.streak}-day streak</Text>
            </BrutalCard>
            <BrutalButton
              testID="daily-done"
              title="AWESOME"
              onPress={() => router.back()}
              variant="primary"
              style={{ marginTop: SPACING.lg, alignSelf: "stretch" }}
            />
          </>
        )}
      </View>
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
  headerTitle: { fontWeight: "900", color: "#0A0A0A", letterSpacing: 1, fontSize: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: SPACING.lg },
  coin: { width: 140, height: 140 },
  title: { fontSize: 32, fontWeight: "900", letterSpacing: -1, textAlign: "center", marginTop: SPACING.md },
  sub: { fontSize: 15, fontWeight: "700", marginTop: 6 },
  rewardLine: { fontSize: 15, fontWeight: "800", marginTop: 4 },
  bigPrize: { fontSize: 30, fontWeight: "900", color: "#0A0A0A", textAlign: "center", letterSpacing: -1 },
  streakText: { fontSize: 16, fontWeight: "900", color: "#0A0A0A", textAlign: "center", marginTop: 10 },
});
