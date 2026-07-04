export const brandMindTokens = Object.freeze({
  colors: {
    primaryBackground: "#05040A",
    secondaryBackground: "#090811",
    surface: "#0F0D18",
    surfaceElevated: "#161321",
    brandPurple: "#7C3AED",
    brandPurpleHover: "#6D28D9",
    brandPurpleSoft: "rgba(124, 58, 237, 0.16)",
    textPrimary: "#F8FAFC",
    textSecondary: "#A1A1AA",
    textMuted: "#71717A",
    success: "#34D399",
    warning: "#FACC15",
    error: "#F43F5E",
    info: "#38BDF8",
    border: "rgba(255, 255, 255, 0.10)",
    divider: "rgba(255, 255, 255, 0.06)",
  },
  typography: {
    fontFamily: "'Sora', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    weights: { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
    sizes: {
      displayXL: { size: "clamp(2.5rem, 5vw, 3rem)", lineHeight: 1.08, weight: 800 },
      display: { size: "clamp(2.125rem, 4vw, 2.5rem)", lineHeight: 1.1, weight: 700 },
      headingXL: { size: "2rem", lineHeight: 1.16, weight: 700 },
      heading: { size: "1.5rem", lineHeight: 1.25, weight: 600 },
      subheading: { size: "1.25rem", lineHeight: 1.3, weight: 600 },
      body: { size: "1rem", lineHeight: 1.6, weight: 400 },
      caption: { size: "0.8125rem", lineHeight: 1.55, weight: 400 },
      tiny: { size: "0.6875rem", lineHeight: 1.45, weight: 600 },
    },
  },
  spacing: { 4: "0.25rem", 8: "0.5rem", 12: "0.75rem", 16: "1rem", 24: "1.5rem", 32: "2rem", 40: "2.5rem", 48: "3rem", 64: "4rem", 80: "5rem", 96: "6rem" },
  radius: { 8: "0.5rem", 12: "0.75rem", 16: "1rem", 20: "1.25rem" },
  shadows: {
    sm: "0 8px 24px rgba(0, 0, 0, 0.22)",
    md: "0 16px 48px rgba(0, 0, 0, 0.28)",
    lg: "0 24px 80px rgba(0, 0, 0, 0.32)",
    xl: "0 32px 120px rgba(0, 0, 0, 0.42)",
  },
});

export default brandMindTokens;
