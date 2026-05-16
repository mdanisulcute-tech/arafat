import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { RADIUS, useTheme } from "@/src/theme";

type SkeletonProps = {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

export const Skeleton: React.FC<SkeletonProps> = ({ width = "100%", height = 16, radius = 8, style }) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width: width as any, height, borderRadius: radius, backgroundColor: colors.surfaceAlt, opacity },
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC<{ height?: number; style?: ViewStyle }> = ({ height = 110, style }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: RADIUS.lg,
          padding: 16,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          height,
          justifyContent: "center",
          gap: 10,
        },
        style,
      ]}
    >
      <Skeleton width="60%" height={14} />
      <Skeleton width="90%" height={10} />
      <Skeleton width="40%" height={10} />
    </View>
  );
};

const styles = StyleSheet.create({
  base: { overflow: "hidden" },
});
