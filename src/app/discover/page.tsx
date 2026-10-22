"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { dataStore } from "@/lib/database/store";
import { Opportunity } from "@/types/database";
import { calculateOpportunityMatch } from "@/lib/matching/engine";
import { calculateDeadlineStatus } from "@/lib/deadlines/utils";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { EDUCATION_LEVELS } from "@/lib/constants/maharashtra";
import { Search, Filter, RotateCcw, Compass } from "lucide-react";

export default function DiscoverPage() {
  const { language, t } = useLanguage();
  const { studentProfile, userInterests } = useAuth();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedEducation, setSelectedEducation] = useState("ALL");
  const [sortBy, setSortBy] = useState("BEST_MATCH");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const list = await dataStore.getOpportunities();
        setOpportunities(list);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const typeOptions = [
    { value: "ALL", label: language === "mr" ? "सर्व प्रकार" : "All Types" },
    { value: "SCHOLARSHIP", label: t("opp.type.scholarship") },
    { value: "INTERNSHIP", label: t("opp.type.internship") },
    { value: "GOVERNMENT_EXAM", label: t("opp.type.exam") },
    { value: "COMPETITION", label: t("opp.type.competition") },
    { value: "COURSE", label: t("opp.type.course") },
  ];

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedType("ALL");
    setSelectedEducation("ALL");
    setSortBy("BEST_MATCH");
  };

  // Filter items
  const filtered = opportunities.filter((opp) => {
    // Search match
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      const titleMatch = opp.title.toLowerCase().includes(term) || (opp.titleMr && opp.titleMr.toLowerCase().includes(term));
      const providerMatch = opp.provider.toLowerCase().includes(term) || (opp.providerMr && opp.providerMr.toLowerCase().includes(term));
      const descMatch = opp.shortDescription.toLowerCase().includes(term);
      if (!titleMatch && !providerMatch && !descMatch) return false;
    }

    // Type filter
    if (selectedType !== "ALL" && opp.type !== selectedType) {
      return false;
    }

    // Education filter
    if (selectedEducation !== "ALL") {
      if (
        opp.educationLevelApplicability.length > 0 &&
        !opp.educationLevelApplicability.includes(selectedEducation as any)
      ) {
        return false;
      }
    }

    return true;
  });

  // Sort items
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "BEST_MATCH") {
      const scoreA = calculateOpportunityMatch(studentProfile, a, userInterests).score;
      const scoreB = calculateOpportunityMatch(studentProfile, b, userInterests).score;
      return scoreB - scoreA;
    }
    if (sortBy === "DEADLINE_SOON") {
      const daysA = calculateDeadlineStatus(a.deadline).daysRemaining;
      const daysB = calculateDeadlineStatus(b.deadline).daysRemaining;
      return daysA - daysB;
    }
    if (sortBy === "NEWEST") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-civic-700 bg-civic-50 px-2.5 py-1 rounded-md border border-civic-200">
          <Compass className="w-3.5 h-3.5" />
          <span>{language === "mr" ? "संधी शोध निर्देशिका" : "Opportunity Directory"}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-marathi">
          {language === "mr" ? "महाराष्ट्रातील शैक्षणिक व करिअर संधी" : "Discover Verified Opportunities"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {language === "mr"
            ? "तुमच्या शिक्षणाशी आणि आवडीशी जुळणाऱ्या खात्रीशीर शासकीय योजना आणि स्पर्धा शोधा."
            : "Search and filter verified scholarships, competitive exams, internships, and skill courses."}
        </p>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
        
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("common.search")}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-civic-600 focus:ring-1 focus:ring-civic-600/30"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
          
          <Select
            label={language === "mr" ? "संधी प्रकार" : "Opportunity Type"}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            label={language === "mr" ? "शैक्षणिक पातळी" : "Education Level"}
            value={selectedEducation}
            onChange={(e) => setSelectedEducation(e.target.value)}
          >
            <option value="ALL">
              {language === "mr" ? "सर्व स्तर (All Levels)" : "All Levels"}
            </option>
            {EDUCATION_LEVELS.map((edu) => (
              <option key={edu.value} value={edu.value}>
                {language === "mr" ? edu.labelMr : edu.labelEn}
              </option>
            ))}
          </Select>

          <Select
            label={t("common.sort")}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="BEST_MATCH">
              {language === "mr" ? "सर्वोत्तम मॅच (Best Match)" : "Best Match"}
            </option>
            <option value="DEADLINE_SOON">
              {language === "mr" ? "लवकर संपणारी मुदत (Deadline Soon)" : "Deadline Soon"}
            </option>
            <option value="NEWEST">
              {language === "mr" ? "नवीनतम (Newest Added)" : "Newest Added"}
            </option>
          </Select>

          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={resetFilters}
              className="w-full text-xs font-semibold"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              {t("common.reset")}
            </Button>
          </div>

        </div>

      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
        <span>
          {sorted.length} {language === "mr" ? "संधी सापडल्या" : "opportunities found"}
        </span>
      </div>

      {/* Grid of Results */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          {t("common.loading")}
        </div>
      ) : sorted.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-slate-200 bg-white space-y-3">
          <p className="text-sm font-semibold text-slate-700">
            {language === "mr"
              ? "निवडलेल्या फिल्टरनुसार कोणतीही संधी आढळली नाही."
              : "No opportunities matched your current search filters."}
          </p>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            {t("common.reset")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      )}

    </div>
  );
}
