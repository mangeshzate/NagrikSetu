"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { dataStore } from "@/lib/database/store";
import { Journey } from "@/types/database";
import { JourneyCard } from "@/components/journeys/JourneyCard";
import { Button } from "@/components/ui/Button";
import { MapPin, Compass, CheckCircle2, Clock } from "lucide-react";

export default function JourneysPage() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setIsLoading(true);
      try {
        const list = await dataStore.getUserJourneys(user.id);
        setJourneys(list);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user]);

  const activeJourneys = journeys.filter((j) => j.status === "IN_PROGRESS");
  const completedJourneys = journeys.filter((j) => j.status === "COMPLETED");

  const displayed = activeTab === "ACTIVE" ? activeJourneys : completedJourneys;

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-civic-700 bg-civic-50 px-2.5 py-1 rounded-md border border-civic-200">
          <MapPin className="w-3.5 h-3.5" />
          <span>{language === "mr" ? "माझा कृती आराखडा" : "Action Roadmap"}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-marathi">
          {t("nav.journeys")}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {language === "mr"
            ? "तुम्ही निवडलेल्या प्रत्येक संधीचा टप्प्याटप्प्याने पाठपुरावा करा आणि प्रगती नोंदवा."
            : "Track your step-by-step progress towards completing verified opportunity applications."}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("ACTIVE")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "ACTIVE"
              ? "bg-civic-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{language === "mr" ? "सक्रिय प्रवास" : "In Progress"}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-xs">
            {activeJourneys.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("COMPLETED")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "COMPLETED"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{language === "mr" ? "पूर्ण झालेले" : "Completed"}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-xs">
            {completedJourneys.length}
          </span>
        </button>
      </div>

      {/* Journeys Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          {t("common.loading")}
        </div>
      ) : displayed.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              {activeTab === "ACTIVE"
                ? language === "mr"
                  ? "सध्या कोणताही सक्रिय प्रवास नाही"
                  : "No active journeys in progress"
                : language === "mr"
                ? "अजून कोणताही प्रवास पूर्ण झालेला नाही"
                : "No completed journeys yet"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {language === "mr"
                ? "तुमच्यासाठी सुचवलेल्या संधी पहा आणि थेट 'प्रवास सुरू करा' वर क्लिक करा."
                : "Explore opportunities and click 'Start Action Journey' to track your application roadmap."}
            </p>
          </div>
          <Link href="/discover">
            <Button size="sm" variant="primary">
              {t("hero.cta.secondary")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {displayed.map((journey) => (
            <JourneyCard key={journey.id} journey={journey} />
          ))}
        </div>
      )}

    </div>
  );
}
