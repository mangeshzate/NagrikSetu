"use client";

import React, { useState } from "react";
import { EligibilityRule, StudentProfile } from "@/types/database";
import { EligibilityEvaluationResult } from "@/types/eligibility";
import { evaluateEligibility } from "@/lib/eligibility/engine";
import { useLanguage } from "@/lib/i18n/context";
import { EligibilityBadge } from "../opportunities/EligibilityBadge";
import { DynamicQuestionsModal } from "./DynamicQuestionsModal";
import { Button } from "../ui/Button";
import { Check, X, AlertCircle, HelpCircle, ShieldAlert } from "lucide-react";

export interface EligibilityCheckerProps {
  opportunityId: string;
  rules: EligibilityRule[];
  studentProfile: StudentProfile | null | undefined;
  additionalAnswers: Record<string, any>;
  onSaveAnswers: (fieldKey: string, value: any) => Promise<void>;
}

export const EligibilityChecker: React.FC<EligibilityCheckerProps> = ({
  opportunityId,
  rules,
  studentProfile,
  additionalAnswers,
  onSaveAnswers,
}) => {
  const { language, t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>(additionalAnswers);

  const evaluation: EligibilityEvaluationResult = evaluateEligibility(
    opportunityId,
    rules,
    studentProfile,
    answers
  );

  const handleSaveAnswers = async (newAnswers: Record<string, any>) => {
    setAnswers((prev) => ({ ...prev, ...newAnswers }));
    for (const [key, val] of Object.entries(newAnswers)) {
      await onSaveAnswers(key, val);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {t("opp.eligibility")}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === "mr"
              ? "शासकीय निकषांच्या आधारे नियमांचे काटेकोर मूल्यांकन."
              : "Rule-based factual verification against your student profile."}
          </p>
        </div>

        <div>
          <EligibilityBadge status={evaluation.overallStatus} size="md" />
        </div>
      </div>

      {/* Rules Breakdown */}
      <div className="space-y-3">
        {evaluation.ruleResults.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            {language === "mr" ? "या संधीसाठी विशिष्ट निर्बंध नाहीत." : "No specific eligibility restrictions recorded."}
          </p>
        ) : (
          evaluation.ruleResults.map((result) => {
            const ruleLabel = language === "mr" ? result.rule.humanReadableLabelMr : result.rule.humanReadableLabelEn;

            return (
              <div
                key={result.rule.id}
                className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 transition-colors ${
                  result.status === "PASSED"
                    ? "bg-emerald-50/60 border-emerald-200 text-slate-800"
                    : result.status === "FAILED"
                    ? "bg-rose-50/60 border-rose-200 text-slate-800"
                    : "bg-sky-50/60 border-sky-200 text-slate-800"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {result.status === "PASSED" ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : result.status === "FAILED" ? (
                      <div className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center">
                        <HelpCircle className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="font-semibold text-slate-900">{ruleLabel}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {language === "mr" ? result.explanationMr : result.explanationEn}
                    </p>
                  </div>
                </div>

                {result.status === "NEEDS_INFO" && (
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="shrink-0 text-[11px] font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 px-2.5 py-1 rounded transition-colors"
                  >
                    {language === "mr" ? "माहिती भरा" : "Provide Info"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Action if more info is needed */}
      {evaluation.missingFields.length > 0 && (
        <div className="p-4 rounded-lg bg-sky-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-sky-900 font-medium">
            <AlertCircle className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              {language === "mr"
                ? `पात्रता निश्चित करण्यासाठी ${evaluation.missingFields.length} माहिती घटक आवश्यक आहेत.`
                : `${evaluation.missingFields.length} field(s) needed to complete evaluation.`}
            </span>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setModalOpen(true)}
            className="shrink-0 text-xs"
          >
            {language === "mr" ? "माहिती भरा व पात्रता पूर्ण करा" : "Provide Missing Info"}
          </Button>
        </div>
      )}

      {/* Official Disclaimer */}
      <div className="pt-2 flex items-start gap-2 text-[11px] text-slate-400">
        <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>{t("eligibility.officialDisclaimer")}</span>
      </div>

      {/* Dynamic Questions Modal */}
      {evaluation.missingFields.length > 0 && (
        <DynamicQuestionsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          missingFields={evaluation.missingFields}
          onSubmitAnswers={handleSaveAnswers}
        />
      )}
    </div>
  );
};
