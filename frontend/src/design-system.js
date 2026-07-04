export const bmDesignSystem = Object.freeze({
  name: "BrandMind Premium AI OS",
  status: "official",
  legacyPolicy: "All non-BM components are legacy wrappers or shadcn primitives.",
  colors: {
    background: "var(--bm-color-primary-background)",
    backgroundSoft: "var(--bm-color-secondary-background)",
    surface: "var(--bm-color-surface)",
    surfaceElevated: "var(--bm-color-surface-elevated)",
    brand: "var(--bm-color-brand-purple)",
    brandHover: "var(--bm-color-brand-purple-hover)",
    brandSoft: "var(--bm-color-brand-purple-soft)",
    text: "var(--bm-color-text-primary)",
    textSecondary: "var(--bm-color-text-secondary)",
    textMuted: "var(--bm-color-text-muted)",
    success: "var(--bm-color-success)",
    warning: "var(--bm-color-warning)",
    error: "var(--bm-color-error)",
    info: "var(--bm-color-info)",
    border: "var(--bm-color-border)",
    divider: "var(--bm-color-divider)",
  },
  radius: {
    appShell: "var(--bm-radius-app-shell)",
    card: "var(--bm-radius-card)",
    button: "var(--bm-radius-button)",
    input: "var(--bm-radius-input)",
    badge: "var(--bm-radius-badge)",
    dialog: "var(--bm-radius-dialog)",
  },
  motion: {
    ease: "var(--bm-motion-ease-standard)",
    easeEmphasized: "var(--bm-motion-ease-emphasized)",
    page: "var(--bm-motion-duration-page)",
    hover: "var(--bm-motion-duration-hover)",
    dialog: "var(--bm-motion-duration-dialog)",
    tooltip: "var(--bm-motion-duration-tooltip)",
    dropdown: "var(--bm-motion-duration-dropdown)",
    loading: "var(--bm-motion-duration-loading)",
    feedback: "var(--bm-motion-duration-feedback)",
  },
  components: [
    "BMPage", "BMHero", "BMSection", "BMCard", "BMMetricCard", "BMButton",
    "BMInput", "BMTextarea", "BMSelect", "BMBadge", "BMDialog", "BMEmptyState",
    "BMTable", "BMStat", "BMToolbar", "BMHeader",
  ],
});

export const bmAppearanceModes = Object.freeze({
  minimal: { ambientOrb: false, cursorTrail: false, pageParticles: false, ceoOrb: false },
  standard: { ambientOrb: true, cursorTrail: false, pageParticles: true, ceoOrb: true },
  immersive: { ambientOrb: true, cursorTrail: true, pageParticles: true, ceoOrb: true },
});

export const DEFAULT_BM_APPEARANCE = "standard";

export const getAppearanceConfig = (mode = DEFAULT_BM_APPEARANCE) =>
  bmAppearanceModes[mode] || bmAppearanceModes[DEFAULT_BM_APPEARANCE];
