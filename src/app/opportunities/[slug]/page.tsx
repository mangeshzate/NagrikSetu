"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { dataStore } from "@/lib/database/store";
import { Opportunity, EligibilityRule, OpportunityDocument } from "@/types/database";
import { calculateOpportunityMatch } from "@/lib/matching/engine";
import { calculateDeadlineStatus } from "@/lib/deadlines/utils";
import { EligibilityChecker } from "@/components/eligibility/EligibilityChecker";
import { DocumentChecklist } from "@/components/documents/DocumentChecklist";
import { MatchBadge } from "@/components/opportunities/MatchBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  Building2, 
  Calendar, 
  ExternalLink, 
  ShieldCheck, 
  Check, 
  X, 
  MapPin, 
  ArrowRight,
  AlertOctagon,
  Sparkles,
  Info
} from "lucide-react";
import { isSafeUrl, sanitizeUrl } from "@/lib/validation/url";

export default function OpportunityDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const { language, t } = useLanguage();
  const { user, studentProfile, userInterests } = useAuth();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [rules, setRules] = useState<EligibilityRule[]>([]);
  const [documents, setDocuments] = useState<OpportunityDocument[]>([]);
  const [additionalAnswers, setAdditionalAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingJourney, setIsStartingJourney] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const opp = await dataStore.getOpportunityBySlug(slug);
        if (opp) {
          setOpportunity(opp);
          const [oppRules, oppDocs] = await Promise.all([
            dataStore.getRulesForOpportunity(opp.id),
            dataStore.getDocumentsForOpportunity(opp.id),
          ]);
          setRules(oppRules);
          setDocuments(oppDocs);

          if (user) {
            const answers = await dataStore.getAdditionalAnswers(user.id);
            setAdditionalAnswers(answers);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [slug, user]);

  const handleSaveAnswer = async (fieldKey: string, value: any) => {
    if (!user) return;
    await dataStore.saveAdditionalAnswer(user.id, fieldKey, value);
    setAdditionalAnswers((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleStartJourney = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!opportunity) return;
    setIsStartingJourney(true);
    try {
      const journey = await dataStore.createJourney(user.id, opportunity.id);
      router.push(`/journeys/${journey.id}`);
    } finally {
      setIsStartingJourney(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        {t("common.loading")}
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-slate-900">
          {language === "mr" ? "संधी सापडली नाही" : "Opportunity Not Found"}
        </h2>
        <p className="text-xs text-slate-500">
          {language === "mr"
            ? "तुम्ही शोधत असलेली संधी उपलब्ध नाही किंवा मुदत संपल्यामुळे हटवली गेली आहे."
            : "The opportunity you are looking for may have been removed or does not exist."}
        </p>
        <Link href="/discover">
          <Button variant="outline" size="sm">
            {t("hero.cta.secondary")}
          </Button>
        </Link>
      </div>
    );
  }

  const match = calculateOpportunityMatch(studentProfile, opportunity, userInterests);
  const deadline = calculateDeadlineStatus(opportunity.deadline);

  const title = language === "mr" && opportunity.titleMr ? opportunity.titleMr : opportunity.title;
  const provider = language === "mr" && opportunity.providerMr ? opportunity.providerMr : opportunity.provider;
  const desc = language === "mr" && opportunity.descriptionMr ? opportunity.descriptionMr : opportunity.description;

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      
      {/* 1. Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="emerald" size="md">
              {opportunity.type}
            </Badge>

            {opportunity.verificationStatus === "VERIFIED" ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-civic-800 bg-civic-50 px-3 py-1 rounded-md border border-civic-200">
                <ShieldCheck className="w-4 h-4 text-civic-600" />
                <span>{t("opp.verified")}</span>
              </span>
            ) : (
              <Badge variant="amber" size="md">
                {t("opp.needsReview")}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={deadline.badgeColor} size="md">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              <span>{language === "mr" ? deadline.badgeLabelMr : deadline.badgeLabelEn}</span>
            </Badge>
          </div>
        </div>

        {/* Title & Provider */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-snug font-marathi">
            {title}
          </h1>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800">{provider}</span>
            <span>•</span>
            <span className="text-slate-500">
              {language === "mr" ? "तपासणी दिनांक:" : "Last Verified:"}{" "}
              {new Date(opportunity.verifiedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
          {desc}
        </p>

        {/* Data Trust & Provenance Box */}
        {(opportunity.deadlineSource || opportunity.eligibilitySource || opportunity.sourceClassification) && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-civic-700" />
                <span>{language === "mr" ? "माहिती पडताळणी नोंद व संदर्भ" : "Data Verification & Provenance"}</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                {opportunity.sourceClassification || "NEEDS_MANUAL_VERIFICATION"}
              </span>
            </div>
            {opportunity.deadlineSource && (
              <p className="text-[11px] text-slate-500">
                <strong className="text-slate-700">{language === "mr" ? "मुदत संदर्भ:" : "Deadline Source:"}</strong> {opportunity.deadlineSource}
              </p>
            )}
            {opportunity.eligibilitySource && (
              <p className="text-[11px] text-slate-500">
                <strong className="text-slate-700">{language === "mr" ? "पात्रता संदर्भ:" : "Eligibility Ref:"}</strong> {opportunity.eligibilitySource}
              </p>
            )}
            <p className="text-[10px] text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 leading-normal">
              {language === "mr"
                ? "सूचना: हे पोर्टल शासकीय मार्गदर्शनासाठी आहे. प्रत्यक्ष अर्ज करण्यापूर्वी अधिकृत पोर्टलवरील मूळ परिपत्रक व तारखा पडताळून पहाव्यात."
                : "Notice: NagrikSetu provides civic guidance. Active application deadlines and official criteria must be confirmed on the official department portal."}
            </p>
          </div>
        )}

        {/* Official Links & CTA Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {opportunity.officialUrl && isSafeUrl(opportunity.officialUrl) && (
              <a
                href={sanitizeUrl(opportunity.officialUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-civic-800 hover:text-civic-900 bg-civic-50 hover:bg-civic-100 px-3.5 py-2 rounded-xl border border-civic-200 transition-colors"
              >
                <span>{t("opp.viewOfficial")}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {deadline.isExpired ? (
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-slate-400" />
                <span>{language === "mr" ? "या संधीची अंतिम मुदत संपलेली आहे." : "This opportunity's deadline has passed."}</span>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="md"
                onClick={handleStartJourney}
                isLoading={isStartingJourney}
                className="font-bold shadow-md w-full sm:w-auto"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {t("opp.startJourney")}
              </Button>
            )}
          </div>

        </div>

      </div>

      {/* 2. Your Match Section (Detailed Explanation from Section 19 & 20) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-civic-700" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {t("opp.yourMatch")}
            </h3>
          </div>
          <MatchBadge matchResult={match} showBreakdown={false} />
        </div>

        <p className="text-xs text-slate-500">
          {t("opp.whyMatches")}:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {match.reasons.map((r) => (
            <div
              key={r.criterion}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-2.5 text-xs"
            >
              <div className="mt-0.5">
                {r.matched ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </div>
              <div>
                <span className="font-semibold text-slate-900 block capitalize">
                  {r.criterion}: +{r.pointsEarned} / {r.maxPoints} pts
                </span>
                <span className="text-[11px] text-slate-500">
                  {language === "mr" ? r.descriptionMr : r.descriptionEn}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Deterministic Eligibility Checker Section */}
      <EligibilityChecker
        opportunityId={opportunity.id}
        rules={rules}
        studentProfile={studentProfile}
        additionalAnswers={additionalAnswers}
        onSaveAnswers={handleSaveAnswer}
      />

      {/* 4. Document Checklist Section */}
      {documents.length > 0 && (
        <DocumentChecklist documents={documents} />
      )}

    </div>
  );
}
