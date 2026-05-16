import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrutalButton, BrutalCard } from "@/src/components/Brutal";
import { AnimatedEntrance } from "@/src/components/AnimatedEntrance";
import { useTheme, RADIUS, SPACING, GRADIENTS } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function RegisterScreen() {
  const { colors, mode } = useTheme();
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async () => {
    setErr(null);
    setBusy(true);
    try {
      await register(email.trim(), username.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setErr(e.message || "Could not register");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={mode === "dark" ? ["#3B0764", "#0A0A14"] : ["#FCE7F3", "#F5F4FB"]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <AnimatedEntrance from="top" delay={50}>
              <View style={styles.brand}>
                <View style={styles.logoMark}>
                  <LinearGradient colors={GRADIENTS.warm} style={StyleSheet.absoluteFill} />
                  <Ionicons name="trophy" size={28} color="#fff" />
                </View>
                <Text style={[styles.brandName, { color: colors.text }]}>Join EarnPlay</Text>
                <Text style={[styles.brandTag, { color: colors.textMuted }]}>
                  Start earning XP today
                </Text>
              </View>
            </AnimatedEntrance>

            <AnimatedEntrance delay={200}>
              <BrutalCard style={{ marginTop: SPACING.xl }}>
                <Text style={[styles.heading, { color: colors.text }]}>Create account</Text>
                <Text style={[styles.sub, { color: colors.textMuted }]}>
                  +50 coins welcome bonus
                </Text>

                <Text style={[styles.label, { color: colors.textMuted }]}>USERNAME</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    testID="register-username-input"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    placeholder="cool_player"
                    placeholderTextColor={colors.textSubtle}
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>

                <Text style={[styles.label, { color: colors.textMuted }]}>EMAIL</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    testID="register-email-input"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textSubtle}
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>

                <Text style={[styles.label, { color: colors.textMuted }]}>PASSWORD</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    testID="register-password-input"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="At least 6 characters"
                    placeholderTextColor={colors.textSubtle}
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>

                {err && (
                  <View style={[styles.errBox, { backgroundColor: `${colors.danger}15`, borderColor: colors.danger }]}>
                    <Ionicons name="alert-circle" size={16} color={colors.danger} />
                    <Text testID="register-error" style={{ color: colors.danger, marginLeft: 6, fontWeight: "700", flex: 1 }}>
                      {err}
                    </Text>
                  </View>
                )}

                <BrutalButton
                  testID="register-submit-button"
                  title="Create account"
                  onPress={onSubmit}
                  loading={busy}
                  size="lg"
                  gradient="warm"
                  style={{ marginTop: SPACING.md }}
                />

                <View style={styles.bottomRow}>
                  <Text style={{ color: colors.textMuted, fontWeight: "600" }}>Already a player? </Text>
                  <Link href="/login" asChild>
                    <TouchableOpacity testID="go-to-login">
                      <Text style={{ color: colors.primary, fontWeight: "800" }}>Sign in</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </BrutalCard>
            </AnimatedEntrance>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  brand: { alignItems: "center", marginTop: SPACING.xl },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 12,
  },
  brandName: { fontSize: 28, fontWeight: "900", letterSpacing: -0.8 },
  brandTag: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  heading: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontWeight: "500", marginTop: 4, fontSize: 14 },
  label: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginTop: SPACING.md, marginBottom: 6 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: { flex: 1, fontSize: 15, fontWeight: "500", paddingVertical: 14 },
  errBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: SPACING.md },
});
