"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { dataStore } from "@/lib/database/store";
import { Opportunity } from "@/types/database";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  Plus, 
  ArrowLeft, 
  ShieldCheck, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Lock
} from "lucide-react";

export default function AdminOpportunitiesListPage() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
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

  const handleToggleActive = async (opp: Opportunity) => {
    const updated = await dataStore.updateOpportunity(opp.id, { active: !opp.active });
    if (updated) {
      setOpportunities((prev) =>
        prev.map((o) => (o.id === opp.id ? updated : o))
      );
    }
  };

  const handleVerify = async (opp: Opportunity) => {
    const updated = await dataStore.updateOpportunity(opp.id, {
      verificationStatus: "VERIFIED",
      verifiedAt: new Date().toISOString(),
    });
    if (updated) {
      setOpportunities((prev) =>
        prev.map((o) => (o.id === opp.id ? updated : o))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this opportunity?")) {
      const ok = await dataStore.deleteOpportunity(id);
      if (ok) {
        setOpportunities((prev) => prev.filter((o) => o.id !== id));
      }
    }
  };

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <Lock className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Admin Authorization Required</h2>
        <Link href="/login">
          <Button size="sm" variant="primary">Login as Admin</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Overview</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 font-marathi">
            Opportunity Management
          </h1>
          <p className="text-xs text-slate-500">
            Activate, disable, verify, or add new opportunities and government schemes.
          </p>
        </div>

        <Link href="/admin/opportunities/new">
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Add New Opportunity
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Opportunity</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-3">Deadline</th>
                <th className="py-3.5 px-3">Verification</th>
                <th className="py-3.5 px-3">Active Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opportunities.map((opp) => (
                <tr key={opp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 max-w-xs font-semibold text-slate-900">
                    <Link href={`/opportunities/${opp.slug}`} className="hover:text-civic-700 block truncate">
                      {opp.title}
                    </Link>
                    <span className="text-[11px] text-slate-400 font-normal truncate block">
                      {opp.provider}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <Badge variant="emerald" size="sm">
                      {opp.type}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {opp.deadline}
                  </td>
                  <td className="py-3.5 px-3">
                    {opp.verificationStatus === "VERIFIED" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleVerify(opp)}
                        className="text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-300 transition-colors"
                      >
                        Click to Verify
                      </button>
                    )}
                  </td>
                  <td className="py-3.5 px-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(opp)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                        opp.active
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {opp.active ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                    <Link href={`/opportunities/${opp.slug}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(opp.id)}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
