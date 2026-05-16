import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import { hardShadow, RADIUS, SPACING, useTheme } from "@/src/theme";

type BtnProps = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "warning";
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export const BrutalButton: React.FC<BtnProps> = ({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  testID,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();
  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
        ? colors.secondary
        : variant === "warning"
          ? colors.warning
          : "transparent";
  const fg = variant === "outline" ? colors.text : "#0A0A0A";
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: colors.border,
          opacity: disabled ? 0.6 : 1,
        },
        hardShadow(colors.border, 4),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.btnText, { color: fg }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
  background?: string;
};

export const BrutalCard: React.FC<CardProps> = ({ children, style, testID, background }) => {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: background ?? colors.surface,
          borderColor: colors.border,
        },
        hardShadow(colors.border, 4),
        style,
      ]}
    >
      {children}
    </View>
  );
};

type BadgeProps = { label: string; color?: string; testID?: string };
export const BrutalBadge: React.FC<BadgeProps> = ({ label, color, testID }) => {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        styles.badge,
        { backgroundColor: color ?? colors.warning, borderColor: colors.border },
      ]}
    >
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
};

type ProgressProps = { value: number; max?: number; testID?: string };
export const Progress: React.FC<ProgressProps> = ({ value, max = 100, testID }) => {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <View
      testID={testID}
      style={[
        styles.progressOuter,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.progressInner, { width: `${pct}%`, backgroundColor: colors.secondary }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  card: {
    borderWidth: 2,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 2,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, fontWeight: "900", color: "#0A0A0A", letterSpacing: 0.5 },
  progressOuter: {
    height: 14,
    borderWidth: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressInner: { height: "100%" },
});
