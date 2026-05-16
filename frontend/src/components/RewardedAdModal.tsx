import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, GRADIENTS, RADIUS, SPACING } from "@/src/theme";
import { BrutalButton, BrutalCard } from "@/src/components/Brutal";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/contexts/AuthContext";

type AdResult = { xp_awarded: number; coins_awarded: number };

type Props = {
  visible: boolean;
  onClose: () => void;
};

const AD_DURATION_MS = 5000;

export const RewardedAdModal: React.FC<Props> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { refresh } = useAuth();
  const [phase, setPhase] = useState<"intro" | "playing" | "done" | "error">("intro");
  const [remaining, setRemaining] = useState(AD_DURATION_MS);
  const [result, setResult] = useState<AdResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      setPhase("intro");
      setRemaining(AD_DURATION_MS);
      setResult(null);
      setErr(null);
      progress.setValue(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [visible, progress]);

  const startAd = () => {
    setPhase("playing");
    const started = Date.now();
    Animated.timing(progress, {
      toValue: 1,
      duration: AD_DURATION_MS,
      useNativeDriver: false,
    }).start();
    timerRef.current = setInterval(() => {
      const left = Math.max(0, AD_DURATION_MS - (Date.now() - started));
      setRemaining(left);
      if (left <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        claim();
      }
    }, 100);
  };

  const claim = async () => {
    try {
      const r = await api.post<any>("/rewards/watch-ad");
      setResult({ xp_awarded: r.xp_awarded, coins_awarded: r.coins_awarded });
      setPhase("done");
      await refresh();
    } catch (e: any) {
      setErr(e.message || "Couldn't claim reward");
      setPhase("error");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {phase === "intro" && (
            <View style={{ alignItems: "center" }}>
              <View style={styles.iconWrap}>
                <LinearGradient colors={GRADIENTS.warm} style={StyleSheet.absoluteFill} />
                <Ionicons name="play-circle" size={44} color="#fff" />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Watch a quick ad</Text>
              <Text style={[styles.sub, { color: colors.textMuted }]}>
                Earn <Text style={{ fontWeight: "900", color: colors.warning }}>+50 coins</Text> &{" "}
                <Text style={{ fontWeight: "900", color: colors.primary }}>+40 XP</Text> instantly.
                Once per hour.
              </Text>
              <View style={{ width: "100%", gap: 10, marginTop: SPACING.md }}>
                <BrutalButton
                  testID="watch-ad-start"
                  title="Watch ad (5s)"
                  onPress={startAd}
                  gradient="warm"
                  icon={<Ionicons name="play" size={16} color="#fff" />}
                />
                <BrutalButton title="Maybe later" variant="outline" onPress={onClose} />
              </View>
            </View>
          )}

          {phase === "playing" && (
            <View style={{ alignItems: "center" }}>
              <View style={[styles.adFake, { backgroundColor: colors.surfaceAlt }]}>
                <LinearGradient colors={GRADIENTS.cool} style={StyleSheet.absoluteFill} />
                <Ionicons name="sparkles" size={48} color="#fff" />
                <Text style={styles.adText}>Sponsored</Text>
              </View>
              <Text style={[styles.timer, { color: colors.text }]}>
                {Math.ceil(remaining / 1000)}s
              </Text>
              <View style={[styles.barOuter, { backgroundColor: colors.surfaceAlt }]}>
                <Animated.View
                  style={[
                    styles.barInner,
                    {
                      backgroundColor: colors.primary,
                      width: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.sub, { color: colors.textMuted, marginTop: 10 }]}>
                Don&apos;t close — your reward is coming!
              </Text>
            </View>
          )}

          {phase === "done" && result && (
            <View style={{ alignItems: "center" }}>
              <View style={[styles.iconWrap]}>
                <LinearGradient colors={GRADIENTS.success} style={StyleSheet.absoluteFill} />
                <Ionicons name="trophy" size={44} color="#fff" />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Reward claimed!</Text>
              <BrutalCard style={{ width: "100%", marginTop: 12 }}>
                <Text style={[styles.row, { color: colors.text }]}>
                  +{result.coins_awarded} coins · +{result.xp_awarded} XP
                </Text>
              </BrutalCard>
              <BrutalButton
                testID="watch-ad-done"
                title="Awesome"
                onPress={onClose}
                style={{ width: "100%", marginTop: SPACING.md }}
              />
            </View>
          )}

          {phase === "error" && (
            <View style={{ alignItems: "center" }}>
              <Ionicons name="alert-circle" size={48} color={colors.danger} />
              <Text style={[styles.title, { color: colors.text }]}>Hold on</Text>
              <Text style={[styles.sub, { color: colors.textMuted, textAlign: "center" }]}>
                {err}
              </Text>
              <BrutalButton title="OK" variant="outline" onPress={onClose} style={{ width: "100%", marginTop: 16 }} />
            </View>
          )}

          <Pressable style={styles.closeBtn} onPress={onClose} testID="watch-ad-close">
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: SPACING.lg },
  sheet: {
    width: "100%",
    maxWidth: 380,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 999,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5, marginBottom: 6 },
  sub: { fontSize: 14, fontWeight: "500", textAlign: "center" },
  adFake: {
    width: 220,
    height: 140,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  adText: { color: "#fff", fontWeight: "800", marginTop: 6, letterSpacing: 1 },
  timer: { fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  barOuter: { width: "100%", height: 8, borderRadius: 999, overflow: "hidden", marginTop: 10 },
  barInner: { height: "100%", borderRadius: 999 },
  row: { fontSize: 16, fontWeight: "800", textAlign: "center" },
  closeBtn: { position: "absolute", top: 12, right: 12, padding: 8 },
});
