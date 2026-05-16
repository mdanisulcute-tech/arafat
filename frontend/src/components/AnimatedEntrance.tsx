import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
  from?: "bottom" | "top" | "none";
  distance?: number;
};

export const AnimatedEntrance: React.FC<Props> = ({
  children,
  delay = 0,
  style,
  from = "bottom",
  distance = 14,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(from === "none" ? 0 : from === "top" ? -distance : distance))
    .current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translate, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        speed: 14,
        bounciness: 4,
      }),
    ]).start();
  }, [opacity, translate, delay]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY: translate }] }, style]}>
      {children}
    </Animated.View>
  );
};
