"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { AssistantDrawer } from "@/components/assistant/AssistantDrawer";
import { Bot, ShieldCheck } from "lucide-react";

function AssistantContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { language, t } = useLanguage();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-civic-700 bg-civic-50 px-2.5 py-1 rounded-md border border-civic-200">
          <Bot className="w-3.5 h-3.5" />
          <span>{language === "mr" ? "नागरिकसेतू AI सहाय्यक" : "Verified Civic AI"}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-marathi">
          {t("nav.assistant")}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {language === "mr"
            ? "तुमची समस्या किंवा प्रश्न सांगा. आमची प्रणाली खात्रीशीर डेटाबेसमधून योग्य मार्ग सुचवेल."
            : "Tell us your student questions. We provide grounded guidance backed by verified schemes and rules."}
        </p>
      </div>

      <div className="h-[620px] rounded-2xl shadow-sm overflow-hidden">
        <AssistantDrawer initialPrompt={initialQuery} />
      </div>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading...</div>}>
      <AssistantContent />
    </Suspense>
  );
}
