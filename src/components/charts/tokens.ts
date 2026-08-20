"use client";

import { useTheme } from "@/components/layout/ThemeProvider";

/**
 * Visualisation tokens.
 *
 * Every palette below was validated with the data-viz palette checker against
 * this application's own light (#ffffff) and dark (#12151d) chart surfaces:
 *  - categorical 2-slot set: all checks pass in both modes
 *  - 4-step ordinal ramp: monotone lightness, visible step gaps, light end
 *    clears the surface in both modes
 */
export interface VizTokens {
  /** Categorical slots, assigned in fixed order and never cycled. */
  series: [string, string];
  /** Single-hue ordinal ramp, light → dark. */
  ordinal: [string, string, string, string];
  /** Single-series hue for one-measure charts. */
  single: string;
  grid: string;
  axis: string;
  ink: string;
  inkMuted: string;
  surface: string;
  border: string;
}

const LIGHT: VizTokens = {
  series: ["#2a78d6", "#eb6834"],
  ordinal: ["#86b6ef", "#3987e5", "#256abf", "#104281"],
  single: "#2a78d6",
  grid: "#e6e9ef",
  axis: "#c3c8d2",
  ink: "#0f172a",
  inkMuted: "#64748b",
  surface: "#ffffff",
  border: "rgba(15,23,42,0.10)",
};

const DARK: VizTokens = {
  series: ["#3987e5", "#d95926"],
  ordinal: ["#cde2fb", "#86b6ef", "#3987e5", "#184f95"],
  single: "#3987e5",
  grid: "#232936",
  axis: "#333b4d",
  ink: "#e9edf5",
  inkMuted: "#93a0b5",
  surface: "#12151d",
  border: "rgba(255,255,255,0.10)",
};

export function useViz(): VizTokens {
  const { theme } = useTheme();
  return theme === "dark" ? DARK : LIGHT;
}
