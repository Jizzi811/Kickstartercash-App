import React from "react";
import { BMHero } from "@/components/bm";

/**
 * @deprecated LegacyPageHeader is kept for migration compatibility only.
 * New pages must use BMHero or BMHeader from `@/components/bm`.
 */
export function LegacyPageHeader({ icon, title, subtitle, badge, actions, className = "" }) {
  return (
    <BMHero
      icon={icon}
      title={title}
      description={subtitle}
      badge={badge}
      actions={actions}
      className={className}
    />
  );
}

export const PageHeader = LegacyPageHeader;
