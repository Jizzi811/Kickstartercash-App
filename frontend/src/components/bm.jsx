/**
 * BrandMind UI Kit – the ONE component library every page is built from.
 *
 * Hard rule (Design Sprint): no page may define its own hero, card, button,
 * badge, section header or empty state. Pages compose exclusively from here,
 * so every screen looks like it was designed on the same day by the same
 * designer. Style direction: Linear/Vercel – more air, fewer borders, depth
 * via elevation instead of outlines.
 *
 * Typography scale (see index.css):
 *   Display XL 48 · Display 40 · Heading 32 · Section 24 · Card 20 · Body 16 · Caption 13
 * Vertical rhythm: <Page> enforces one 8px-grid gap between hero, stats
 * and content sections on every page.
 */
import React from "react";
import { motion } from "framer-motion";

export const V = "#7C3AED";
export const ACCENT = "#A78BFA";
export const SUCCESS = "#34D399";
export const WARNING = "#FACC15";
export const ERROR = "#F43F5E";
export const SORA = "'Sora', sans-serif";

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

/* ─── Page – consistent vertical rhythm ──────────────────────────── */
export function Page({ children, className = "" }) {
  return <div className={`space-y-8 pb-12 ${className}`}>{children}</div>;
}

/* ─── Typography ─────────────────────────────────────────────────── */
export function GradientHeading({ children, className = "", as: Tag = "h2" }) {
  return (
    <Tag className={`font-semibold ${className}`} style={{ fontFamily: SORA }}>
      <span
        style={{
          background: "linear-gradient(90deg, #C4B5FD 0%, #7C3AED 50%, #6D28D9 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {children}
      </span>
    </Tag>
  );
}

/* ─── Hero – identical on every page ─────────────────────────────────
   Badge → H1 → description → (optional context chips) · actions right.
   Fixed padding + min-height so no page hero "feels" different.        */
export function Hero({ icon: Icon, badge, title, description, actions, chips, delay = 0 }) {
  return (
    <motion.section {...fadeUp(delay)}>
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(8,8,8,0) 55%, rgba(124,58,237,0.05) 100%)",
          border: "1px solid rgba(124,58,237,0.14)",
        }}
      >
        <div
          className="absolute -top-28 -left-28 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)" }}
        />
        <div className="relative p-8 min-h-[224px] flex items-center">
          <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-6 w-full">
            <div className="max-w-2xl">
              {badge && (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-[10px] tracking-[0.2em] uppercase font-semibold"
                  style={{
                    background: "rgba(124,58,237,0.08)",
                    border: "1px solid rgba(124,58,237,0.26)",
                    color: V,
                  }}
                >
                  {Icon && <Icon size={11} />} {badge}
                </div>
              )}
              <h1 className="bm-display mb-3" style={{ fontFamily: SORA }}>
                <span
                  style={{
                    background: "linear-gradient(90deg, #7C3AED 0%, #C4B5FD 45%, #6D28D9 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {title}
                </span>
              </h1>
              {description && (
                <p className="bm-body text-zinc-400 leading-relaxed">{description}</p>
              )}
              {chips && <div className="flex flex-wrap items-center gap-2.5 mt-5">{chips}</div>}
            </div>
            {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ─── Section header – icon + gradient title + hairline + right slot ─ */
export function SectionHeader({ icon: Icon, title, right }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      {Icon && (
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(124,58,237,0.10)" }}
        >
          <Icon size={13} style={{ color: V }} />
        </div>
      )}
      <GradientHeading className="bm-h4">{title}</GradientHeading>
      <div
        className="flex-1 h-px"
        style={{ background: "linear-gradient(to right, rgba(124,58,237,0.16), transparent)" }}
      />
      {right}
    </div>
  );
}

export function Section({ icon, title, right, children, delay = 0, className = "" }) {
  return (
    <motion.section {...fadeUp(delay)} className={className}>
      {title && <SectionHeader icon={icon} title={title} right={right} />}
      {children}
    </motion.section>
  );
}

/* ─── Card – exactly four sizes, no ad-hoc paddings ──────────────── */
const CARD_PAD = { xs: "p-8", s: "p-8", m: "p-8", l: "p-8" };

export function Card({ children, size = "m", tinted = false, className = "", style = {} }) {
  // Migration escape hatch: an explicit p-* in className overrides the size
  // padding (legacy pages). New code must use the size prop only.
  const pad = /\bp[xy]?-\d/.test(className) ? "" : CARD_PAD[size] || CARD_PAD.m;
  return (
    <div
      className={`rounded-2xl ${pad} ${className}`}
      style={{
        background: tinted
          ? "linear-gradient(145deg, rgba(124,58,237,0.05) 0%, rgba(255,255,255,0.02) 100%)"
          : "rgba(255,255,255,0.025)",
        border: `1px solid ${tinted ? "rgba(124,58,237,0.14)" : "rgba(255,255,255,0.06)"}`,
        boxShadow: "var(--bm-shadow-card)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Metric / stat tile ─────────────────────────────────────────── */
export function Metric({ icon: Icon, label, value, hint, color = V }) {
  return (
    <Card size="s" className="min-h-[168px] flex flex-col justify-between">
      {Icon && (
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center mb-2"
          style={{ background: `${color}14` }}
        >
          <Icon size={14} style={{ color }} />
        </div>
      )}
      <div
        className="text-2xl font-bold leading-none"
        style={{
          fontFamily: SORA,
          background: `linear-gradient(135deg, #fff 0%, ${color} 120%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {value}
      </div>
      <div className="text-[11px] text-zinc-500 mt-1">{label}</div>
      {hint && <div className="text-[10px] text-zinc-700 mt-0.5">{hint}</div>}
    </Card>
  );
}

export function StatGrid({ children }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{children}</div>;
}

/* ─── Buttons – primary / secondary / ghost / danger only ────────── */
const BTN_BASE =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-150 hover:-translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none";
const BTN_SIZE = { sm: "text-[12px] px-3 py-1.5", md: "text-[13px] px-4 py-2.5", lg: "text-sm px-6 py-3" };
const BTN_VARIANT = {
  primary: { background: V, color: "#0A0A0A" },
  secondary: { background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" },
  ghost: { background: "transparent", border: "1px solid rgba(255,255,255,0.10)", color: "#a1a1aa" },
  danger: { background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.3)", color: "#fb7185" },
};

export function Btn({ variant = "primary", size = "md", className = "", style = {}, children, ...props }) {
  return (
    <button
      className={`${BTN_BASE} ${BTN_SIZE[size] || BTN_SIZE.md} ${className}`}
      style={{ ...(BTN_VARIANT[variant] || BTN_VARIANT.primary), ...style }}
      {...props}
    >
      {children}
    </button>
  );
}

/* ─── Badge – one component, three tones ─────────────────────────── */
const BADGE_TONE = {
  violet: { background: "rgba(124,58,237,0.10)", border: "1px solid rgba(124,58,237,0.26)", color: "#a78bfa" },
  neutral: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "#a1a1aa" },
  success: { background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.26)", color: "#34d399" },
  danger: { background: "rgba(244,63,94,0.10)", border: "1px solid rgba(244,63,94,0.26)", color: "#fb7185" },
  warning: { background: "rgba(250,204,21,0.10)", border: "1px solid rgba(250,204,21,0.26)", color: "#FACC15" },
  info: { background: "rgba(56,189,248,0.10)", border: "1px solid rgba(56,189,248,0.26)", color: "#38BDF8" },
};

export function BMBadge({ children, tone = "violet", icon: Icon }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={BADGE_TONE[tone] || BADGE_TONE.violet}
    >
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

/* ─── Empty state – the ONLY way to show "no data yet" ───────────────
   Never demo data: icon + short explanation + primary CTA (+ optional
   secondary CTA). Business data is never fabricated.                   */
export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, secondaryLabel, onSecondary }) {
  return (
    <Card size="l" className="text-center">
      {Icon && (
        <div
          className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "rgba(124,58,237,0.10)" }}
        >
          <Icon size={24} style={{ color: V }} />
        </div>
      )}
      <div className="bm-h4 text-zinc-100 mb-2" style={{ fontFamily: SORA }}>{title}</div>
      {description && <p className="bm-small text-zinc-500 max-w-md mx-auto leading-relaxed">{description}</p>}
      {(actionLabel || secondaryLabel) && (
        <div className="flex items-center justify-center gap-3 mt-6">
          {actionLabel && <Btn onClick={onAction}>{actionLabel}</Btn>}
          {secondaryLabel && <Btn variant="ghost" onClick={onSecondary}>{secondaryLabel}</Btn>}
        </div>
      )}
    </Card>
  );
}


/* ─── ChatContainer – shared shell for every agent chat ───────────── */
export function ChatContainer({ children, className = "" }) {
  return (
    <Card size="l" className={`flex flex-col h-[calc(100vh-260px)] min-h-[420px] overflow-hidden ${className}`}>
      {children}
    </Card>
  );
}

/* ─── Design System 3.0 named exports ─────────────────────────────── */
export const Button = Btn;
export const ButtonPrimary = (props) => <Btn variant="primary" {...props} />;
export const ButtonSecondary = (props) => <Btn variant="secondary" {...props} />;
export const ButtonGhost = (props) => <Btn variant="ghost" {...props} />;
export const ButtonDanger = (props) => <Btn variant="danger" {...props} />;

export function CardHeader({ children, className = "" }) {
  return <div className={`mb-6 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = "" }) {
  return <div className={`space-y-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }) {
  return <div className={`mt-6 flex items-center gap-3 ${className}`}>{children}</div>;
}

const fieldBase = "w-full rounded-2xl border px-4 py-3 bm-body transition disabled:opacity-50";
const fieldStyle = {
  background: "rgba(0,0,0,0.28)",
  borderColor: "var(--bm-color-border)",
  color: "var(--bm-color-text-primary)",
};

export function FieldLabel({ children, className = "", ...props }) {
  return <label className={`block bm-caption font-semibold mb-2 text-zinc-300 ${className}`} {...props}>{children}</label>;
}

export function Input({ className = "", ...props }) {
  return <input className={`${fieldBase} ${className}`} style={fieldStyle} {...props} />;
}

export function Textarea({ className = "", ...props }) {
  return <textarea className={`${fieldBase} min-h-[132px] resize-y ${className}`} style={fieldStyle} {...props} />;
}

export function Select({ children, className = "", ...props }) {
  return <select className={`${fieldBase} ${className}`} style={fieldStyle} {...props}>{children}</select>;
}

export function Checkbox({ label, className = "", ...props }) {
  return (
    <label className={`inline-flex items-center gap-3 bm-caption text-zinc-300 ${className}`}>
      <input type="checkbox" className="h-4 w-4 rounded" style={{ accentColor: "var(--bm-color-brand-purple)" }} {...props} />
      {label}
    </label>
  );
}

export function Toggle({ checked, label, className = "", ...props }) {
  return (
    <label className={`inline-flex items-center gap-3 bm-caption text-zinc-300 ${className}`}>
      <span className="relative inline-flex h-6 w-11 rounded-full transition" style={{ background: checked ? "var(--bm-color-brand-purple)" : "var(--bm-color-surface-elevated)" }}>
        <input type="checkbox" checked={checked} className="sr-only" {...props} />
        <span className="absolute top-1 h-4 w-4 rounded-full transition" style={{ left: checked ? 22 : 4, background: "var(--bm-color-text-primary)" }} />
      </span>
      {label}
    </label>
  );
}

export function Radio({ label, className = "", ...props }) {
  return (
    <label className={`inline-flex items-center gap-3 bm-caption text-zinc-300 ${className}`}>
      <input type="radio" className="h-4 w-4" style={{ accentColor: "var(--bm-color-brand-purple)" }} {...props} />
      {label}
    </label>
  );
}

export function SearchInput(props) {
  return <Input type="search" placeholder="Suchen…" {...props} />;
}

export function Upload({ label = "Datei hochladen", className = "", ...props }) {
  return <input aria-label={label} type="file" className={`${fieldBase} ${className}`} style={fieldStyle} {...props} />;
}

export function BMTable({ columns = [], rows = [], empty, renderRow, className = "" }) {
  if (!rows.length) return empty || <EmptyState title="Noch keine Daten." description="Sobald Inhalte existieren, erscheinen sie hier." />;
  return (
    <div className={`overflow-hidden rounded-2xl border ${className}`} style={{ borderColor: "var(--bm-color-border)" }}>
      <table className="w-full bm-caption">
        <thead style={{ background: "var(--bm-color-surface-elevated)", color: "var(--bm-color-text-secondary)" }}>
          <tr>{columns.map((c) => <th key={c.key || c} className="px-4 py-3 text-left font-semibold">{c.label || c}</th>)}</tr>
        </thead>
        <tbody>{rows.map((row, index) => renderRow ? renderRow(row, index) : <tr key={row.id || index}>{columns.map((c) => <td key={c.key || c} className="px-4 py-3 border-t" style={{ borderColor: "var(--bm-color-divider)" }}>{row[c.key || c]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function Loader({ label = "Lädt…" }) {
  return <div className="inline-flex items-center gap-3 bm-caption text-zinc-400"><span className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--bm-color-brand-purple)", borderTopColor: "transparent" }} />{label}</div>;
}

export function StatusBadge({ status = "neutral", children }) {
  const map = { success: "success", warning: "warning", error: "danger", info: "info", neutral: "neutral", active: "success", draft: "neutral", blocked: "danger" };
  return <BMBadge tone={map[status] || "neutral"}>{children || status}</BMBadge>;
}

/* ─── Official BrandMind component names (Sprint 4 foundation) ────── */
export const bmMotion = Object.freeze({
  page: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
  hover: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
  dialog: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
  dropdown: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  feedback: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
});

export const BMPage = Page;
export const BMSection = Section;
export const BMCard = Card;
export const BMMetricCard = Metric;
export const BMButton = Btn;
export const BMInput = Input;
export const BMTextarea = Textarea;
export const BMSelect = Select;
export const BMEmptyState = EmptyState;
export const BMStat = Metric;

export function BMHero({ breadcrumbs, statusBadges, kpis, subtitle, description, ...props }) {
  const chips = props.chips || (
    <>
      {breadcrumbs && <div className="bm-caption text-zinc-500">{breadcrumbs}</div>}
      {statusBadges}
    </>
  );
  return (
    <div className="space-y-4">
      <Hero {...props} description={description || subtitle} chips={chips} />
      {kpis && <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">{kpis}</div>}
    </div>
  );
}

export function BMToolbar({ children, className = "" }) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-[var(--bm-radius-app-shell)] border px-4 py-3 ${className}`} style={{ borderColor: "var(--bm-color-border)", background: "var(--bm-surface-glass)" }}>
      {children}
    </div>
  );
}

export function BMHeader({ title, eyebrow, description, actions, className = "" }) {
  return (
    <header className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${className}`}>
      <div>
        {eyebrow && <div className="bm-kicker mb-2">{eyebrow}</div>}
        <GradientHeading as="h1" className="bm-h1">{title}</GradientHeading>
        {description && <p className="bm-body mt-3 max-w-2xl text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}

export function BMDialog({ open, title, description, children, footer, onClose, className = "" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation" onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={bmMotion.dialog}
        className={`w-full max-w-lg rounded-[var(--bm-radius-dialog)] border p-6 ${className}`}
        style={{ background: "var(--bm-color-surface)", borderColor: "var(--bm-color-border)", boxShadow: "var(--bm-shadow-xl)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5">
          {title && <GradientHeading as="h2" className="bm-h3">{title}</GradientHeading>}
          {description && <p className="bm-caption mt-2 text-zinc-400">{description}</p>}
        </div>
        {children}
        {footer && <div className="mt-6 flex items-center justify-end gap-3">{footer}</div>}
      </motion.div>
    </div>
  );
}

// Legacy aliases remain available for existing pages only. New UI must use BM*.
export const LegacyCard = Card;
export const LegacyButton = Btn;
export const LegacyEmptyState = EmptyState;
