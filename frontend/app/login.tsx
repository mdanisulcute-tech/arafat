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
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrutalButton, BrutalCard } from "@/src/components/Brutal";
import { AnimatedEntrance } from "@/src/components/AnimatedEntrance";
import { useTheme, RADIUS, SPACING, GRADIENTS } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { api } from "@/src/api/client";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const { colors, mode } = useTheme();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const onLogin = async () => {
    setErr(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const onForgot = async () => {
    if (!email.trim()) {
      Alert.alert("Forgot password", "Enter your email above first.");
      return;
    }
    try {
      const r: any = await api.post("/auth/forgot-password", { email: email.trim() }, false);
      Alert.alert("Check your email", r.message || "Reset link sent");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={mode === "dark" ? ["#1E1B4B", "#0A0A14"] : ["#EDE9FE", "#F5F4FB"]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <AnimatedEntrance from="top" delay={50}>
              <View style={styles.brand}>
                <View style={styles.logoMark}>
                  <LinearGradient colors={GRADIENTS.primary} style={StyleSheet.absoluteFill} />
                  <Ionicons name="flash" size={28} color="#fff" />
                </View>
                <Text style={[styles.brandName, { color: colors.text }]}>EarnPlay</Text>
                <Text style={[styles.brandTag, { color: colors.textMuted }]}>
                  Play. Earn. Conquer.
                </Text>
              </View>
            </AnimatedEntrance>

            <AnimatedEntrance delay={200}>
              <BrutalCard style={{ marginTop: SPACING.xl }}>
                <Text style={[styles.heading, { color: colors.text }]}>Welcome back</Text>
                <Text style={[styles.sub, { color: colors.textMuted }]}>
                  Sign in to claim today&apos;s rewards
                </Text>

                <Text style={[styles.label, { color: colors.textMuted }]}>EMAIL</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    testID="login-email-input"
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
                    testID="login-password-input"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPw}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSubtle}
                    style={[styles.input, { color: colors.text }]}
                  />
                  <TouchableOpacity onPress={() => setShowPw((s) => !s)}>
                    <Ionicons
                      name={showPw ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                {err && (
                  <View style={[styles.errBox, { backgroundColor: `${colors.danger}15`, borderColor: colors.danger }]}>
                    <Ionicons name="alert-circle" size={16} color={colors.danger} />
                    <Text testID="login-error" style={{ color: colors.danger, marginLeft: 6, fontWeight: "700", flex: 1 }}>
                      {err}
                    </Text>
                  </View>
                )}

                <TouchableOpacity onPress={onForgot} testID="forgot-password-link" style={{ alignSelf: "flex-end", marginTop: 8 }}>
                  <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>

                <BrutalButton
                  testID="login-submit-button"
                  title="Sign in"
                  onPress={onLogin}
                  loading={busy}
                  size="lg"
                  style={{ marginTop: SPACING.md }}
                />

                <View style={styles.dividerRow}>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dividerText, { color: colors.textSubtle }]}>OR</Text>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                </View>

                <BrutalButton
                  testID="fill-demo-button"
                  title="Continue with demo account"
                  variant="outline"
                  onPress={() => {
                    setEmail("demo@earnplay.app");
                    setPassword("Demo1234!");
                  }}
                />

                <View style={styles.bottomRow}>
                  <Text style={{ color: colors.textMuted, fontWeight: "600" }}>New here? </Text>
                  <Link href="/register" asChild>
                    <TouchableOpacity testID="go-to-register">
                      <Text style={{ color: colors.primary, fontWeight: "800" }}>Create account</Text>
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
  brandName: { fontSize: 32, fontWeight: "900", letterSpacing: -1 },
  brandTag: { fontSize: 14, fontWeight: "600", marginTop: 4, letterSpacing: 0.6 },
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
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: SPACING.md, gap: 10 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: SPACING.md },
});
