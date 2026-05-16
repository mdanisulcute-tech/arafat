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
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrutalButton, BrutalCard } from "@/src/components/Brutal";
import { useTheme, RADIUS, SPACING } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";

export default function RegisterScreen() {
  const { colors } = useTheme();
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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.primary }]} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.logo, { color: "#0A0A0A" }]}>JOIN THE PLAY</Text>
          <BrutalCard background={colors.surface}>
            <Text style={[styles.heading, { color: colors.text }]}>Create account</Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>Start earning XP & coins today</Text>

            <Text style={[styles.label, { color: colors.text }]}>USERNAME</Text>
            <TextInput
              testID="register-username-input"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="cool_player"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
            />

            <Text style={[styles.label, { color: colors.text }]}>EMAIL</Text>
            <TextInput
              testID="register-email-input"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
            />

            <Text style={[styles.label, { color: colors.text }]}>PASSWORD</Text>
            <TextInput
              testID="register-password-input"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
            />

            {err && (
              <Text testID="register-error" style={{ color: colors.danger, marginTop: 6, fontWeight: "700" }}>
                {err}
              </Text>
            )}

            <BrutalButton
              testID="register-submit-button"
              title="CREATE ACCOUNT"
              onPress={onSubmit}
              loading={busy}
              style={{ marginTop: SPACING.md }}
            />

            <View style={styles.row}>
              <Text style={{ color: colors.textMuted, fontWeight: "600" }}>Already a player? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity testID="go-to-login">
                  <Text style={{ color: colors.primary, fontWeight: "900" }}>Log in</Text>
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
  logo: { fontSize: 38, fontWeight: "900", letterSpacing: -1, marginTop: SPACING.md, marginBottom: SPACING.md, textAlign: "center" },
  heading: { fontSize: 26, fontWeight: "900" },
  sub: { marginBottom: SPACING.md, marginTop: 4, fontWeight: "600" },
  label: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginTop: SPACING.sm, marginBottom: 6 },
  input: { borderWidth: 2, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "center", marginTop: SPACING.md },
});
