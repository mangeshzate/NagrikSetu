"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { Shield, Lock, Eye, FileCheck, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PrivacyPage() {
  const { language, t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-8 pb-20">
      
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === "mr" ? "मुख्यपृष्ठावर परत जा" : "Back to Home"}</span>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-civic-700 bg-civic-50 px-3 py-1 rounded-md border border-civic-200">
          <Shield className="w-4 h-4 text-civic-700" />
          <span>{language === "mr" ? "नागरिक पारदर्शकता व गोपनीयता तत्त्वे" : "Citizen Privacy & Transparency"}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-marathi">
          {language === "mr" ? "गोपनीयता धोरण व नागरिक जाहीरनामा" : "Privacy Policy & Citizen Charter"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
          {language === "mr"
            ? "नागरिकसेतूचे ब्रीदवाक्य: 'किमान आवश्यक माहिती, कमाल पारदर्शकता आणि विद्यार्थ्यांचे संपूर्ण नियंत्रण'."
            : "NagrikSetu operates on the principle of minimal data collection, verified truth, and zero unnecessary personal surveillance."}
        </p>
      </div>

      {/* Key Principles Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <Lock className="w-6 h-6 text-civic-700" />
          <h3 className="text-sm font-bold text-slate-900">
            {language === "mr" ? "कोणतीही कागदपत्रे अपलोड नाही" : "No Sensitive File Uploads"}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {language === "mr"
              ? "आम्ही आधार कार्ड, बँक पासबुक किंवा शैक्षणिक प्रमाणपत्रांच्या फाईल्स सर्व्हरवर अपलोड करण्यास सांगत नाही. कागदपत्रे केवळ आपल्या तयारीच्या चेकलिस्टसाठी आहेत."
              : "We do not store your physical marksheet or Aadhaar scans on our servers. Document requirements are tracked only as personal preparation checklists."}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <Eye className="w-6 h-6 text-civic-700" />
          <h3 className="text-sm font-bold text-slate-900">
            {language === "mr" ? "किमान आवश्यक माहिती" : "Minimal Data Collection"}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {language === "mr"
              ? "केवळ योजनांची पात्रता आणि मॅच स्कोअर तपासण्यासाठी आवश्यक तेवढीच शैक्षणिक पातळी आणि जिल्हा विचारला जातो."
              : "Only non-sensitive criteria (education level, district, broad income range) are stored strictly for rule evaluation."}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <FileCheck className="w-6 h-6 text-civic-700" />
          <h3 className="text-sm font-bold text-slate-900">
            {language === "mr" ? "अधिकृत स्त्रोतांचे महत्त्व" : "Always Verified Sources"}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {language === "mr"
              ? "नागरिकसेतू स्वतः योजना मंजूर करत नाही. आम्ही विद्यार्थ्यांना शासकीय अधिकृत पोर्टलवर (MahaDBT, MPSC) अंतिम अर्ज करण्यासाठी दिशा दाखवतो."
              : "NagrikSetu does not accept government applications on your behalf; we guide you directly to the verified official state portals."}
          </p>
        </div>

      </div>

      {/* Detailed Sections */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
        
        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === "mr" ? "१. आम्ही कोणती माहिती गोळा करतो?" : "1. What Information Do We Collect?"}
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>विद्यार्थी संपर्क:</strong> नाव आणि ईमेल (खाते सुरक्षिततेसाठी).</li>
            <li><strong>शैक्षणिक माहिती:</strong> शैक्षणिक पातळी (१०वी, १२वी, डिप्लोमा, पदवी), चालू वर्ष आणि जिल्हा.</li>
            <li><strong>आर्थिक श्रेणी:</strong> अचूक शिष्यवृत्ती निकषांसाठी ढोबळ वार्षिक कौटुंबिक उत्पन्न श्रेणी.</li>
            <li><strong>कृती प्रवास नोंदी:</strong> आपण सुरू केलेल्या अर्जांची प्रगती स्थिती.</li>
          </ul>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            {language === "mr" ? "२. अधिकृत शासकीय पारदर्शकता सूचना" : "2. Civic Status & Non-Affiliation Disclaimer"}
          </h2>
          <p className="text-slate-600">
            नागरिकसेतू हे विद्यार्थ्यांच्या शैक्षणिक व करिअर प्रगतीसाठी तयार केलेले स्वतंत्र नागरिक मार्गदर्शन व्यासपीठ आहे. अंतिम पात्रता, नियम, अटी, किंवा मुदतवाढीचा अधिकार संबंधित शासकीय विभाग (उदा. महाडीबीटी, एमपीएससी, उच्च शिक्षण संचालनालय) यांच्याकडे सुरक्षित आहे. विद्यार्थ्याने अर्ज सादर करण्यापूर्वी अधिकृत जाहिरातीची खात्री करणे आवश्यक आहे.
          </p>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            {language === "mr" ? "३. खाते व डेटा हटवण्याचा अधिकार (Right to Erasure)" : "3. Account & Data Deletion"}
          </h2>
          <p className="text-slate-600">
            विद्यार्थी कोणत्याही वेळी त्यांच्या प्रोफाइल सेटिंग्जमधून खाते हटवू शकतात. खाते हटवल्यावर आपली प्रोफाइल आणि कृती प्रवासाची सर्व माहिती कायमस्वरूपी काढून टाकली जाते.
          </p>
        </div>

      </div>

      <div className="text-center pt-4">
        <Link href="/dashboard">
          <Button variant="primary" size="md">
            {language === "mr" ? "डॅशबोर्डवर परत जा" : "Return to Dashboard"}
          </Button>
        </Link>
      </div>

    </div>
  );
}
