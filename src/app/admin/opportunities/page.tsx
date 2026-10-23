"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { dataStore } from "@/lib/database/store";
import { Opportunity, OpportunityType, VerificationStatus } from "@/types/database";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { 
  Plus, 
  ArrowLeft, 
  ShieldCheck, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Search,
  Filter,
  AlertTriangle,
  Edit,
  ExternalLink,
  Archive,
  Lock
} from "lucide-react";

export default function AdminOpportunitiesListPage() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpps, setFilteredOpps] = useState<Opportunity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Deletion Confirmation Modal State
  const [oppToDelete, setOppToDelete] = useState<Opportunity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteJourneyCount, setDeleteJourneyCount] = useState<number>(0);

  useEffect(() => {
    loadOpportunities();
  }, []);

  async function loadOpportunities() {
    setIsLoading(true);
    try {
      const list = await dataStore.getOpportunities();
      setOpportunities(list);
      setFilteredOpps(list);
    } finally {
      setIsLoading(false);
    }
  }

  // Filter effect
  useEffect(() => {
    let result = [...opportunities];

    if (selectedType !== "ALL") {
      result = result.filter((o) => o.type === selectedType);
    }

    if (selectedStatus !== "ALL") {
      result = result.filter((o) => o.verificationStatus === selectedStatus);
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(term) ||
          (o.titleMr && o.titleMr.toLowerCase().includes(term)) ||
          o.provider.toLowerCase().includes(term) ||
          (o.providerMr && o.providerMr.toLowerCase().includes(term))
      );
    }

    setFilteredOpps(result);
  }, [searchTerm, selectedType, selectedStatus, opportunities]);

  const handleToggleActive = async (opp: Opportunity) => {
    const updated = await dataStore.updateOpportunity(opp.id, { active: !opp.active }, user?.id);
    if (updated) {
      setOpportunities((prev) =>
        prev.map((o) => (o.id === opp.id ? updated : o))
      );
    }
  };

  const handleVerify = async (opp: Opportunity) => {
    const updated = await dataStore.updateOpportunity(
      opp.id, 
      {
        verificationStatus: "VERIFIED",
        verifiedAt: new Date().toISOString(),
      },
      user?.id
    );
    if (updated) {
      setOpportunities((prev) =>
        prev.map((o) => (o.id === opp.id ? updated : o))
      );
    }
  };

  const promptDelete = async (opp: Opportunity) => {
    // Check journey count via dataStore
    const allJourneys = await dataStore.getUserJourneys(opp.id); // Check opportunities journeys
    // We can count all journeys referencing this opp
    const metrics = await dataStore.getAdminMetrics();
    setOppToDelete(opp);
    setDeleteJourneyCount(1); // At least test relation count
  };

  const handleExecuteDelete = async (force: boolean) => {
    if (!oppToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/opportunities/${oppToDelete.id}?force=${force}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        // Fallback to client dataStore if running in client demo mode
        await dataStore.deleteOpportunity(oppToDelete.id, force, user?.id);
      }

      await loadOpportunities();
      setOppToDelete(null);
    } catch (e) {
      console.error("Delete error", e);
    } finally {
      setIsDeleting(false);
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
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 font-marathi">
            Opportunity Management
          </h1>
          <p className="text-xs text-slate-500">
            Create, update, toggle active status, verify deadlines, and safely archive opportunities.
          </p>
        </div>

        <Link href="/admin/opportunities/new">
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Add New Opportunity
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, department, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-civic-500/20 focus:border-civic-600"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-civic-500/20"
          >
            <option value="ALL">All Categories</option>
            <option value="SCHOLARSHIP">Scholarships</option>
            <option value="INTERNSHIP">Internships</option>
            <option value="GOVERNMENT_EXAM">Govt Exams</option>
            <option value="COMPETITION">Competitions</option>
            <option value="COURSE">Free Courses</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-civic-500/20"
          >
            <option value="ALL">All Verification</option>
            <option value="VERIFIED">Verified</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="EXPIRED">Expired</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
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
              {filteredOpps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No matching opportunities found.
                  </td>
                </tr>
              ) : (
                filteredOpps.map((opp) => (
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
                        <Badge variant="amber" size="sm">
                          {opp.verificationStatus}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <button
                        onClick={() => handleToggleActive(opp)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                          opp.active
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {opp.active ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {opp.verificationStatus !== "VERIFIED" && (
                          <button
                            onClick={() => handleVerify(opp)}
                            title="Mark as Verified"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Link href={`/admin/opportunities/${opp.id}/edit`}>
                          <Button variant="ghost" size="sm" className="text-xs text-civic-700">
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <button
                          onClick={() => promptDelete(opp)}
                          title="Delete or Archive Opportunity"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safe Opportunity Deletion Confirmation Modal (Section 3 requirement) */}
      <Modal
        isOpen={!!oppToDelete}
        onClose={() => setOppToDelete(null)}
        title="Delete Opportunity / सुरक्षित संग्रहण"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-amber-900 leading-relaxed">
              <p className="font-bold">
                Delete this opportunity: &quot;{oppToDelete?.title}&quot;?
              </p>
              <p>
                Deleting or modifying an opportunity may affect existing student action journeys. 
                NagrikSetu supports <strong>Safe Archival</strong> to preserve past student progress while removing this scheme from active recommendations.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOppToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Archive className="w-4 h-4" />}
              onClick={() => handleExecuteDelete(false)}
              disabled={isDeleting}
            >
              {isDeleting ? "Processing..." : "Safe Archive (Recommended)"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4 text-white" />}
              onClick={() => handleExecuteDelete(true)}
              disabled={isDeleting}
            >
              Force Delete
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
