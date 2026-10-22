"use client";

import React, { useState } from "react";
import { JourneyStep, JourneyStepStatus } from "@/types/database";
import { useLanguage } from "@/lib/i18n/context";
import { CheckCircle2, Circle, ExternalLink, Clock } from "lucide-react";
import { isSafeUrl, sanitizeUrl } from "@/lib/validation/url";

export interface JourneyStepItemProps {
  step: JourneyStep;
  index: number;
  onToggleStatus: (stepId: string, newStatus: JourneyStepStatus) => Promise<void>;
}

export const JourneyStepItem: React.FC<JourneyStepItemProps> = ({
  step,
  index,
  onToggleStatus,
}) => {
  const { language } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);

  const isCompleted = step.status === "COMPLETED";

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      const nextStatus: JourneyStepStatus = isCompleted ? "NOT_STARTED" : "COMPLETED";
      await onToggleStatus(step.id, nextStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const title = language === "mr" && step.titleMr ? step.titleMr : step.title;
  const description = language === "mr" && step.descriptionMr ? step.descriptionMr : step.description;

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isCompleted
          ? "bg-emerald-50/40 border-emerald-200/90"
          : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
      }`}
    >
      <div className="flex items-start gap-3.5">
        
        {/* Toggle Checkbox Button */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={isUpdating}
          aria-label={isCompleted ? "Mark incomplete" : "Mark step complete"}
          className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 ${
            isCompleted
              ? "bg-emerald-600 text-white shadow-xs"
              : "border-2 border-slate-300 hover:border-civic-600 text-transparent"
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
        </button>

        {/* Step Info */}
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span
              className={`text-sm font-bold ${
                isCompleted ? "text-emerald-950 line-through opacity-85" : "text-slate-900"
              }`}
            >
              {index + 1}. {title}
            </span>

            {step.completedAt && (
              <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(step.completedAt).toLocaleDateString()}</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">{description}</p>

          {/* External Action URL if provided and safe */}
          {step.externalUrl && isSafeUrl(step.externalUrl) && (
            <div className="pt-2">
              <a
                href={sanitizeUrl(step.externalUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-civic-800 bg-civic-100/80 hover:bg-civic-200 transition-colors"
              >
                <span>{language === "mr" ? "पोर्टल उघडा" : "Open Portal"}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
