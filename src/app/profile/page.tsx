"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { dataStore } from "@/lib/database/store";
import { 
  MAHARASHTRA_DISTRICTS, 
  EDUCATION_LEVELS, 
  CURRENT_YEARS, 
  INCOME_RANGES, 
  DEFAULT_INTERESTS 
} from "@/lib/constants/maharashtra";
import { EducationLevel, CurrentYear, IncomeRange, LanguageCode } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { 
  User, 
  GraduationCap, 
  MapPin, 
  ShieldAlert, 
  Check, 
  LogOut, 
  Languages,
  Trash2,
  Lock
} from "lucide-react";

export default function ProfilePage() {
  const { language, setLanguage, t } = useLanguage();
  const { user, studentProfile, userInterests, updateStudentProfile, updateUserInterests, logout } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(user?.name || "");
  const [prefLang, setPrefLang] = useState<LanguageCode>(language);
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(
    studentProfile?.educationLevel || "Diploma"
  );
  const [currentYear, setCurrentYear] = useState<CurrentYear>(
    studentProfile?.currentYear || "Final Year"
  );
  const [district, setDistrict] = useState(studentProfile?.district || "Pune");
  const [incomeRange, setIncomeRange] = useState<IncomeRange>(
    studentProfile?.incomeRange || "1_TO_2_5_LAKH"
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(userInterests || []);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleInterest = (key: string) => {
    setSelectedInterests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const inc = INCOME_RANGES.find((i) => i.value === incomeRange);
      await updateStudentProfile({
        educationLevel,
        currentYear,
        district,
        incomeRange,
        incomeMin: inc?.min || 0,
        incomeMax: inc?.max || 250000,
      });

      updateUserInterests(selectedInterests);
      setLanguage(prefLang);

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (user?.id) {
      await dataStore.deleteUserAccount(user.id);
    }
    logout();
    router.push("/");
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="emerald" size="sm">
              <User className="w-3.5 h-3.5" />
              <span>{user?.role === "ADMIN" ? "Administrator" : "Student Profile"}</span>
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-marathi">
            {t("nav.profile")}
          </h1>
          <p className="text-xs text-slate-500">
            {language === "mr"
              ? "तुमची माहिती अद्ययावत ठेवा जेणेकरून अचूक संधी आणि पात्रता निकष जुळतील."
              : "Keep your details updated for accurate scheme matching and eligibility rules."}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200 self-start sm:self-auto"
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
        >
          {t("nav.logout")}
        </Button>
      </div>

      {isSaved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{language === "mr" ? "माहिती यशस्वीरीत्या जतन झाली!" : "Profile updated successfully!"}</span>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
        
        {/* Personal Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-civic-700" />
            <span>{language === "mr" ? "वैयक्तिक माहिती" : "Personal Details"}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t("auth.fullName")}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                {t("auth.email")}
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ""}
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 font-medium cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-1">
            <Select
              label={language === "mr" ? "प्राधान्य भाषा" : "Preferred Language"}
              value={prefLang}
              onChange={(e) => setPrefLang(e.target.value as LanguageCode)}
            >
              <option value="mr">मराठी (Marathi)</option>
              <option value="en">English</option>
            </Select>
          </div>
        </div>

        {/* Academic & Location */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-civic-700" />
            <span>{language === "mr" ? "शैक्षणिक व निवास माहिती" : "Academic & Location Details"}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                {t("onboarding.state")}
              </label>
              <input
                type="text"
                disabled
                value="Maharashtra"
                className="block w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-600 font-medium cursor-not-allowed"
              />
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
        </div>

        {/* Interests Selection */}
        <div className="space-y-3 pt-2">
          <label className="block text-sm font-medium text-slate-700">
            {t("onboarding.interests")}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEFAULT_INTERESTS.map((item) => {
              const isSelected = selectedInterests.includes(item.key);
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

        {/* Save button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            className="font-bold shadow-sm"
          >
            {t("common.save")}
          </Button>
        </div>

      </form>

      {/* Privacy and Account Danger Zone (Section 30 & 46) */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500" />
          <span>{language === "mr" ? "गोपनीयता व खाते व्यवस्थापन" : "Privacy & Account Management"}</span>
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {language === "mr"
            ? "नागरिकसेतू केवळ संधींच्या जुळणीसाठी आवश्यक किमान माहिती गोळा करतो. आम्ही आधार क्रमांक किंवा संवेदनशील कागदपत्रे सर्व्हरवर साठवत नाही."
            : "NagrikSetu follows the principle of minimal data collection. We do not store sensitive identity documents or Aadhaar numbers."}
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-100">
          <Link href="/privacy" className="text-xs font-semibold text-civic-700 hover:underline">
            {language === "mr" ? "सविस्तर गोपनीयता धोरण वाचा" : "Read Privacy Policy"} →
          </Link>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
            >
              {language === "mr" ? "खाते हटवण्याची विनंती करा" : "Delete Account"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-700 font-bold">
                {language === "mr" ? "खात्री आहे का?" : "Are you sure?"}
              </span>
              <Button size="sm" variant="danger" onClick={handleDeleteAccount}>
                {language === "mr" ? "होय, खाते हटवा" : "Yes, Delete"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                {t("common.cancel")}
              </Button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
