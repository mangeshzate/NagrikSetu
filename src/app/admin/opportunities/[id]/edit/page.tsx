"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { dataStore } from "@/lib/database/store";
import { 
  Opportunity, 
  OpportunityType, 
  EducationLevel, 
  VerificationStatus,
  OpportunitySourceClassification,
  RuleOperator, 
  DocumentItem 
} from "@/types/database";
import { EDUCATION_LEVELS } from "@/lib/constants/maharashtra";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Save, Trash2, Plus, ShieldCheck, AlertCircle, FileText, Lock } from "lucide-react";
import { isSafeUrl } from "@/lib/validation/url";

interface EditPageParams {
  params: Promise<{ id: string }>;
}

interface DraftRule {
  field: string;
  operator: RuleOperator;
  value: string;
  humanReadableLabelEn: string;
  humanReadableLabelMr: string;
  required: boolean;
}

export default function EditOpportunityPage({ params }: EditPageParams) {
  const { id } = use(params);
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [titleMr, setTitleMr] = useState("");
  const [type, setType] = useState<OpportunityType>("SCHOLARSHIP");
  const [provider, setProvider] = useState("");
  const [providerMr, setProviderMr] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [shortDescMr, setShortDescMr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionMr, setDescriptionMr] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [deadline, setDeadline] = useState("");
  const [startDate, setStartDate] = useState("");
  const [incomeMax, setIncomeMax] = useState("800000");
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [active, setActive] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("VERIFIED");
  const [sourceClassification, setSourceClassification] = useState<OpportunitySourceClassification>("VERIFIED_REAL_DATA");
  const [deadlineSource, setDeadlineSource] = useState("");
  const [eligibilitySource, setEligibilitySource] = useState("");

  // Catalog Documents & Rules
  const [allDocs, setAllDocs] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [rules, setRules] = useState<DraftRule[]>([]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [opp, docsCatalog, oppRules, oppDocs] = await Promise.all([
          dataStore.getOpportunityById(id),
          dataStore.getAllDocuments(),
          dataStore.getRulesForOpportunity(id),
          dataStore.getDocumentsForOpportunity(id),
        ]);

        if (!opp) {
          setErrorMessage("Opportunity not found");
          return;
        }

        setTitle(opp.title);
        setTitleMr(opp.titleMr || "");
        setType(opp.type);
        setProvider(opp.provider);
        setProviderMr(opp.providerMr || "");
        setShortDesc(opp.shortDescription);
        setShortDescMr(opp.shortDescriptionMr || "");
        setDescription(opp.description);
        setDescriptionMr(opp.descriptionMr || "");
        setOfficialUrl(opp.officialUrl);
        setApplicationUrl(opp.applicationUrl);
        setDeadline(opp.deadline);
        setStartDate(opp.startDate || "");
        setIncomeMax(opp.incomeMax ? String(opp.incomeMax) : "");
        setEducationLevels(opp.educationLevelApplicability);
        setActive(opp.active);
        setVerificationStatus(opp.verificationStatus);
        setSourceClassification(opp.sourceClassification || "VERIFIED_REAL_DATA");
        setDeadlineSource(opp.deadlineSource || "");
        setEligibilitySource(opp.eligibilitySource || "");

        setAllDocs(docsCatalog);
        setSelectedDocIds(oppDocs.map((od) => od.documentId));

        if (oppRules && oppRules.length > 0) {
          setRules(
            oppRules.map((r) => ({
              field: r.field,
              operator: r.operator,
              value: typeof r.value === "object" ? JSON.stringify(r.value) : String(r.value),
              humanReadableLabelEn: r.humanReadableLabelEn,
              humanReadableLabelMr: r.humanReadableLabelMr,
              required: r.required,
            }))
          );
        }
      } catch (e: any) {
        setErrorMessage(e?.message || "Failed to load opportunity");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id]);

  const toggleEducation = (level: EducationLevel) => {
    setEducationLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const toggleDoc = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((i) => i !== docId) : [...prev, docId]
    );
  };

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      {
        field: "academic_percentage",
        operator: "GREATER_THAN_EQUAL",
        value: "60",
        humanReadableLabelEn: "Minimum 60% marks in previous examination",
        humanReadableLabelMr: "मागील परीक्षेत किमान ६०% गुण आवश्यक",
        required: true,
      },
    ]);
  };

  const updateRule = (idx: number, patch: Partial<DraftRule>) => {
    setRules((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    );
  };

  const removeRule = (idx: number) => {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim() || !provider.trim() || !deadline) {
      setErrorMessage("Title, provider, and deadline are required.");
      return;
    }

    // URL validation
    if (!isSafeUrl(officialUrl)) {
      setErrorMessage("Official URL must use valid http:// or https://. Dangerous schemes are prohibited.");
      return;
    }

    if (applicationUrl && !isSafeUrl(applicationUrl)) {
      setErrorMessage("Application URL must use valid http:// or https://. Dangerous schemes are prohibited.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<Opportunity> = {
        title: title.trim(),
        titleMr: titleMr.trim() || undefined,
        type,
        provider: provider.trim(),
        providerMr: providerMr.trim() || undefined,
        shortDescription: shortDesc.trim(),
        shortDescriptionMr: shortDescMr.trim() || undefined,
        description: description.trim() || shortDesc.trim(),
        descriptionMr: descriptionMr.trim() || undefined,
        officialUrl: officialUrl.trim(),
        applicationUrl: applicationUrl.trim() || officialUrl.trim(),
        deadline,
        startDate: startDate || undefined,
        incomeMax: incomeMax ? Number(incomeMax) : undefined,
        educationLevelApplicability: educationLevels,
        active,
        verificationStatus,
        sourceClassification,
        deadlineSource: deadlineSource.trim() || undefined,
        eligibilitySource: eligibilitySource.trim() || undefined,
        verifiedAt: verificationStatus === "VERIFIED" ? new Date().toISOString() : undefined,
      };

      const res = await fetch(`/api/admin/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Fallback to client dataStore
        await dataStore.updateOpportunity(id, payload, user?.id);
      }

      setSuccessMessage("Opportunity updated successfully! Redirecting...");
      setTimeout(() => {
        router.push("/admin/opportunities");
      }, 1200);
    } catch (e: any) {
      setErrorMessage(e?.message || "Failed to update opportunity");
    } finally {
      setIsSubmitting(false);
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

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400">
        Loading opportunity details...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      
      {/* Header */}
      <div>
        <Link
          href="/admin/opportunities"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Opportunities</span>
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 font-marathi">
          Edit Opportunity
        </h1>
        <p className="text-xs text-slate-500">
          Update verified scheme parameters, deadlines, eligibility criteria, and source citations.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Core Metadata */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            1. Core Information & Classification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Title (English) *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 font-marathi">शीर्षक (मराठी)</label>
              <Input
                value={titleMr}
                onChange={(e) => setTitleMr(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Category *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as OpportunityType)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="SCHOLARSHIP">Scholarship</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="GOVERNMENT_EXAM">Govt Exam</option>
                <option value="COMPETITION">Competition</option>
                <option value="COURSE">Free Course</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Provider / Department *</label>
              <Input
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Short Description</label>
              <textarea
                rows={2}
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 font-marathi">संक्षिप्त माहिती (मराठी)</label>
              <textarea
                rows={2}
                value={shortDescMr}
                onChange={(e) => setShortDescMr(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* URLs & Dates */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            2. Verified URLs & Deadlines
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Official Portal URL *</label>
              <Input
                type="url"
                value={officialUrl}
                onChange={(e) => setOfficialUrl(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Direct Application URL</label>
              <Input
                type="url"
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Deadline (YYYY-MM-DD) *</label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Annual Income Ceiling (₹)</label>
              <Input
                type="number"
                value={incomeMax}
                onChange={(e) => setIncomeMax(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Verification & Trust Provenance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            3. Verification & Provenance Citations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Verification Status</label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="VERIFIED">VERIFIED</option>
                <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Source Classification</label>
              <select
                value={sourceClassification}
                onChange={(e) => setSourceClassification(e.target.value as OpportunitySourceClassification)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="VERIFIED_REAL_DATA">VERIFIED_REAL_DATA</option>
                <option value="NEEDS_MANUAL_VERIFICATION">NEEDS_MANUAL_VERIFICATION</option>
                <option value="DEMO_DATA">DEMO_DATA</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Active in Student Portal?</label>
              <select
                value={active ? "true" : "false"}
                onChange={(e) => setActive(e.target.value === "true")}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="true">Active (Visible)</option>
                <option value="false">Inactive (Hidden)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Deadline Citation / Gazette Ref</label>
              <Input
                value={deadlineSource}
                onChange={(e) => setDeadlineSource(e.target.value)}
                placeholder="e.g., MahaDBT Annual Notification 2026"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Eligibility Citation / GR Number</label>
              <Input
                value={eligibilitySource}
                onChange={(e) => setEligibilitySource(e.target.value)}
                placeholder="e.g., Higher Education GR No. TEM-2018/CR.287"
              />
            </div>
          </div>
        </div>

        {/* Education Applicability & Documents */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            4. Education Applicability & Required Documents
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Applicable Education Levels</label>
            <div className="flex flex-wrap gap-2">
              {EDUCATION_LEVELS.map((lvl) => (
                <button
                  type="button"
                  key={lvl.value}
                  onClick={() => toggleEducation(lvl.value)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-colors ${
                    educationLevels.includes(lvl.value)
                      ? "bg-civic-800 text-white border-civic-800"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {lvl.labelEn}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-700">Required Documents from Catalog</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allDocs.map((doc) => (
                <button
                  type="button"
                  key={doc.id}
                  onClick={() => toggleDoc(doc.id)}
                  className={`text-left p-2.5 rounded-xl text-xs border transition-colors flex items-center justify-between ${
                    selectedDocIds.includes(doc.id)
                      ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>{doc.nameEn} ({doc.nameMr})</span>
                  {selectedDocIds.includes(doc.id) && (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/opportunities">
            <Button variant="outline" size="md">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<Save className="w-4 h-4" />}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving Changes..." : "Save Opportunity"}
          </Button>
        </div>

      </form>

    </div>
  );
}
