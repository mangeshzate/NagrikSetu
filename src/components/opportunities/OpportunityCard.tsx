"use client";

import React from "react";
import Link from "next/link";
import { Opportunity } from "@/types/database";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { calculateOpportunityMatch } from "@/lib/matching/engine";
import { calculateDeadlineStatus } from "@/lib/deadlines/utils";
import { MatchBadge } from "./MatchBadge";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ShieldCheck, Calendar, Building2, ArrowRight } from "lucide-react";

export interface OpportunityCardProps {
  opportunity: Opportunity;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity }) => {
  const { language, t } = useLanguage();
  const { studentProfile, userInterests } = useAuth();

  const match = calculateOpportunityMatch(studentProfile, opportunity, userInterests);
  const deadline = calculateDeadlineStatus(opportunity.deadline);

  const typeTranslations: Record<string, string> = {
    SCHOLARSHIP: t("opp.type.scholarship"),
    INTERNSHIP: t("opp.type.internship"),
    GOVERNMENT_EXAM: t("opp.type.exam"),
    COMPETITION: t("opp.type.competition"),
    COURSE: t("opp.type.course"),
  };

  const title = language === "mr" && opportunity.titleMr ? opportunity.titleMr : opportunity.title;
  const provider = language === "mr" && opportunity.providerMr ? opportunity.providerMr : opportunity.provider;
  const shortDesc = language === "mr" && opportunity.shortDescriptionMr ? opportunity.shortDescriptionMr : opportunity.shortDescription;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between p-5 group">
      
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge variant="emerald" size="sm">
            {typeTranslations[opportunity.type] || opportunity.type}
          </Badge>

          {opportunity.verificationStatus === "VERIFIED" && (
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-civic-700 bg-civic-50 px-2 py-0.5 rounded border border-civic-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t("opp.verified")}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <Link
            href={`/opportunities/${opportunity.slug}`}
            className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-civic-800 transition-colors line-clamp-2"
          >
            {title}
          </Link>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{provider}</span>
          </p>
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {shortDesc}
        </p>
      </div>

      {/* Middle Status Row */}
      <div className="my-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs">
        {/* Match Score */}
        <MatchBadge matchResult={match} showBreakdown={true} />

        {/* Deadline */}
        <div className="flex items-center gap-1.5 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <Badge variant={deadline.badgeColor} size="sm">
            {language === "mr" ? deadline.badgeLabelMr : deadline.badgeLabelEn}
          </Badge>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-2">
        <Link href={`/opportunities/${opportunity.slug}`} className="w-full block">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between group-hover:bg-civic-50 group-hover:text-civic-800 group-hover:border-civic-300 font-semibold"
            rightIcon={<ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />}
          >
            {t("opp.viewDetails")}
          </Button>
        </Link>
      </div>

    </div>
  );
};
