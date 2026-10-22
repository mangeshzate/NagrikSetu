"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { dataStore } from "@/lib/database/store";
import { Opportunity, Journey } from "@/types/database";
import { calculateOpportunityMatch } from "@/lib/matching/engine";
import { calculateDeadlineStatus } from "@/lib/deadlines/utils";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { JourneyCard } from "@/components/journeys/JourneyCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  Sparkles, 
  Clock, 
  MapPin, 
  Compass, 
  AlertTriangle, 
  User, 
  ArrowRight, 
  Search,
  Bot
} from "lucide-react";

export default function DashboardPage() {
  const { language, t } = useLanguage();
  const { user, studentProfile, userInterests } = useAuth();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [quickQuery, setQuickQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const opps = await dataStore.getOpportunities();
        setOpportunities(opps);

        if (user) {
          const userJourneys = await dataStore.getUserJourneys(user.id);
          setJourneys(userJourneys);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Compute recommended opportunities sorted by match score
  const recommendedOpps = [...opportunities]
    .filter((o) => o.active)
    .map((opp) => ({
      opp,
      match: calculateOpportunityMatch(studentProfile, opp, userInterests),
    }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 4)
    .map((item) => item.opp);

  // Compute urgent deadlines (closing in <= 7 days)
  const urgentOpps = opportunities
    .filter((o) => o.active)
    .map((o) => ({
      opp: o,
      deadlineStatus: calculateDeadlineStatus(o.deadline),
    }))
    .filter((item) => !item.deadlineStatus.isExpired && item.deadlineStatus.isUrgent)
    .sort((a, b) => a.deadlineStatus.daysRemaining - b.deadlineStatus.daysRemaining);

  const activeJourneys = journeys.filter((j) => j.status === "IN_PROGRESS");

  return (
    <div className="space-y-8 sm:space-y-10 pb-12">
      
      {/* 1. Welcome Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-civic-800 via-civic-900 to-slate-900 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-civic-200">
                {studentProfile?.district || "Maharashtra"} • {studentProfile?.educationLevel || "Student"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-marathi">
              {t("dashboard.welcome")}, {user?.name || "विद्यार्थी"}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {t("dashboard.headline")}
            </p>
          </div>

          <Link href="/profile">
            <Button size="sm" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs shrink-0">
              <User className="w-3.5 h-3.5 mr-1" />
              <span>{language === "mr" ? "माझी प्रोफाइल" : "View Profile"}</span>
            </Button>
          </Link>
        </div>

        {/* 2. Quick Ask NagrikSetu Search Box */}
        <div className="pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (quickQuery.trim()) {
                window.location.href = `/assistant?q=${encodeURIComponent(quickQuery)}`;
              }
            }}
            className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-md"
          >
            <div className="pl-3 text-civic-700">
              <Bot className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder={t("dashboard.askPlaceholder")}
              className="flex-1 px-2 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <Button type="submit" variant="primary" size="sm" className="font-bold shrink-0">
              {t("dashboard.askBtn")}
            </Button>
          </form>
        </div>
      </div>

      {/* 3. Urgent Deadlines Banner (if any closing within 7 days) */}
      {urgentOpps.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{t("dashboard.urgentDeadlines")}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {urgentOpps.map(({ opp, deadlineStatus }) => (
              <Link
                key={opp.id}
                href={`/opportunities/${opp.slug}`}
                className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-rose-900 line-clamp-1">
                    {language === "mr" && opp.titleMr ? opp.titleMr : opp.title}
                  </span>
                  <p className="text-[11px] text-slate-500">{opp.provider}</p>
                </div>
                <Badge variant="rose" size="sm">
                  {language === "mr" ? deadlineStatus.badgeLabelMr : deadlineStatus.badgeLabelEn}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 4. Active Action Journeys Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-civic-600"></div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-marathi">
              {t("dashboard.activeJourneys")}
            </h2>
          </div>

          <Link href="/journeys" className="text-xs font-bold text-civic-700 hover:underline flex items-center gap-1">
            <span>{t("dashboard.viewAll")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeJourneys.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center space-y-3">
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              {t("dashboard.noJourneys")}
            </p>
            <Link href="/discover">
              <Button size="sm" variant="outline" className="font-semibold">
                {t("hero.cta.secondary")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeJourneys.map((j) => (
              <JourneyCard key={j.id} journey={j} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Recommended For You Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-marathi">
              {t("dashboard.recommended")}
            </h2>
          </div>

          <Link href="/discover" className="text-xs font-bold text-civic-700 hover:underline flex items-center gap-1">
            <span>{t("dashboard.viewAll")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            {t("common.loading")}
          </div>
        ) : recommendedOpps.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            {t("dashboard.noRecommendations")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {recommendedOpps.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
