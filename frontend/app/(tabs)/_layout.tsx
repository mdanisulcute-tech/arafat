import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet } from "react-native";
import { useTheme, hardShadow } from "@/src/theme";

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          hardShadow(colors.border, 4),
        ],
        tabBarItemStyle: { paddingTop: 8 },
        tabBarButtonTestID: `tab-button-${route.name}`,
        tabBarIcon: ({ color, focused }) => {
          const map: Record<string, any> = {
            index: focused ? "home" : "home-outline",
            games: focused ? "game-controller" : "game-controller-outline",
            chat: focused ? "chatbubbles" : "chatbubbles-outline",
            leaderboard: focused ? "trophy" : "trophy-outline",
            profile: focused ? "person" : "person-outline",
          };
          return (
            <Ionicons
              name={map[route.name] || "ellipse"}
              size={focused ? 28 : 24}
              color={color}
            />
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
    borderWidth: 2,
    paddingHorizontal: 8,
  },
});
