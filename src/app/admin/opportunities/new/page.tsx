"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { dataStore } from "@/lib/database/store";
import { 
  OpportunityType, 
  EducationLevel, 
  CurrentYear, 
  RuleOperator, 
  DocumentItem 
} from "@/types/database";
import { EDUCATION_LEVELS, CURRENT_YEARS } from "@/lib/constants/maharashtra";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Plus, Trash2, CheckCircle2, ShieldCheck, FileText } from "lucide-react";
import { isSafeUrl } from "@/lib/validation/url";

interface DraftRule {
  field: string;
  operator: RuleOperator;
  value: string;
  humanReadableLabelEn: string;
  humanReadableLabelMr: string;
  required: boolean;
}

export default function NewOpportunityPage() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  // Opportunity Fields
  const [title, setTitle] = useState("");
  const [titleMr, setTitleMr] = useState("");
  const [type, setType] = useState<OpportunityType>("SCHOLARSHIP");
  const [provider, setProvider] = useState("");
  const [providerMr, setProviderMr] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [shortDescMr, setShortDescMr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionMr, setDescriptionMr] = useState("");
  const [officialUrl, setOfficialUrl] = useState("https://mahadbt.maharashtra.gov.in");
  const [applicationUrl, setApplicationUrl] = useState("https://mahadbt.maharashtra.gov.in");
  const [deadline, setDeadline] = useState("2026-11-30");
  const [incomeMax, setIncomeMax] = useState("800000");
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>(["Diploma", "Undergraduate"]);

  // Catalog Documents
  const [allDocs, setAllDocs] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(["doc_marksheet", "doc_income", "doc_domicile"]);

  // Dynamic Rule Builder (Section 33 requirement)
  const [rules, setRules] = useState<DraftRule[]>([
    {
      field: "state",
      operator: "EQUALS",
      value: "Maharashtra",
      humanReadableLabelEn: "Must be a resident of Maharashtra state",
      humanReadableLabelMr: "महाराष्ट्र राज्याचा रहिवासी असणे आवश्यक आहे",
      required: true,
    },
    {
      field: "family_income_max",
      operator: "LESS_THAN_EQUAL",
      value: "800000",
      humanReadableLabelEn: "Annual family income must not exceed ₹8,00,000",
      humanReadableLabelMr: "वार्षिक कौटुंबिक उत्पन्न ₹८,००,००० च्या आत असावे",
      required: true,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dataStore.getAllDocuments().then(setAllDocs);
  }, []);

  const toggleEducation = (level: EducationLevel) => {
    setEducationLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const toggleDoc = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      {
        field: "academic_percentage",
        operator: "GREATER_THAN_EQUAL",
        value: "60",
        humanReadableLabelEn: "Minimum 60% marks in previous exam",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !provider.trim()) {
      alert("Please fill in title and provider");
      return;
    }

    if (!isSafeUrl(officialUrl) || !isSafeUrl(applicationUrl)) {
      alert("Security warning: Both Official URL and Application URL must use valid http:// or https:// schemes. Dangerous schemes (javascript:, data:) are rejected.");
      return;
    }

    setIsSubmitting(true);
    try {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // 1. Create opportunity
      const opp = await dataStore.createOpportunity({
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        title,
        titleMr: titleMr || title,
        type,
        provider,
        providerMr: providerMr || provider,
        shortDescription: shortDesc || title,
        shortDescriptionMr: shortDescMr || titleMr || title,
        description: description || shortDesc || title,
        descriptionMr: descriptionMr || shortDescMr || titleMr,
        officialUrl,
        applicationUrl,
        deadline,
        stateApplicability: ["Maharashtra"],
        educationLevelApplicability: educationLevels,
        currentYearApplicability: ["First Year", "Second Year", "Third Year", "Final Year"],
        incomeMax: incomeMax ? parseFloat(incomeMax) : 0,
        active: true,
        verificationStatus: "VERIFIED",
        verifiedAt: new Date().toISOString(),
      });

      // 2. Create eligibility rules
      for (let i = 0; i < rules.length; i++) {
        const r = rules[i];
        let parsedVal: any = r.value;
        if (r.operator === "LESS_THAN_EQUAL" || r.operator === "GREATER_THAN_EQUAL") {
          parsedVal = Number(r.value);
        } else if (r.operator === "IN") {
          parsedVal = r.value.split(",").map((s) => s.trim());
        }

        await dataStore.createRule({
          opportunityId: opp.id,
          field: r.field,
          operator: r.operator,
          value: parsedVal,
          humanReadableLabelEn: r.humanReadableLabelEn,
          humanReadableLabelMr: r.humanReadableLabelMr,
          required: r.required,
          sortOrder: i + 1,
        });
      }

      // 3. Link documents
      for (const docId of selectedDocIds) {
        await dataStore.addOpportunityDocument(opp.id, docId, true);
      }

      router.push("/admin/opportunities");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== "ADMIN") {
    return <div className="p-8 text-center text-xs">Admin access required.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 space-y-8 pb-20">
      
      {/* Top Header */}
      <div>
        <Link
          href="/admin/opportunities"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Opportunities</span>
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 font-marathi">
          Add New Educational Opportunity
        </h1>
        <p className="text-xs text-slate-500">
          Define verified scheme details, deterministic eligibility rules, and required documents.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Basic Information */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-civic-700" />
            <span>1. Basic Opportunity Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Opportunity Title (English)"
              required
              placeholder="e.g. MahaDBT Merit Scheme"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Input
              label="Opportunity Title (मराठी)"
              placeholder="उदा. महाडीबीटी गुणवत्ता शिष्यवृत्ती"
              value={titleMr}
              onChange={(e) => setTitleMr(e.target.value)}
            />

            <Select
              label="Opportunity Domain / Type"
              value={type}
              onChange={(e) => setType(e.target.value as OpportunityType)}
            >
              <option value="SCHOLARSHIP">Scholarship (शिष्यवृत्ती)</option>
              <option value="INTERNSHIP">Internship (इंटर्नशिप)</option>
              <option value="GOVERNMENT_EXAM">Government Exam (शासकीय परीक्षा)</option>
              <option value="COMPETITION">Competition (स्पर्धा)</option>
              <option value="COURSE">Skill Course (कौशल्य कोर्स)</option>
            </Select>

            <Input
              label="Provider Organization (e.g. DTE Maharashtra)"
              required
              placeholder="e.g. Higher Education Dept"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            />

            <Input
              label="Official Information Source URL"
              type="url"
              required
              placeholder="https://mahadbt.maharashtra.gov.in"
              value={officialUrl}
              onChange={(e) => setOfficialUrl(e.target.value)}
            />

            <Input
              label="Official Online Application URL"
              type="url"
              required
              placeholder="https://mahadbt.maharashtra.gov.in/apply"
              value={applicationUrl}
              onChange={(e) => setApplicationUrl(e.target.value)}
            />

            <Input
              label="Application Closing Deadline (Date)"
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />

            <Input
              label="Maximum Family Income Limit (₹) (0 for none)"
              type="number"
              placeholder="800000"
              value={incomeMax}
              onChange={(e) => setIncomeMax(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Short Summary Description
            </label>
            <textarea
              rows={2}
              required
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Brief summary of eligibility and benefit..."
              className="block w-full rounded-lg border border-slate-300 p-3 text-xs sm:text-sm focus:outline-none focus:border-civic-600 focus:ring-1 focus:ring-civic-600/30"
            />
          </div>

          {/* Education level checkboxes */}
          <div className="space-y-2 pt-2">
            <label className="block text-sm font-medium text-slate-700">
              Applicable Education Levels
            </label>
            <div className="flex flex-wrap gap-2">
              {EDUCATION_LEVELS.map((edu) => {
                const checked = educationLevels.includes(edu.value);
                return (
                  <button
                    key={edu.value}
                    type="button"
                    onClick={() => toggleEducation(edu.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      checked
                        ? "bg-civic-100 text-civic-900 border-civic-400"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {edu.labelEn}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Eligibility Rule Builder (Section 33 requirement) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>2. Deterministic Eligibility Rules</span>
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRule}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Rule
            </Button>
          </div>

          <p className="text-xs text-slate-500">
            Rules are deterministically evaluated by the engine. Students missing required fields will be prompted for clarification.
          </p>

          <div className="space-y-4">
            {rules.map((rule, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700">Rule #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeRule(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select
                    label="Field"
                    value={rule.field}
                    onChange={(e) => updateRule(idx, { field: e.target.value })}
                  >
                    <option value="state">State (state)</option>
                    <option value="district">District (district)</option>
                    <option value="family_income_max">Family Income (family_income_max)</option>
                    <option value="academic_percentage">Academic Marks % (academic_percentage)</option>
                    <option value="education_level">Education Level (education_level)</option>
                    <option value="category">Category / Reservation (category)</option>
                  </Select>

                  <Select
                    label="Operator"
                    value={rule.operator}
                    onChange={(e) => updateRule(idx, { operator: e.target.value as RuleOperator })}
                  >
                    <option value="EQUALS">EQUALS (=)</option>
                    <option value="LESS_THAN_EQUAL">LESS_THAN_EQUAL (&lt;=)</option>
                    <option value="GREATER_THAN_EQUAL">GREATER_THAN_EQUAL (&gt;=)</option>
                    <option value="IN">IN (One of list)</option>
                    <option value="BETWEEN">BETWEEN (Range)</option>
                  </Select>

                  <Input
                    label="Target Value"
                    value={rule.value}
                    onChange={(e) => updateRule(idx, { value: e.target.value })}
                    placeholder="e.g. Maharashtra or 250000"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Human-Readable Label (English)"
                    value={rule.humanReadableLabelEn}
                    onChange={(e) => updateRule(idx, { humanReadableLabelEn: e.target.value })}
                    placeholder="e.g. Must be a Maharashtra resident"
                  />
                  <Input
                    label="Human-Readable Label (मराठी)"
                    value={rule.humanReadableLabelMr}
                    onChange={(e) => updateRule(idx, { humanReadableLabelMr: e.target.value })}
                    placeholder="उदा. महाराष्ट्राचा रहिवासी असणे आवश्यक"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Document Requirement Selector (Section 34 requirement) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-civic-700" />
            <span>3. Required Documents</span>
          </h2>

          <p className="text-xs text-slate-500">
            Select the mandatory documents students must gather for this opportunity.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {allDocs.map((doc) => {
              const isSelected = selectedDocIds.includes(doc.id);
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => toggleDoc(doc.id)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-civic-50 border-civic-500 text-civic-900 shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span className="truncate pr-2">{doc.nameEn} ({doc.nameMr})</span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-civic-600 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end gap-3">
          <Link href="/admin/opportunities">
            <Button type="button" variant="outline" size="md">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="font-bold shadow-md"
          >
            Save & Publish Verified Opportunity
          </Button>
        </div>

      </form>

    </div>
  );
}
