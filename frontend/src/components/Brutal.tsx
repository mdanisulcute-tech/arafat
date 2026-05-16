import React, { useRef } from "react";
import {
  Text,
  Pressable,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GRADIENTS, RADIUS, SPACING, softShadow, useTheme } from "@/src/theme";

// -------------------- BrutalButton (premium animated CTA) --------------------
type BtnProps = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "warning" | "ghost" | "gradient";
  gradient?: keyof typeof GRADIENTS;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  size?: "md" | "lg";
};

export const BrutalButton: React.FC<BtnProps> = ({
  title,
  onPress,
  variant = "primary",
  gradient = "primary",
  loading,
  disabled,
  testID,
  style,
  textStyle,
  icon,
  size = "md",
}) => {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
  };

  const useGradient = variant === "primary" || variant === "gradient";
  const bg =
    variant === "secondary"
      ? colors.surface
      : variant === "warning"
        ? colors.warning
        : variant === "outline" || variant === "ghost"
          ? "transparent"
          : colors.primary;
  const fg =
    variant === "primary" || variant === "gradient"
      ? "#FFFFFF"
      : variant === "warning"
        ? "#1F1300"
        : colors.text;
  const borderColor = variant === "outline" ? colors.borderStrong : "transparent";
  const padV = size === "lg" ? 18 : 15;
  const padH = size === "lg" ? 28 : 22;

  const Inner = (
    <Animated.View
      style={[
        styles.btn,
        {
          backgroundColor: useGradient ? "transparent" : bg,
          borderColor,
          borderWidth: variant === "outline" ? 1.5 : 0,
          paddingVertical: padV,
          paddingHorizontal: padH,
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale }],
        },
        variant !== "ghost" && variant !== "outline" ? softShadow(colors.shadow, 10) : undefined,
        style,
      ]}
    >
      <View style={styles.btnRow}>
        {loading ? (
          <ActivityIndicator color={fg} size="small" />
        ) : (
          <>
            {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
            <Text style={[styles.btnText, { color: fg, fontSize: size === "lg" ? 17 : 15 }, textStyle]}>
              {title}
            </Text>
          </>
        )}
      </View>
    </Animated.View>
  );

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
    >
      {useGradient ? (
        <View style={[{ borderRadius: RADIUS.lg, overflow: "hidden" }, softShadow(colors.shadow, 12)]}>
          <LinearGradient colors={GRADIENTS[gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {Inner}
          </LinearGradient>
        </View>
      ) : (
        Inner
      )}
    </Pressable>
  );
};

// -------------------- Card (soft premium) --------------------
type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
  background?: string;
  onPress?: () => void;
  flat?: boolean;
};

export const BrutalCard: React.FC<CardProps> = ({ children, style, testID, background, onPress, flat }) => {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const content = (
    <Animated.View
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: background ?? colors.surface,
          borderColor: colors.border,
          transform: [{ scale }],
        },
        flat ? undefined : softShadow(colors.shadow, 8),
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 60, bounciness: 0 }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start()
      }
    >
      {content}
    </Pressable>
  );
};

// -------------------- GradientCard --------------------
type GradientCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
  gradient?: keyof typeof GRADIENTS;
  onPress?: () => void;
};

export const GradientCard: React.FC<GradientCardProps> = ({
  children,
  style,
  testID,
  gradient = "primary",
  onPress,
}) => {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const inner = (
    <Animated.View
      testID={testID}
      style={[
        { borderRadius: RADIUS.lg, overflow: "hidden", transform: [{ scale }] },
        softShadow(colors.shadow, 14),
        style,
      ]}
    >
      <LinearGradient
        colors={GRADIENTS[gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCardInner}
      >
        {children}
      </LinearGradient>
    </Animated.View>
  );

  if (!onPress) return inner;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 60, bounciness: 0 }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start()
      }
    >
      {inner}
    </Pressable>
  );
};

// -------------------- Pill Badge --------------------
type BadgeProps = { label: string; color?: string; textColor?: string; testID?: string; small?: boolean };
export const BrutalBadge: React.FC<BadgeProps> = ({ label, color, textColor, testID, small }) => {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        styles.badge,
        {
          backgroundColor: color ?? `${colors.primary}1F`,
          paddingVertical: small ? 3 : 5,
          paddingHorizontal: small ? 8 : 10,
        },
      ]}
    >
      <Text style={[styles.badgeText, { color: textColor ?? colors.primary, fontSize: small ? 10 : 11 }]}>
        {label}
      </Text>
    </View>
  );
};

// -------------------- Progress Bar --------------------
type ProgressProps = { value: number; max?: number; testID?: string; gradient?: keyof typeof GRADIENTS };
export const Progress: React.FC<ProgressProps> = ({ value, max = 100, testID, gradient = "primary" }) => {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const widthAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [pct, widthAnim]);

  return (
    <View
      testID={testID}
      style={[styles.progressOuter, { backgroundColor: colors.surfaceAlt }]}
    >
      <Animated.View
        style={[
          styles.progressInner,
          {
            width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
          },
        ]}
      >
        <LinearGradient
          colors={GRADIENTS[gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  btnRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  btnText: { fontWeight: "800", letterSpacing: 0.2 },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  gradientCardInner: { padding: SPACING.md, borderRadius: RADIUS.lg },
  badge: {
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  badgeText: { fontWeight: "800", letterSpacing: 0.6 },
  progressOuter: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressInner: { height: "100%", borderRadius: 999, overflow: "hidden" },
});
