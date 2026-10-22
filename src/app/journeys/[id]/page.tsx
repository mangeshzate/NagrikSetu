"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { dataStore } from "@/lib/database/store";
import { Journey, JourneyStepStatus } from "@/types/database";
import { JourneyStepItem } from "@/components/journeys/JourneyStepItem";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  Share2
} from "lucide-react";
import { isSafeUrl, sanitizeUrl } from "@/lib/validation/url";

export default function JourneyDetailPage() {
  const params = useParams();
  const journeyId = params?.id as string;
  const router = useRouter();

  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!journeyId) return;
      setIsLoading(true);
      try {
        const item = await dataStore.getJourneyById(journeyId, user?.id, user?.role);
        setJourney(item);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [journeyId, user?.id, user?.role]);

  const handleToggleStep = async (stepId: string, status: JourneyStepStatus) => {
    if (!journey) return;
    const updated = await dataStore.updateJourneyStepStatus(journey.id, stepId, status, user?.id, user?.role);
    if (updated) {
      setJourney(updated);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        {t("common.loading")}
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-slate-900">
          {language === "mr" ? "प्रवास सापडला नाही" : "Journey Not Found"}
        </h2>
        <Link href="/journeys">
          <Button variant="outline" size="sm">
            {language === "mr" ? "सर्व प्रवास पहा" : "Back to Journeys"}
          </Button>
        </Link>
      </div>
    );
  }

  const opp = journey.opportunity;
  const title = language === "mr" && opp?.titleMr ? opp.titleMr : opp?.title || "Opportunity Journey";
  const steps = journey.steps || [];
  const completedCount = steps.filter((s) => s.status === "COMPLETED").length;
  const remainingCount = steps.length - completedCount;

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 max-w-4xl mx-auto">
      
      {/* Back button */}
      <div>
        <Link
          href="/journeys"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === "mr" ? "माझ्या सर्व प्रवासांकडे परत जा" : "Back to all journeys"}</span>
        </Link>
      </div>

      {/* Header Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="emerald" size="md">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                <span>{t("journey.title")}</span>
              </Badge>
              {journey.status === "COMPLETED" ? (
                <Badge variant="emerald" size="md">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>{language === "mr" ? "१००% पूर्ण" : "100% Completed"}</span>
                </Badge>
              ) : (
                <Badge variant="amber" size="md">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  <span>{remainingCount} {t("journey.tasksRemaining")}</span>
                </Badge>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-marathi">
              {title}
            </h1>

            {opp && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{opp.provider}</span>
              </p>
            )}
          </div>

          {opp?.officialUrl && isSafeUrl(opp.officialUrl) && (
            <a
              href={sanitizeUrl(opp.officialUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
            >
              <span>{t("opp.officialSource")}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 pt-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <ProgressBar
            value={journey.progress}
            label={
              journey.status === "COMPLETED"
                ? t("journey.completed")
                : `${completedCount} / ${steps.length} ${language === "mr" ? "पायऱ्या पूर्ण" : "steps completed"}`
            }
            color={journey.progress === 100 ? "emerald" : "civic"}
          />
        </div>

      </div>

      {/* Step by Step Action Roadmap */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 font-marathi">
            {language === "mr" ? "प्रत्यक्ष अर्जासाठी कृती पायऱ्या" : "Action Steps to Complete Application"}
          </h2>
          <span className="text-xs text-slate-500">
            {language === "mr" ? "पायरी पूर्ण झाल्यावर टिक करा" : "Check off as you complete"}
          </span>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <JourneyStepItem
              key={step.id}
              step={step}
              index={index}
              onToggleStatus={handleToggleStep}
            />
          ))}
        </div>
      </div>

      {/* Help Banner */}
      <div className="p-4 rounded-2xl bg-civic-50 border border-civic-200 text-xs text-civic-900 flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-civic-700 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="font-bold">
            {language === "mr" ? "काही अडचण येत आहे का?" : "Need help with any step?"}
          </span>
          <p>
            {language === "mr"
              ? "कागदपत्रे किंवा पोर्टल अर्जाबाबत प्रश्न असल्यास नागरिकसेतू AI सहाय्यकाचा सल्ला घ्या."
              : "Consult the NagrikSetu AI guide anytime for step clarification or missing document guidance."}
          </p>
          <Link href="/assistant" className="font-bold text-civic-800 underline block pt-0.5">
            {t("nav.assistant")} →
          </Link>
        </div>
      </div>

    </div>
  );
}
