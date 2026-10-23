"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { dataStore } from "@/lib/database/store";
import { Opportunity, AuditLog } from "@/types/database";
import { calculateDeadlineStatus } from "@/lib/deadlines/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  ShieldCheck, 
  Users, 
  FolderCheck, 
  Clock, 
  Plus, 
  FileText, 
  Lock,
  ArrowRight,
  AlertTriangle,
  History,
  Archive,
  Search,
  ExternalLink
} from "lucide-react";

export default function AdminDashboardPage() {
  const { language, t } = useLanguage();
  const { user } = useAuth();

  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    activeOpportunities: 0,
    opportunitiesNeedingVerification: 0,
    expiredOpportunities: 0,
    expiringSoon: 0,
    totalJourneysStarted: 0,
    activeJourneys: 0,
  });
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [m, opps, logs] = await Promise.all([
          dataStore.getAdminMetrics(),
          dataStore.getOpportunities(),
          dataStore.getAuditLogs(5),
        ]);
        setMetrics(m);
        setOpportunities(opps);
        setAuditLogs(logs);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Multi-layer client guard (Server guard is already enforced by middleware.ts)
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
            <span className="text-xs text-slate-400">
              Logged in as <strong className="text-slate-700">{user.name}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-marathi">
            {language === "mr" ? "प्रशासक नियंत्रण केंद्र" : "Administration Dashboard"}
          </h1>
          <p className="text-xs text-slate-500">
            {language === "mr"
              ? "संधी व्यवस्थापन, विद्यार्थी निर्देशिका, कागदपत्र पडताळणी आणि ऑडिट लॉग्ज."
              : "Opportunity management, student directory, requirements, and compliance audit trail."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/opportunities/new">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              {language === "mr" ? "नवीन संधी जोडा" : "Add Opportunity"}
            </Button>
          </Link>
          <Link href="/admin/students">
            <Button size="sm" variant="outline" leftIcon={<Users className="w-4 h-4" />}>
              {language === "mr" ? "विद्यार्थी व्यवस्थापन" : "Manage Students"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Metrics Cards (Section 1 requirement) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        
        {/* Total Students */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {language === "mr" ? "एकूण विद्यार्थी" : "Total Students"}
            </span>
            <Users className="w-4 h-4 text-civic-700" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            {metrics.totalStudents}
          </p>
          <span className="text-[10px] text-slate-400 block truncate">
            {language === "mr" ? "नोंदणीकृत खाती" : "Registered accounts"}
          </span>
        </div>

        {/* Active Opportunities */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {language === "mr" ? "सक्रिय संधी" : "Active Opportunities"}
            </span>
            <FolderCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            {metrics.activeOpportunities}
          </p>
          <span className="text-[10px] text-emerald-700 font-semibold block truncate">
            {language === "mr" ? "विद्यार्थ्यांना दृश्यमान" : "Active for students"}
          </span>
        </div>

        {/* Opportunities Needing Review */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {language === "mr" ? "पडताळणी प्रलंबित" : "Needs Review"}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            {metrics.opportunitiesNeedingVerification}
          </p>
          <span className="text-[10px] text-amber-700 font-semibold block truncate">
            {language === "mr" ? "तपासणी आवश्यक" : "Manual verification"}
          </span>
        </div>

        {/* Expired Opportunities */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {language === "mr" ? "मुदत संपलेल्या" : "Expired"}
            </span>
            <Archive className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            {metrics.expiredOpportunities}
          </p>
          <span className="text-[10px] text-rose-700 font-semibold block truncate">
            {language === "mr" ? "अर्जाची मुदत संपली" : "Closed / Archived"}
          </span>
        </div>

        {/* Total Journeys Started */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {language === "mr" ? "सुरू झालेले मार्ग" : "Journeys Started"}
            </span>
            <Clock className="w-4 h-4 text-civic-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            {metrics.totalJourneysStarted}
          </p>
          <span className="text-[10px] text-slate-400 block truncate">
            {metrics.activeJourneys} {language === "mr" ? "प्रगतीपथावर" : "in progress"}
          </span>
        </div>

      </div>

      {/* Primary Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Link 
          href="/admin/opportunities" 
          className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-civic-500 hover:shadow-md transition-all space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-civic-50 text-civic-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FolderCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-civic-800 flex items-center gap-1.5">
              <span>{language === "mr" ? "संधी व्यवस्थापन" : "Manage Opportunities"}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === "mr"
                ? "नवीन संधी जोडा, सक्रिय/निष्क्रिय करा, संपादन करा किंवा सुरक्षित संग्रहण करा."
                : "Create, edit, toggle active status, and safely archive opportunities."}
            </p>
          </div>
        </Link>

        <Link 
          href="/admin/students" 
          className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-civic-500 hover:shadow-md transition-all space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 flex items-center gap-1.5">
              <span>{language === "mr" ? "विद्यार्थी व्यवस्थापन" : "Manage Students"}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === "mr"
                ? "नोंदणीकृत विद्यार्थी यादी, गोपनीयता-सुरक्षित माहिती आणि खाते व्यवस्थापन."
                : "Privacy-conscious student directory, search, and safe account deletion."}
            </p>
          </div>
        </Link>

        <Link 
          href="/admin/documents" 
          className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-civic-500 hover:shadow-md transition-all space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-800 flex items-center gap-1.5">
              <span>{language === "mr" ? "कागदपत्र कॅटलॉग" : "Documents / Requirements"}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === "mr"
                ? "शासकीय दाखले, उत्पन्न प्रमाणपत्र, अधिवास आणि आवश्यक कागदपत्रे व्यवस्थापित करा."
                : "Inspect required certificates, domicile, income proof, and marksheet rules."}
            </p>
          </div>
        </Link>

        <Link 
          href="/admin/opportunities?status=NEEDS_REVIEW" 
          className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 flex items-center gap-1.5">
              <span>{language === "mr" ? "माहिती पडताळणी रांग" : "Data Verification"}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === "mr"
                ? "सरकारी संकेतस्थळांवरून मुदतीची आणि पात्रतेची अचूक खात्री करून प्रमाणित करा."
                : "Review simulated or tentative dates against official department gazettes."}
            </p>
          </div>
        </Link>

      </div>

      {/* Two Column Section: Recent Opportunities & Security Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Opportunities Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === "mr" ? "अलीकडील संधी" : "Recent Opportunities"}
              </h3>
              <p className="text-xs text-slate-500">
                {language === "mr" ? "सक्रिय व पुनरावलोकनाधीन शासकीय योजना." : "Active and pending opportunity records."}
              </p>
            </div>
            <Link href="/admin/opportunities">
              <Button size="sm" variant="ghost" className="text-xs text-civic-700">
                {language === "mr" ? "सर्व पहा" : "View All"} →
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-2">Type</th>
                  <th className="py-2.5 px-2">Deadline</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opportunities.slice(0, 5).map((opp) => {
                  const dl = calculateDeadlineStatus(opp.deadline);
                  return (
                    <tr key={opp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 max-w-[200px] font-semibold text-slate-900">
                        <Link href={`/admin/opportunities/${opp.id}/edit`} className="hover:text-civic-700 block truncate">
                          {opp.title}
                        </Link>
                        <span className="text-[10px] text-slate-400 block truncate font-normal">
                          {opp.provider}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="emerald" size="sm">
                          {opp.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        <span className="font-medium text-slate-800">{dl.formattedDateEn}</span>
                      </td>
                      <td className="py-3 px-2">
                        {opp.active ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            INACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <Link href={`/admin/opportunities/${opp.id}/edit`}>
                          <Button variant="ghost" size="sm" className="text-xs text-civic-700">
                            Edit
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

        {/* Right: Security Audit Log Trail */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-civic-700" />
              <h3 className="text-sm font-bold text-slate-900">
                {language === "mr" ? "सुरक्षा ऑडिट नोंद" : "Admin Audit Trail"}
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Latest 5 events</span>
          </div>

          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No destructive administrative operations logged yet.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 truncate">
                    Target: <span className="font-semibold">{log.targetResourceType}</span> ({log.targetResourceId})
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
