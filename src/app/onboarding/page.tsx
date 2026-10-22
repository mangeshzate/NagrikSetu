"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { 
  MAHARASHTRA_DISTRICTS, 
  EDUCATION_LEVELS, 
  CURRENT_YEARS, 
  INCOME_RANGES, 
  DEFAULT_INTERESTS 
} from "@/lib/constants/maharashtra";
import { EducationLevel, CurrentYear, IncomeRange, LanguageCode } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { 
  Languages, 
  GraduationCap, 
  MapPin, 
  IndianRupee, 
  Heart, 
  ArrowRight, 
  ArrowLeft,
  Check
} from "lucide-react";

export default function OnboardingPage() {
  const { language, setLanguage, t } = useLanguage();
  const { user, completeOnboarding } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Onboarding Form State
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(language);
  const [educationLevel, setEducationLevel] = useState<EducationLevel>("Diploma");
  const [currentYear, setCurrentYear] = useState<CurrentYear>("Final Year");
  const [state, setState] = useState("Maharashtra");
  const [district, setDistrict] = useState("Pune");
  const [incomeRange, setIncomeRange] = useState<IncomeRange>("1_TO_2_5_LAKH");
  const [interests, setInterests] = useState<string[]>(["SCHOLARSHIP", "INTERNSHIP"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleInterest = (key: string) => {
    setInterests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setLanguage(selectedLanguage);
    }
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const selectedIncomeMeta = INCOME_RANGES.find((i) => i.value === incomeRange);
      await completeOnboarding(
        {
          educationLevel,
          currentYear,
          state,
          district,
          incomeRange,
          incomeMin: selectedIncomeMeta?.min || 0,
          incomeMax: selectedIncomeMeta?.max || 250000,
        },
        interests
      );
      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 space-y-6">
      
      {/* Step Indicator Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>{t("onboarding.step")} {currentStep} {t("onboarding.of")} {totalSteps}</span>
          <span className="text-civic-700">
            {Math.round((currentStep / totalSteps) * 100)}% {language === "mr" ? "पूर्ण" : "Completed"}
          </span>
        </div>
        <ProgressBar value={(currentStep / totalSteps) * 100} showPercentage={false} />
      </div>

      {/* Main Step Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* STEP 1: Language Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-civic-50 text-civic-700 flex items-center justify-center mx-auto sm:mx-0">
                <Languages className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-marathi">
                तुमची भाषा निवडा / Choose Your Language
              </h2>
              <p className="text-xs text-slate-500">
                You can change this anytime from your profile settings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={() => setSelectedLanguage("mr")}
                className={`p-5 rounded-2xl border-2 text-left transition-all ${
                  selectedLanguage === "mr"
                    ? "border-civic-600 bg-civic-50/70 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900 font-marathi">मराठी</span>
                  {selectedLanguage === "mr" && (
                    <div className="w-5 h-5 rounded-full bg-civic-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-marathi">
                  महाराष्ट्रातील विद्यार्थ्यांसाठी सोपी आणि नैसर्गिक मराठी भाषा.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLanguage("en")}
                className={`p-5 rounded-2xl border-2 text-left transition-all ${
                  selectedLanguage === "en"
                    ? "border-civic-600 bg-civic-50/70 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900">English</span>
                  {selectedLanguage === "en" && (
                    <div className="w-5 h-5 rounded-full bg-civic-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Clear English interface for all scheme information.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Education Level & Current Year */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-civic-50 text-civic-700 flex items-center justify-center mx-auto sm:mx-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-marathi">
                {t("onboarding.educationLevel")}
              </h2>
              <p className="text-xs text-slate-500">
                {language === "mr" ? "या माहितीच्या आधारे अचूक शिष्यवृत्ती शोधल्या जातील." : "Used to filter compatible scholarships and academic programs."}
              </p>
            </div>

            <div className="space-y-4">
              <Select
                label={t("onboarding.educationLevel")}
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
              >
                {EDUCATION_LEVELS.map((edu) => (
                  <option key={edu.value} value={edu.value}>
                    {language === "mr" ? edu.labelMr : edu.labelEn}
                  </option>
                ))}
              </Select>

              <Select
                label={t("onboarding.currentYear")}
                value={currentYear}
                onChange={(e) => setCurrentYear(e.target.value as CurrentYear)}
              >
                {CURRENT_YEARS.map((yr) => (
                  <option key={yr.value} value={yr.value}>
                    {language === "mr" ? yr.labelMr : yr.labelEn}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {/* STEP 3: State & District */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-civic-50 text-civic-700 flex items-center justify-center mx-auto sm:mx-0">
                <MapPin className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-marathi">
                {t("onboarding.district")}
              </h2>
              <p className="text-xs text-slate-500">
                {language === "mr" ? "स्थानिक स्वराज्य संस्थांच्या (मनपा/जिल्हा परिषद) योजनांसाठी." : "Enables local municipal & district council assistance matching."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  {t("onboarding.state")}
                </label>
                <input
                  type="text"
                  disabled
                  value={state}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-600 font-medium cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-400">
                  {language === "mr" ? "सध्या नागरिकसेतू महाराष्ट्रातील विद्यार्थ्यांसाठी उपलब्ध आहे." : "NagrikSetu MVP is currently focused on Maharashtra."}
                </span>
              </div>

              <Select
                label={t("onboarding.district")}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              >
                {MAHARASHTRA_DISTRICTS.map((dist) => (
                  <option key={dist.en} value={dist.en}>
                    {language === "mr" ? dist.mr : dist.en}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {/* STEP 4: Income Range & Interests */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-civic-50 text-civic-700 flex items-center justify-center mx-auto sm:mx-0">
                <Heart className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-marathi">
                {t("onboarding.income")} & {t("onboarding.interests")}
              </h2>
              <p className="text-xs text-slate-500">
                {language === "mr" ? "अचूक शासकीय सवलतींसाठी उत्पन्न श्रेणी निवडा." : "We use broad ranges to protect your financial privacy."}
              </p>
            </div>

            <div className="space-y-5">
              <Select
                label={t("onboarding.income")}
                value={incomeRange}
                onChange={(e) => setIncomeRange(e.target.value as IncomeRange)}
              >
                {INCOME_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {language === "mr" ? r.labelMr : r.labelEn}
                  </option>
                ))}
              </Select>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  {t("onboarding.interests")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DEFAULT_INTERESTS.map((item) => {
                    const isSelected = interests.includes(item.key);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleInterest(item.key)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-civic-50 border-civic-600 text-civic-900 shadow-2xs"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span>{language === "mr" ? item.nameMr : item.nameEn}</span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-civic-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Controls */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handlePrev}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              {t("onboarding.prev")}
            </Button>
          ) : (
            <div></div>
          )}

          {currentStep < totalSteps ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {t("onboarding.next")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleFinish}
              isLoading={isSubmitting}
              className="font-bold shadow-md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {t("onboarding.finish")}
            </Button>
          )}
        </div>

      </div>

    </div>
  );
}
