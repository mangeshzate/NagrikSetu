"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShieldCheck, UserCheck, KeyRound, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { language, t } = useLanguage();
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError(language === "mr" ? "कृपया ईमेल आणि पासवर्ड प्रविष्ट करा." : "Please enter email and password.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await login(email);
      if (res.success) {
        if (email.toLowerCase().includes("admin")) {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(res.error || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: "STUDENT" | "ADMIN") => {
    setIsLoading(true);
    try {
      if (role === "ADMIN") {
        await login("admin@nagriksetu.in", "ADMIN");
        router.push("/admin");
      } else {
        await login("student@nagriksetu.in", "STUDENT");
        router.push("/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-civic-700 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-md">
          नS
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-marathi">
          {t("auth.login.title")}
        </h1>
        <p className="text-xs text-slate-500">
          {t("auth.login.subtitle")}
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
        
        {/* Quick Demo Logins Box - Strictly enabled only in explicit DEMO_MODE */}
        {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
          <>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {t("auth.quickDemo")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickDemo("STUDENT")}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-civic-50 hover:border-civic-300 text-left text-xs font-semibold text-slate-800 transition-colors flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4 text-civic-600 shrink-0" />
                  <span className="truncate">{language === "mr" ? "विद्यार्थी डेमो" : "Student Demo"}</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickDemo("ADMIN")}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-300 text-left text-xs font-semibold text-slate-800 transition-colors flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="truncate">{language === "mr" ? "प्रशासक डेमो" : "Admin Demo"}</span>
                </button>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-semibold uppercase">
                {language === "mr" ? "किंवा ईमेलने लॉगिन करा" : "Or with email"}
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
          </>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t("auth.email")}
            type="email"
            required
            placeholder="student@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label={t("auth.password")}
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full font-bold shadow-sm"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {t("auth.login.btn")}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          {t("auth.noAccount")}{" "}
          <Link href="/signup" className="font-bold text-civic-700 hover:underline">
            {t("nav.signup")}
          </Link>
        </p>

      </div>

    </div>
  );
}
