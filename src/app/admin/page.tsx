"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { dataStore } from "@/lib/database/store";
import { Opportunity } from "@/types/database";
import { calculateDeadlineStatus } from "@/lib/deadlines/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  ShieldCheck, 
  Users, 
  FolderCheck, 
  Clock, 
  MapPin, 
  Plus, 
  FileText, 
  ExternalLink,
  Lock,
  ArrowRight
} from "lucide-react";

export default function AdminDashboardPage() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    activeOpportunities: 0,
    expiringSoon: 0,
    activeJourneys: 0,
    opportunitiesNeedingVerification: 0,
  });
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [m, opps] = await Promise.all([
          dataStore.getAdminMetrics(),
          dataStore.getOpportunities(),
        ]);
        setMetrics(m);
        setOpportunities(opps);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Protected Admin Route Check (Section 8 requirement)
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="py-20 max-w-md mx-auto text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">
            {language === "mr" ? "प्रशासक परवानगी आवश्यक" : "Admin Authorization Required"}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {language === "mr"
              ? "हे पृष्ठ केवळ नागरिकसेतू प्रशासकांसाठी आरक्षित आहे. कृपया प्रशासक खात्याने लॉगिन करा."
              : "This area is restricted to NagrikSetu administrators. Please sign in with an administrator account."}
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/login">
            <Button size="sm" variant="primary">
              {language === "mr" ? "प्रशासक लॉगिन करा" : "Switch to Admin"}
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm" variant="outline">
              {language === "mr" ? "विद्यार्थी डॅशबोर्ड" : "Student Dashboard"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Admin Portal</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-marathi">
            {t("admin.title")}
          </h1>
          <p className="text-xs text-slate-500">
            {t("admin.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/opportunities/new">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              {t("admin.addOpportunity")}
            </Button>
          </Link>
          <Link href="/admin/documents">
            <Button size="sm" variant="outline" leftIcon={<FileText className="w-4 h-4" />}>
              {t("admin.manageDocs")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Grid (Section 31 requirement) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t("admin.totalUsers")}
            </span>
            <Users className="w-4 h-4 text-civic-700" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            {metrics.totalStudents}
          </p>
          <span className="text-[11px] text-slate-400">Maharashtra students</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t("admin.activeOpps")}
            </span>
            <FolderCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            {metrics.activeOpportunities}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold">100% verified</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t("admin.expiringSoon")}
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            {metrics.expiringSoon}
          </p>
          <span className="text-[11px] text-amber-700 font-semibold">≤ 7 days left</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t("admin.activeJourneys")}
            </span>
            <MapPin className="w-4 h-4 text-civic-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            {metrics.activeJourneys}
          </p>
          <span className="text-[11px] text-slate-400">Student roadmaps</span>
        </div>

      </div>

      {/* Opportunities Management Table / Card List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {language === "mr" ? "सर्व नोंदणीकृत संधी" : "Managed Opportunities"}
            </h3>
            <p className="text-xs text-slate-500">
              {language === "mr" ? "संधींचे संपादन करा किंवा नवीन जोडा." : "Review active schemes and status."}
            </p>
          </div>

          <Link href="/admin/opportunities">
            <Button size="sm" variant="outline" className="text-xs">
              {language === "mr" ? "सविस्तर व्यवस्थापन" : "Manage All"} →
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-100">
              <tr>
                <th className="py-3 px-3">Title / Opportunity</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Deadline</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opportunities.map((opp) => {
                const deadline = calculateDeadlineStatus(opp.deadline);
                return (
                  <tr key={opp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                      <Link href={`/opportunities/${opp.slug}`} className="hover:text-civic-700 line-clamp-1">
                        {opp.title}
                      </Link>
                      <span className="text-[11px] text-slate-400 block font-normal truncate">
                        {opp.provider}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="emerald" size="sm">
                        {opp.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-800">{deadline.formattedDateEn}</span>
                      <span className="block text-[10px] text-slate-400">
                        {deadline.badgeLabelEn}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {opp.verificationStatus === "VERIFIED" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>VERIFIED</span>
                        </span>
                      ) : (
                        <Badge variant="amber" size="sm">
                          {opp.verificationStatus}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <Link href={`/opportunities/${opp.slug}`}>
                        <Button variant="ghost" size="sm" className="text-xs text-civic-700">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
