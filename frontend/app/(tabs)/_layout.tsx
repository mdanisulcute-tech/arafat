import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme, softShadow } from "@/src/theme";

export default function TabsLayout() {
  const { colors, mode } = useTheme();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: mode === "dark" ? "rgba(20,20,32,0.85)" : "rgba(255,255,255,0.85)",
            borderColor: colors.border,
          },
          softShadow(colors.shadow, 16),
        ],
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={70}
              tint={mode === "dark" ? "dark" : "light"}
              style={[StyleSheet.absoluteFill, { borderRadius: 999, overflow: "hidden" }]}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: mode === "dark" ? "rgba(20,20,32,0.95)" : "rgba(255,255,255,0.95)",
                  borderRadius: 999,
                },
              ]}
            />
          ),
        tabBarItemStyle: { paddingTop: 10 },
        tabBarButtonTestID: `tab-button-${route.name}`,
        tabBarIcon: ({ color, focused }) => {
          const map: Record<string, any> = {
            index: focused ? "home" : "home-outline",
            games: focused ? "game-controller" : "game-controller-outline",
            chat: focused ? "chatbubbles" : "chatbubbles-outline",
            leaderboard: focused ? "trophy" : "trophy-outline",
            profile: focused ? "person-circle" : "person-circle-outline",
          };
          return (
            <View style={focused ? { transform: [{ scale: 1.08 }] } : undefined}>
              <Ionicons name={map[route.name] || "ellipse"} size={focused ? 26 : 22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="games" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="leaderboard" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 24 : 16,
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    overflow: "hidden",
  },
});
