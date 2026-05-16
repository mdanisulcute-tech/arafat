import { useColorScheme } from "react-native";

export type ThemeMode = "light" | "dark";

export const COLORS = {
  light: {
    background: "#FAFAFA",
    surface: "#FFFFFF",
    primary: "#FF5C8D",
    secondary: "#B892FF",
    accent: "#00F0FF",
    warning: "#FFD800",
    success: "#00E676",
    danger: "#FF3B30",
    text: "#0A0A0A",
    textMuted: "#5B5B5B",
    border: "#0A0A0A",
    shadow: "#0A0A0A",
  },
  dark: {
    background: "#0B0C10",
    surface: "#1F2833",
    primary: "#FF5C8D",
    secondary: "#B892FF",
    accent: "#00F0FF",
    warning: "#FFD800",
    success: "#00E676",
    danger: "#FF6B6B",
    text: "#FDFDFD",
    textMuted: "#A8B0BD",
    border: "#FDFDFD",
    shadow: "#000000",
  },
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const RADIUS = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };
export const FONT = {
  body: "System",
  heading: "System",
};

export function useTheme() {
  const scheme = useColorScheme();
  const mode: ThemeMode = scheme === "light" ? "light" : "dark";
  return { mode, colors: COLORS[mode] };
}

// Neo-brutalist hard shadow
export const hardShadow = (color: string, offset = 4) => ({
  shadowColor: color,
  shadowOffset: { width: offset, height: offset },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 6,
});
