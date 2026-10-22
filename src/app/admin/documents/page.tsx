"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { dataStore } from "@/lib/database/store";
import { DocumentItem } from "@/types/database";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Plus, FileText, CheckCircle2, Lock } from "lucide-react";

export default function AdminDocumentsPage() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [key, setKey] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameMr, setNameMr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionMr, setDescriptionMr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    dataStore.getAllDocuments().then(setDocuments);
  }, []);

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !nameEn.trim()) return;
    setIsSubmitting(true);
    try {
      const newDoc = await dataStore.createDocument({
        key: key.trim().toLowerCase().replace(/\s+/g, "_"),
        nameEn,
        nameMr: nameMr || nameEn,
        descriptionEn,
        descriptionMr: descriptionMr || descriptionEn,
      });
      setDocuments((prev) => [...prev, newDoc]);
      setKey("");
      setNameEn("");
      setNameMr("");
      setDescriptionEn("");
      setDescriptionMr("");
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <Lock className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Admin Authorization Required</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 space-y-8 pb-20">
      
      {/* Top Header */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Admin Overview</span>
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 font-marathi">
          Document Requirements Catalog
        </h1>
        <p className="text-xs text-slate-500">
          Standardized checklist of official certificates and student records required for Maharashtra opportunities.
        </p>
      </div>

      {isAdded && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Document added to catalog successfully!</span>
        </div>
      )}

      {/* Add New Document Form */}
      <form onSubmit={handleCreateDoc} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
          <Plus className="w-4 h-4 text-civic-700" />
          <span>Add New Document Type</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="System Key (e.g. non_creamy_layer)"
            required
            placeholder="non_creamy_layer"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <Input
            label="Document Name (English)"
            required
            placeholder="Non-Creamy Layer Certificate"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
          />
          <Input
            label="Document Name (मराठी)"
            placeholder="non-creamy layer दाखला"
            value={nameMr}
            onChange={(e) => setNameMr(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Description (English)"
            placeholder="Official validity certificate..."
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
          />
          <Input
            label="Description (मराठी)"
            placeholder="अधिकृत सक्षम प्राधिकरणाने दिलेला..."
            value={descriptionMr}
            onChange={(e) => setDescriptionMr(e.target.value)}
          />
        </div>

        <div className="flex justify-end pt-1">
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Save Document to Catalog
          </Button>
        </div>
      </form>

      {/* Existing Documents List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-civic-700" />
          <span>Catalog Documents ({documents.length})</span>
        </h2>

        <div className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <div key={doc.id} className="py-3.5 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{doc.nameEn}</span>
                  <span className="text-[11px] font-semibold text-slate-600 font-marathi">
                    ({doc.nameMr})
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {doc.descriptionEn || "Standard document"}
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                {doc.key}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
