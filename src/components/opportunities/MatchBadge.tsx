"use client";

import React, { useState } from "react";
import { OpportunityMatchResult } from "@/types/matching";
import { useLanguage } from "@/lib/i18n/context";
import { Sparkles, ChevronDown, ChevronUp, Check, X } from "lucide-react";

export interface MatchBadgeProps {
  matchResult: OpportunityMatchResult;
  showBreakdown?: boolean;
}

export const MatchBadge: React.FC<MatchBadgeProps> = ({
  matchResult,
  showBreakdown = false,
}) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const { score, category, categoryLabelEn, categoryLabelMr, reasons } = matchResult;

  const badgeColor =
    category === "EXCELLENT_MATCH" || category === "STRONG_MATCH"
      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
      : category === "POSSIBLE_MATCH"
      ? "bg-amber-50 text-amber-800 border-amber-300"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${badgeColor} hover:brightness-95`}
      >
        <Sparkles className="w-3.5 h-3.5 text-civic-700" />
        <span className="tabular-nums">{score}%</span>
        <span>{language === "mr" ? categoryLabelMr : categoryLabelEn}</span>
        {showBreakdown && (
          isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {/* Breakdown Popup */}
      {showBreakdown && isOpen && (
        <div className="absolute left-0 mt-2 z-30 w-72 sm:w-80 p-3.5 bg-white rounded-xl shadow-xl border border-slate-200 text-xs text-slate-700 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-900">
              {language === "mr" ? "मॅच स्कोअरचे विश्लेषण" : "Match Score Breakdown"}
            </span>
            <span className="font-extrabold text-civic-700 tabular-nums">
              {score} / 100 pts
            </span>
          </div>

          <div className="space-y-1.5">
            {reasons.map((r) => (
              <div key={r.criterion} className="flex items-start justify-between gap-2 py-0.5">
                <div className="flex items-start gap-1.5">
                  {r.matched ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <span className="text-[11px] leading-tight text-slate-600">
                    {language === "mr" ? r.descriptionMr : r.descriptionEn}
                  </span>
                </div>
                <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                  +{r.pointsEarned}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 italic">
            {language === "mr"
              ? "टीप: उच्च मॅच स्कोअर म्हणजे शासकीय पात्रता नव्हे. कृपया पात्रता तपासा."
              : "Note: Match score is profile compatibility, not official eligibility."}
          </p>
        </div>
      )}
    </div>
  );
};
