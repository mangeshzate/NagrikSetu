"use client";

import React from "react";
import { OverallEligibilityStatus } from "@/types/eligibility";
import { useLanguage } from "@/lib/i18n/context";
import { CheckCircle2, AlertCircle, XCircle, HelpCircle } from "lucide-react";

export interface EligibilityBadgeProps {
  status: OverallEligibilityStatus;
  size?: "sm" | "md";
}

export const EligibilityBadge: React.FC<EligibilityBadgeProps> = ({
  status,
  size = "md",
}) => {
  const { t } = useLanguage();

  const configs: Record<
    OverallEligibilityStatus,
    { label: string; icon: React.ReactNode; style: string }
  > = {
    ELIGIBLE: {
      label: t("eligibility.eligible"),
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
      style: "bg-emerald-50 text-emerald-800 border-emerald-300",
    },
    POSSIBLY_ELIGIBLE: {
      label: t("eligibility.possiblyEligible"),
      icon: <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
      style: "bg-amber-50 text-amber-800 border-amber-300",
    },
    NOT_ELIGIBLE: {
      label: t("eligibility.notEligible"),
      icon: <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
      style: "bg-rose-50 text-rose-800 border-rose-300",
    },
    MORE_INFORMATION_REQUIRED: {
      label: t("eligibility.needsInfo"),
      icon: <AlertCircle className="w-3.5 h-3.5 text-sky-600 shrink-0" />,
      style: "bg-sky-50 text-sky-800 border-sky-300",
    },
    NOT_CHECKED: {
      label: t("eligibility.notChecked"),
      icon: <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
      style: "bg-slate-50 text-slate-600 border-slate-200",
    },
  };

  const config = configs[status] || configs.NOT_CHECKED;

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-md border ${config.style} ${sizeClasses}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
