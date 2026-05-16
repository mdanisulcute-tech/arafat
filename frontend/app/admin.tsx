import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BrutalCard, BrutalButton } from "@/src/components/Brutal";
import { AnimatedEntrance } from "@/src/components/AnimatedEntrance";
import { useTheme, SPACING, RADIUS } from "@/src/theme";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/contexts/AuthContext";

type AdminUser = {
  id: string;
  email: string;
  username: string;
  avatar: string;
  xp: number;
  coins: number;
  level: number;
  is_admin: boolean;
  is_banned: boolean;
  games_played: number;
  created_at: string;
};

export default function AdminScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const list = await api.get<AdminUser[]>("/admin/users");
      setUsers(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!user?.is_admin) {
        Alert.alert("Access denied", "Admin only.");
        router.back();
        return;
      }
      load();
    }, [user, router, load])
  );

  const toggleBan = async (u: AdminUser) => {
    Alert.alert(
      u.is_banned ? "Unban user?" : "Ban user?",
      `@${u.username} will be ${u.is_banned ? "restored" : "blocked from logging in"}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: u.is_banned ? "Unban" : "Ban",
          style: u.is_banned ? "default" : "destructive",
          onPress: async () => {
            try {
              await api.post("/admin/ban", { user_id: u.id, banned: !u.is_banned });
              await load();
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ]
    );
  };

  const grant = async (u: AdminUser) => {
    try {
      await api.post("/admin/grant", { user_id: u.id, xp: 100, coins: 100 });
      Alert.alert("Granted", `@${u.username} +100 XP, +100 coins`);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  if (!user?.is_admin) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} testID="admin-close">
          <Ionicons name="close-circle" size={30} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Admin</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>{users.length} total users</Text>
        </View>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 80 }}
          renderItem={({ item, index }) => (
            <AnimatedEntrance delay={index * 40}>
              <BrutalCard style={{ marginBottom: 10 }} testID={`admin-user-${item.username}`}>
                <View style={styles.row}>
                  <Image source={{ uri: item.avatar }} style={[styles.av, { borderColor: colors.border }]} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                        @{item.username}
                      </Text>
                      {item.is_admin && (
                        <View style={[styles.badge, { backgroundColor: `${colors.warning}25` }]}>
                          <Text style={[styles.badgeTxt, { color: colors.warning }]}>ADMIN</Text>
                        </View>
                      )}
                      {item.is_banned && (
                        <View style={[styles.badge, { backgroundColor: `${colors.danger}25` }]}>
                          <Text style={[styles.badgeTxt, { color: colors.danger }]}>BANNED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.meta, { color: colors.textMuted }]}>
                      LV {item.level} · {item.xp.toLocaleString()} XP · {item.coins} coins
                    </Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <BrutalButton
                    title="+100"
                    variant="outline"
                    size="md"
                    onPress={() => grant(item)}
                    icon={<Ionicons name="add-circle-outline" size={14} color={colors.text} />}
                    style={{ flex: 1 }}
                  />
                  <BrutalButton
                    title={item.is_banned ? "Unban" : "Ban"}
                    variant="outline"
                    size="md"
                    onPress={() => toggleBan(item)}
                    icon={
                      <Ionicons
                        name={item.is_banned ? "lock-open" : "ban"}
                        size={14}
                        color={item.is_banned ? colors.success : colors.danger}
                      />
                    }
                    textStyle={{ color: item.is_banned ? colors.success : colors.danger }}
                    style={{ flex: 1 }}
                    disabled={item.is_admin}
                  />
                </View>
              </BrutalCard>
            </AnimatedEntrance>
          )}
        />
      )}
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
  title: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5, textAlign: "center" },
  sub: { fontWeight: "600", fontSize: 12, textAlign: "center", marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center" },
  av: { width: 44, height: 44, borderRadius: 999, borderWidth: 1.5 },
  name: { fontSize: 16, fontWeight: "800", maxWidth: 180 },
  meta: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  badgeTxt: { fontSize: 9, fontWeight: "900", letterSpacing: 0.6 },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
});
