"use client";

import React from "react";
import Link from "next/link";
import { Journey } from "@/types/database";
import { useLanguage } from "@/lib/i18n/context";
import { ProgressBar } from "../ui/ProgressBar";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { MapPin, ArrowRight, CheckCircle2, Clock } from "lucide-react";

export interface JourneyCardProps {
  journey: Journey;
}

export const JourneyCard: React.FC<JourneyCardProps> = ({ journey }) => {
  const { language, t } = useLanguage();
  const opp = journey.opportunity;

  const totalSteps = journey.steps?.length || 7;
  const completedSteps = journey.steps?.filter((s) => s.status === "COMPLETED").length || 0;
  const remainingSteps = totalSteps - completedSteps;

  const title = language === "mr" && opp?.titleMr ? opp.titleMr : opp?.title || "Educational Opportunity";

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 space-y-4">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="emerald" size="sm">
              <MapPin className="w-3 h-3" />
              <span>{t("journey.title")}</span>
            </Badge>
            {journey.status === "COMPLETED" ? (
              <Badge variant="emerald" size="sm">
                <CheckCircle2 className="w-3 h-3" />
                <span>{language === "mr" ? "पूर्ण झाले" : "Completed"}</span>
              </Badge>
            ) : (
              <Badge variant="amber" size="sm">
                <Clock className="w-3 h-3" />
                <span>{language === "mr" ? "सुरू आहे" : "In Progress"}</span>
              </Badge>
            )}
          </div>

          <h4 className="text-base font-bold text-slate-900 line-clamp-1">
            {title}
          </h4>
          <p className="text-xs text-slate-500">
            {opp?.provider}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <ProgressBar
          value={journey.progress}
          label={
            journey.status === "COMPLETED"
              ? t("journey.completed")
              : `${remainingSteps} ${t("journey.tasksRemaining")}`
          }
          color={journey.progress === 100 ? "emerald" : "civic"}
        />
      </div>

      {/* CTA Button */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {completedSteps} / {totalSteps} steps
        </span>

        <Link href={`/journeys/${journey.id}`}>
          <Button
            size="sm"
            variant="primary"
            className="text-xs"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {t("opp.continueJourney")}
          </Button>
        </Link>
      </div>
    </div>
  );
};
