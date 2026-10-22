"use client";

import React, { useState, useEffect } from "react";
import { OpportunityDocument, DocumentStatus, UserDocumentState } from "@/types/database";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { dataStore } from "@/lib/database/store";
import { FileText, CheckCircle2, AlertCircle, MinusCircle, ShieldCheck } from "lucide-react";

export interface DocumentChecklistProps {
  documents: OpportunityDocument[];
}

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({ documents }) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<Record<string, DocumentStatus>>({});
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    dataStore.getUserDocumentStatuses(user.id).then((saved) => {
      const map: Record<string, DocumentStatus> = {};
      saved.forEach((s) => {
        map[s.documentId] = s.status;
      });
      setStatuses(map);
    });
  }, [user]);

  const handleStatusChange = async (documentId: string, newStatus: DocumentStatus) => {
    if (!user) return;
    setLoadingDocId(documentId);
    setStatuses((prev) => ({ ...prev, [documentId]: newStatus }));
    try {
      await dataStore.setUserDocumentStatus(user.id, documentId, newStatus);
    } finally {
      setLoadingDocId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-civic-700" />
            <span>{t("opp.requiredDocs")}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === "mr"
              ? "अर्जासाठी आवश्यक कागदपत्रे तयार ठेवा. तुमची तयारी नोंदवण्यासाठी स्थिती निवडा."
              : "Review required documents and mark your checklist readiness."}
          </p>
        </div>

        <div className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 self-start sm:self-auto">
          {documents.length} {language === "mr" ? "कागदपत्रे आवश्यक" : "Documents Required"}
        </div>
      </div>

      {/* Checklist List */}
      <div className="space-y-3">
        {documents.map((od) => {
          const doc = od.document;
          if (!doc) return null;

          const docName = language === "mr" ? doc.nameMr : doc.nameEn;
          const docDesc = language === "mr" ? doc.descriptionMr : doc.descriptionEn;
          const currentStatus = statuses[doc.id] || "MISSING";

          return (
            <div
              key={od.id}
              className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{docName}</span>
                  {od.required && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      {language === "mr" ? "अनिवार्य" : "Mandatory"}
                    </span>
                  )}
                </div>
                {docDesc && <p className="text-[11px] text-slate-500">{docDesc}</p>}
              </div>

              {/* Status Radio Pill Toggle */}
              <div className="flex items-center gap-1.5 shrink-0 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleStatusChange(doc.id, "AVAILABLE")}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                    currentStatus === "AVAILABLE"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{language === "mr" ? "तयार आहे" : "Ready"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange(doc.id, "MISSING")}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                    currentStatus === "MISSING"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>{language === "mr" ? "बाकी आहे" : "Missing"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange(doc.id, "NOT_APPLICABLE")}
                  className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                    currentStatus === "NOT_APPLICABLE"
                      ? "bg-slate-600 text-white shadow-xs"
                      : "text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <MinusCircle className="w-3 h-3" />
                  <span>{language === "mr" ? "लागू नाही" : "N/A"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Privacy Notice (Section 23 requirement) */}
      <div className="pt-2 flex items-start gap-2 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-950">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">{t("opp.docNote")}</p>
      </div>
    </div>
  );
};
