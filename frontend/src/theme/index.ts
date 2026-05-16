import { useColorScheme } from "react-native";

export type ThemeMode = "light" | "dark";

export const COLORS = {
  light: {
    background: "#F5F4FB",
    surface: "#FFFFFF",
    surfaceAlt: "#F0EEF8",
    primary: "#7C3AED",
    primaryDark: "#5B21B6",
    secondary: "#EC4899",
    accent: "#06B6D4",
    warning: "#F59E0B",
    success: "#10B981",
    danger: "#EF4444",
    text: "#0F172A",
    textMuted: "#64748B",
    textSubtle: "#94A3B8",
    border: "#E2E8F0",
    borderStrong: "#CBD5E1",
    shadow: "#0F172A",
  },
  dark: {
    background: "#0A0A14",
    surface: "#13131F",
    surfaceAlt: "#1C1C2E",
    primary: "#A78BFA",
    primaryDark: "#7C3AED",
    secondary: "#F472B6",
    accent: "#22D3EE",
    warning: "#FBBF24",
    success: "#34D399",
    danger: "#F87171",
    text: "#F8FAFC",
    textMuted: "#94A3B8",
    textSubtle: "#64748B",
    border: "#2A2A40",
    borderStrong: "#3A3A55",
    shadow: "#000000",
  },
};

export const GRADIENTS = {
  primary: ["#7C3AED", "#EC4899"] as const,
  secondary: ["#A78BFA", "#F472B6"] as const,
  cyan: ["#06B6D4", "#7C3AED"] as const,
  warm: ["#F59E0B", "#EC4899"] as const,
  success: ["#10B981", "#06B6D4"] as const,
  cool: ["#6366F1", "#06B6D4"] as const,
  sunset: ["#F472B6", "#FBBF24"] as const,
  night: ["#1E1B4B", "#7C3AED"] as const,
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const RADIUS = { sm: 8, md: 12, lg: 20, xl: 28, pill: 999 };
export const FONT = { body: "System", heading: "System" };

export function useTheme() {
  const scheme = useColorScheme();
  const mode: ThemeMode = scheme === "light" ? "light" : "dark";
  return { mode, colors: COLORS[mode] };
}

// Premium soft layered shadow (used by default)
export const softShadow = (color: string = "#0F172A", elevation: number = 8) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: Math.max(2, elevation / 2) },
  shadowOpacity: 0.12,
  shadowRadius: elevation,
  elevation,
});

// Hard offset shadow (for special CTAs / playful surfaces)
export const hardShadow = (color: string, offset = 4) => ({
  shadowColor: color,
  shadowOffset: { width: offset, height: offset },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 6,
});

// Glow effect for highlighted elements
export const glow = (color: string) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.6,
  shadowRadius: 16,
  elevation: 12,
});
