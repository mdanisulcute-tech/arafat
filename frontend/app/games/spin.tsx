import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrutalButton, BrutalCard } from "@/src/components/Brutal";
import { useTheme, SPACING } from "@/src/theme";
import { api } from "@/src/api/client";
import { SpinResult } from "@/src/types";
import { useAuth } from "@/src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const WHEEL =
  "https://static.prod-images.emergentagent.com/jobs/c89ed141-cb60-4b53-9383-d3ddc653989d/images/0c66e5ec0986a25fa8c10a53d1196b4ecee940a370b9eaabf3cddf8515e1dd03.png";

const NUM_SLICES = 8;
const SLICE_DEG = 360 / NUM_SLICES;

export default function SpinScreen() {
  const { colors } = useTheme();
  const { refresh } = useAuth();
  const router = useRouter();
  const rotation = useRef(new Animated.Value(0)).current;
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const totalRotation = useRef(0);

  const spin = async () => {
    if (spinning) return;
    setErr(null);
    setResult(null);
    setSpinning(true);
    try {
      const r = await api.post<SpinResult>("/games/spin");
      // Compute target: 5 full turns + landing slice
      const targetSlice = r.prize_index;
      const targetDeg = 360 * 5 + (360 - targetSlice * SLICE_DEG - SLICE_DEG / 2);
      totalRotation.current += targetDeg;

      Animated.timing(rotation, {
        toValue: totalRotation.current,
        duration: 4000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(async () => {
        setResult(r);
        setSpinning(false);
        await refresh();
      });
    } catch (e: any) {
      setErr(e.message || "Spin failed");
      setSpinning(false);
    }
  };

  const rotateStyle = {
    transform: [
      {
        rotate: rotation.interpolate({
          inputRange: [0, 360],
          outputRange: ["0deg", "360deg"],
        }),
      },
    ],
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.accent }]} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} testID="spin-close">
          <Ionicons name="close-circle" size={32} color="#0A0A0A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>WHEEL OF LUCK</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.center}>
        <View style={[styles.pointer, { borderTopColor: colors.border }]} />
        <Animated.View style={rotateStyle}>
          <Image source={{ uri: WHEEL }} style={styles.wheel} />
        </Animated.View>

        <BrutalButton
          testID="spin-button"
          title={spinning ? "SPINNING…" : "SPIN!"}
          onPress={spin}
          loading={spinning}
          variant="primary"
          style={{ marginTop: SPACING.xl, paddingHorizontal: 56 }}
        />

        {err && (
          <BrutalCard background={colors.danger} style={{ marginTop: SPACING.md }}>
            <Text style={{ color: "#0A0A0A", fontWeight: "800" }}>{err}</Text>
          </BrutalCard>
        )}

        {result && !spinning && (
          <BrutalCard background={colors.warning} style={{ marginTop: SPACING.lg, alignItems: "center" }} testID="spin-result">
            <Text style={styles.prizeLabel}>YOU WON</Text>
            <Text style={styles.prizeBig}>{result.prize_label}</Text>
            <Text style={styles.prizeSub}>
              +{result.coins_awarded} coins · +{result.xp_awarded} XP
            </Text>
          </BrutalCard>
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
  wheel: { width: 300, height: 300 },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderTopWidth: 24,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginBottom: -10,
    zIndex: 5,
  },
  prizeLabel: { fontSize: 11, fontWeight: "900", color: "#0A0A0A", letterSpacing: 1.6 },
  prizeBig: { fontSize: 32, fontWeight: "900", color: "#0A0A0A", letterSpacing: -1, marginTop: 4 },
  prizeSub: { fontSize: 14, fontWeight: "800", color: "#0A0A0A", marginTop: 4 },
});
