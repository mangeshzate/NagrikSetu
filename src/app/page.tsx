"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/Button";
import { 
  Compass, 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  GraduationCap, 
  Briefcase, 
  BookOpen, 
  Trophy, 
  FileCheck,
  Building2,
  Users
} from "lucide-react";

export default function LandingPage() {
  const { language, t } = useLanguage();
  const { user } = useAuth();

  const categories = [
    {
      titleEn: "Scholarships & Fee Reimbursement",
      titleMr: "शिष्यवृत्ती व शुल्क प्रतिपूर्ती",
      descEn: "MahaDBT, DHE, social welfare aid, and municipal education grants.",
      descMr: "महाडीबीटी, डीएचई आणि महानगरपालिका शिक्षण शिष्यवृत्ती.",
      icon: <GraduationCap className="w-6 h-6 text-civic-700" />,
      tag: "50+ Schemes",
    },
    {
      titleEn: "State Internships & Stipends",
      titleMr: "शासकीय इंटर्नशिप व मानधन",
      descEn: "Practical experience with Maharashtra state innovation and civic departments.",
      descMr: "महाराष्ट्र शासन व इनोव्हेशन सोसायटीमधील सशुल्क इंटर्नशिप.",
      icon: <Briefcase className="w-6 h-6 text-civic-700" />,
      tag: "Verified",
    },
    {
      titleEn: "Government Exams (MPSC)",
      titleMr: "शासकीय स्पर्धा परीक्षा (एमपीएससी)",
      descEn: "Combined Group B/C examinations, civil services, and technical posts.",
      descMr: "महाराष्ट्र दुय्यम सेवा संयुक्त पूर्व परीक्षा व तांत्रिक भरती.",
      icon: <FileCheck className="w-6 h-6 text-civic-700" />,
      tag: "Timely Updates",
    },
    {
      titleEn: "Skill Courses & Certifications",
      titleMr: "कौशल्य कोर्सेस व प्रमाणपत्रे",
      descEn: "Govt-backed free technical courses by MahaIT, AI foundations, and coding.",
      descMr: "महाआयटीद्वारे विनामूल्य शासकीय प्रमाणपत्र तंत्रज्ञान कोर्सेस.",
      icon: <BookOpen className="w-6 h-6 text-civic-700" />,
      tag: "100% Free",
    },
    {
      titleEn: "Technical Competitions & Hackathons",
      titleMr: "तांत्रिक स्पर्धा व हॅकाथॉन",
      descEn: "MSBTE innovation contests and project challenge cash prizes.",
      descMr: "एमएसबीटीई राज्यस्तरीय तांत्रिक प्रकल्प व हॅकाथॉन स्पर्धा.",
      icon: <Trophy className="w-6 h-6 text-civic-700" />,
      tag: "State-level",
    },
  ];

  const steps = [
    {
      num: "1",
      titleEn: "Create your student profile",
      titleMr: "१. तुमची विद्यार्थी प्रोफाइल बनवा",
      descEn: "Enter your education level (10th/12th/Diploma/Degree), district, and interests in 2 minutes.",
      descMr: "तुमचे शिक्षण (१०वी, १२वी, डिप्लोमा, पदवी), जिल्हा आणि आवडी फक्त २ मिनिटांत नोंदवा.",
    },
    {
      num: "2",
      titleEn: "Discover relevant opportunities",
      titleMr: "२. तुमच्यासाठी योग्य संधी शोधा",
      descEn: "Weighted matching matches verified government and institutional schemes against your criteria.",
      descMr: "नियमबद्ध मॅचिंग स्कोअरच्या साहाय्याने खात्रीशीर शासकीय व संस्थात्मक संधी शोधा.",
    },
    {
      num: "3",
      titleEn: "Check your eligibility",
      titleMr: "३. तुमची पात्रता तपासा",
      descEn: "Deterministic rule evaluation explains whether and why you qualify without guesswork.",
      descMr: "नियम तपासणीद्वारे तुम्ही पात्र आहात का आणि का पात्र आहात हे अचूक समजून घ्या.",
    },
    {
      num: "4",
      titleEn: "Start an Action Journey",
      titleMr: "४. कृती प्रवास (Action Journey) सुरू करा",
      descEn: "Move from information to execution with a personal step-by-step roadmap and checklist.",
      descMr: "फक्त माहिती वाचू नका; प्रत्यक्ष अर्ज करण्यापर्यंतच्या पायऱ्यांचा कृती आराखडा मिळवा.",
    },
    {
      num: "5",
      titleEn: "Track your progress",
      titleMr: "५. तुमची प्रगती ट्रॅक करा",
      descEn: "Prepare documents, open official portals, save registration details, and track merit lists.",
      descMr: "कागदपत्रे तयार ठेवा, अधिकृत पोर्टलवर अर्ज सादर करा आणि पोचपावती जतन करा.",
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 py-4 sm:py-8">
      
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto space-y-6">
        
        {/* Civic Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-civic-50 text-civic-800 border border-civic-200 text-xs font-bold shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-civic-700" />
          <span>{language === "mr" ? "महाराष्ट्रातील विद्यार्थ्यांसाठी अधिकृत कृती मंच" : "Maharashtra Student Assistance & Action Platform"}</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] font-marathi">
          {t("hero.title")}
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {t("hero.subtitle")}
        </p>

        {/* Categories strip */}
        <p className="text-xs sm:text-sm font-semibold text-civic-800 tracking-wide uppercase">
          {t("hero.categories")}
        </p>

        {/* CTA Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href={user ? "/dashboard" : "/signup"} className="w-full sm:w-auto">
            <Button size="lg" variant="primary" className="w-full sm:w-auto text-base font-bold shadow-md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              {user ? (language === "mr" ? "डॅशबोर्डवर जा" : "Go to Dashboard") : t("hero.cta.primary")}
            </Button>
          </Link>
          <Link href="/discover" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base font-semibold">
              {t("hero.cta.secondary")}
            </Button>
          </Link>
        </div>

        {/* Core Philosophy Banner (Prompt section 3 & 10) */}
        <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200 text-amber-900 text-xs sm:text-sm font-semibold max-w-xl mx-auto flex items-center justify-center gap-2">
          <span>🎯</span>
          <span>{t("hero.philosophy")}</span>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-marathi">
            {language === "mr" ? "संधींचे प्रमुख प्रकार" : "Explore Opportunity Domains"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {language === "mr" ? "तुमच्या आवडीनुसार शासकीय व खात्रीशीर पर्याय निवडा." : "Choose from verified pathways verified for Maharashtra students."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((c, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-civic-50 flex items-center justify-center">
                  {c.icon}
                </div>
                <span className="text-[10px] font-bold text-civic-800 bg-civic-50 px-2 py-0.5 rounded border border-civic-200">
                  {c.tag}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {language === "mr" ? c.titleMr : c.titleEn}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === "mr" ? c.descMr : c.descEn}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How NagrikSetu Works (5 Steps from Section 10) */}
      <section className="p-6 sm:p-10 rounded-3xl bg-slate-900 text-white space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-marathi">
            {t("hero.howItWorks")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {language === "mr"
              ? "केवळ माहिती देणे नाही, तर अंतिम अर्जापर्यंत योग्य मार्गदर्शन करणे हेच नागरिकसेतूचे ध्येय आहे."
              : "Moving students from Information → Decision → Action → Completion."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {steps.map((s) => (
            <div key={s.num} className="space-y-2 text-center md:text-left">
              <div className="w-9 h-9 rounded-xl bg-civic-600 text-white font-black text-sm flex items-center justify-center shadow-md mx-auto md:mx-0">
                {s.num}
              </div>
              <h4 className="text-sm font-bold text-white font-marathi">
                {language === "mr" ? s.titleMr : s.titleEn}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === "mr" ? s.descMr : s.descEn}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Maharashtra District Coverage */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-civic-700">
            <Building2 className="w-4 h-4" />
            <span>{language === "mr" ? "सर्व ३६ जिल्हे समाविष्ट" : "Covering all 36 Maharashtra Districts"}</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {language === "mr"
              ? "पुणे, मुंबई, नागपूर, नाशिक ते गडचिरोलीपर्यंत सर्व विद्यार्थ्यांसाठी"
              : "For Polytechnic, Degree, and School Scholars across the state"}
          </h3>
          <p className="text-xs text-slate-500 max-w-xl">
            {language === "mr"
              ? "स्थानिक स्वराज्य संस्थांच्या योजना, वसतिगृह भत्ते आणि राज्यस्तरीय शिष्यवृत्ती एकाच ठिकाणी."
              : "Consolidated access to MahaDBT, DTE technical grants, hostel stipends, and local civic welfare."}
          </p>
        </div>

        <Link href="/signup">
          <Button size="lg" variant="secondary" className="shrink-0 font-bold">
            {language === "mr" ? "मोफत खाते उघडा" : "Get Started Now"}
          </Button>
        </Link>
      </section>

    </div>
  );
}
