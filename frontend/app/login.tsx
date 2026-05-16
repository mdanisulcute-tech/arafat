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
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrutalButton, BrutalCard } from "@/src/components/Brutal";
import { useTheme, RADIUS, SPACING, hardShadow } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { api } from "@/src/api/client";

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
      Alert.alert("Forgot password", "Please enter your email above first.");
      return;
    }
    try {
      const r: any = await api.post("/auth/forgot-password", { email: email.trim() }, false);
      Alert.alert("Check your email", r.message || "Reset link sent");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const fillDemo = () => {
    setEmail("demo@earnplay.app");
    setPassword("Demo1234!");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.secondary }]} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.logo, { color: "#0A0A0A" }]}>EARN</Text>
            <Text style={[styles.logo2, { color: colors.warning }]}>PLAY</Text>
            <Text style={styles.tagline}>Play. Earn. Conquer.</Text>
          </View>

          <BrutalCard background={colors.surface} style={{ marginTop: SPACING.lg }}>
            <Text style={[styles.heading, { color: colors.text }]}>Welcome back</Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>
              Log in to claim today&apos;s rewards
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>EMAIL</Text>
            <TextInput
              testID="login-email-input"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
              ]}
            />

            <Text style={[styles.label, { color: colors.text }]}>PASSWORD</Text>
            <TextInput
              testID="login-password-input"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
              ]}
            />

            {err && (
              <Text testID="login-error" style={{ color: colors.danger, marginTop: 6, fontWeight: "700" }}>
                {err}
              </Text>
            )}

            <TouchableOpacity onPress={onForgot} testID="forgot-password-link">
              <Text style={[styles.forgot, { color: colors.text }]}>Forgot password?</Text>
            </TouchableOpacity>

            <BrutalButton
              testID="login-submit-button"
              title="LOG IN"
              onPress={onLogin}
              loading={busy}
              style={{ marginTop: SPACING.md }}
            />

            <BrutalButton
              testID="fill-demo-button"
              title="Try demo account"
              variant="warning"
              onPress={fillDemo}
              style={{ marginTop: SPACING.sm }}
            />

            <View style={styles.row}>
              <Text style={{ color: colors.textMuted, fontWeight: "600" }}>New here? </Text>
              <Link href="/register" asChild>
                <TouchableOpacity testID="go-to-register">
                  <Text style={{ color: colors.primary, fontWeight: "900" }}>Create account</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </BrutalCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  header: { alignItems: "center", marginTop: SPACING.lg },
  logo: { fontSize: 56, fontWeight: "900", letterSpacing: -2 },
  logo2: { fontSize: 56, fontWeight: "900", letterSpacing: -2, marginTop: -10 },
  tagline: { color: "#0A0A0A", fontSize: 14, fontWeight: "700", marginTop: 8, letterSpacing: 2 },
  heading: { fontSize: 26, fontWeight: "900" },
  sub: { marginBottom: SPACING.md, marginTop: 4, fontWeight: "600" },
  label: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginTop: SPACING.sm, marginBottom: 6 },
  input: {
    borderWidth: 2,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "600",
  },
  forgot: { fontWeight: "700", alignSelf: "flex-end", marginTop: 8, textDecorationLine: "underline" },
  row: { flexDirection: "row", justifyContent: "center", marginTop: SPACING.md },
});
