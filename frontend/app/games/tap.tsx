import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BrutalButton, BrutalCard } from "@/src/components/Brutal";
import { useTheme, SPACING, hardShadow } from "@/src/theme";
import { api } from "@/src/api/client";
import { TapResult } from "@/src/types";
import { useAuth } from "@/src/contexts/AuthContext";

const DURATION_MS = 15000;

export default function TapChallengeScreen() {
  const { colors } = useTheme();
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const [taps, setTaps] = useState(0);
  const [remaining, setRemaining] = useState(DURATION_MS);
  const [result, setResult] = useState<TapResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startedAt = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = () => {
    setTaps(0);
    setResult(null);
    setRemaining(DURATION_MS);
    startedAt.current = Date.now();
    setState("running");
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      const left = Math.max(0, DURATION_MS - elapsed);
      setRemaining(left);
      if (left <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        finish();
      }
    }, 100);
  };

  const finish = async () => {
    setState("done");
    setSubmitting(true);
    try {
      const r = await api.post<TapResult>("/games/tap/submit", {
        taps: tapsRef.current,
        duration_ms: DURATION_MS,
      });
      setResult(r);
      await refresh();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  // ref to current taps for closure in finish()
  const tapsRef = useRef(0);
  useEffect(() => {
    tapsRef.current = taps;
  }, [taps]);

  const onTap = () => {
    if (state !== "running") return;
    setTaps((t) => t + 1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 60, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const seconds = (remaining / 1000).toFixed(1);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.primary }]} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} testID="tap-close">
          <Ionicons name="close-circle" size={32} color="#0A0A0A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TAP CHALLENGE</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.center}>
        {state === "idle" && (
          <>
            <Ionicons name="flash" size={80} color="#0A0A0A" />
            <Text style={styles.bigTitle}>TAP AS FAST{"\n"}AS YOU CAN!</Text>
            <BrutalCard background={colors.surface} style={{ marginTop: SPACING.lg, alignSelf: "stretch" }}>
              <Text style={[styles.rule, { color: colors.text }]}>⏱  {DURATION_MS / 1000} second challenge</Text>
              <Text style={[styles.rule, { color: colors.text }]}>⚡  +1 XP per 5 taps</Text>
              <Text style={[styles.rule, { color: colors.text }]}>💰  +1 coin per 10 taps</Text>
              <Text style={[styles.rule, { color: colors.textMuted, marginTop: 6 }]}>
                Best: {user?.best_tap_score ?? 0} taps
              </Text>
            </BrutalCard>
            <BrutalButton
              testID="tap-start"
              title="START!"
              onPress={start}
              variant="warning"
              style={{ marginTop: SPACING.lg, alignSelf: "stretch" }}
            />
          </>
        )}

        {state === "running" && (
          <>
            <View style={[styles.timer, { backgroundColor: colors.warning, borderColor: colors.border }, hardShadow(colors.border, 3)]}>
              <Text style={styles.timerText}>{seconds}s</Text>
            </View>
            <Text style={styles.tapCount} testID="tap-count">{taps}</Text>
            <Text style={styles.tapLabel}>TAPS</Text>
            <Animated.View style={[{ transform: [{ scale }] }, { marginTop: SPACING.lg }]}>
              <TouchableOpacity
                testID="tap-button"
                activeOpacity={0.7}
                onPress={onTap}
                style={[styles.tapBtn, { backgroundColor: colors.warning, borderColor: colors.border }, hardShadow(colors.border, 6)]}
              >
                <Text style={styles.tapBtnText}>TAP!</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}

        {state === "done" && (
          <>
            <Text style={styles.bigTitle}>TIME&apos;S UP!</Text>
            <BrutalCard background={colors.warning} style={{ marginTop: SPACING.lg, alignSelf: "stretch" }} testID="tap-result">
              <Text style={styles.resultBig}>{result ? result.taps : taps} TAPS</Text>
              {result && (
                <>
                  <Text style={styles.resultLine}>+{result.xp_awarded} XP · +{result.coins_awarded} coins</Text>
                  {result.is_new_best && (
                    <Text style={styles.resultBest}>🏆 NEW BEST!</Text>
                  )}
                </>
              )}
              {submitting && (
                <Text style={{ color: "#0A0A0A", fontWeight: "700", marginTop: 6 }}>Saving…</Text>
              )}
            </BrutalCard>
            <BrutalButton
              testID="tap-again"
              title="PLAY AGAIN"
              onPress={start}
              variant="secondary"
              style={{ marginTop: SPACING.lg, alignSelf: "stretch" }}
            />
            <BrutalButton
              testID="tap-done"
              title="DONE"
              onPress={() => router.back()}
              variant="outline"
              style={{ marginTop: SPACING.sm, alignSelf: "stretch" }}
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
  bigTitle: { fontSize: 30, fontWeight: "900", letterSpacing: -1, textAlign: "center", marginTop: SPACING.md, color: "#0A0A0A" },
  rule: { fontSize: 16, fontWeight: "800", marginTop: 4 },
  timer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    marginBottom: SPACING.md,
  },
  timerText: { fontSize: 22, fontWeight: "900", color: "#0A0A0A", letterSpacing: -1 },
  tapCount: { fontSize: 96, fontWeight: "900", color: "#0A0A0A", letterSpacing: -4, lineHeight: 100 },
  tapLabel: { fontSize: 12, fontWeight: "900", color: "#0A0A0A", letterSpacing: 2 },
  tapBtn: {
    width: 200,
    height: 200,
    borderRadius: 999,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  tapBtnText: { fontSize: 36, fontWeight: "900", color: "#0A0A0A", letterSpacing: -1 },
  resultBig: { fontSize: 38, fontWeight: "900", color: "#0A0A0A", textAlign: "center", letterSpacing: -1 },
  resultLine: { fontSize: 16, fontWeight: "800", color: "#0A0A0A", textAlign: "center", marginTop: 6 },
  resultBest: { fontSize: 18, fontWeight: "900", color: "#0A0A0A", textAlign: "center", marginTop: 8 },
});
