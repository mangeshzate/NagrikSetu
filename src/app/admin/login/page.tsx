"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Phone, 
  ArrowRight, 
  RotateCw, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft 
} from "lucide-react";

type AuthMode = "EMAIL" | "MOBILE";
type Step = "INPUT" | "OTP";

function AdminLoginForm() {
  const { language, t } = useLanguage();
  const { 
    user, 
    signInWithGoogle, 
    sendEmailOtp, 
    verifyEmailOtp, 
    sendMobileOtp, 
    verifyMobileOtp,
    login,
    logout,
    refreshSession
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const unauthorizedError = searchParams.get("error") === "unauthorized";

  const [authMode, setAuthMode] = useState<AuthMode>("EMAIL");
  const [step, setStep] = useState<Step>("INPUT");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    unauthorizedError ? t("auth.adminUnauthorized") : null
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // If already logged in: check role
  useEffect(() => {
    if (user) {
      if (user.role === "ADMIN") {
        router.push("/admin");
      } else {
        // Authenticated user is a student attempting to view admin
        setError(t("auth.adminUnauthorized"));
      }
    }
  }, [user, router, t]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const getMaskedTarget = () => {
    if (authMode === "EMAIL") {
      const [n, d] = email.split("@");
      if (!d) return email;
      const masked = n.length > 2 ? `${n[0]}***${n[n.length - 1]}` : n;
      return `${masked}@${d}`;
    }
    const digits = mobile.replace(/\D/g, "");
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 2)}*** **${digits.slice(-3)}`;
    }
    return `+91 ${mobile}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (authMode === "EMAIL") {
        if (!email.trim() || !email.includes("@")) {
          setError(language === "mr" ? "कृपया वैध प्रशासकीय ईमेल प्रविष्ट करा." : "Please enter a valid administrator email address.");
          return;
        }
        const res = await sendEmailOtp(email);
        if (res.success) {
          setStep("OTP");
          setCooldown(60);
          setSuccessMsg(language === "mr" ? "प्रशासक ईमेलवर ६-अंकी OTP पाठवला आहे." : "Verification code sent to administrator email.");
        } else {
          setError(res.error || "Failed to send verification code.");
        }
      } else {
        const digits = mobile.replace(/\D/g, "");
        if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
          setError(language === "mr" ? "कृपया वैध १०-अंकी भारतीय मोबाईल नंबर प्रविष्ट करा." : "Please enter a valid 10-digit Indian mobile number.");
          return;
        }
        const res = await sendMobileOtp(digits);
        if (res.success) {
          setStep("OTP");
          setCooldown(60);
          setSuccessMsg(language === "mr" ? "प्रशासक मोबाईलवर ६-अंकी OTP पाठवला आहे." : "SMS verification code sent to administrator mobile.");
        } else {
          setError(res.error || "Failed to send verification code.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setError(language === "mr" ? "कृपया ६-अंकी पडताळणी कोड प्रविष्ट करा." : "Please enter the 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    try {
      let authRes: { success: boolean; error?: string };
      if (authMode === "EMAIL") {
        authRes = await verifyEmailOtp(email, cleanOtp);
      } else {
        authRes = await verifyMobileOtp(mobile, cleanOtp);
      }

      if (!authRes.success) {
        setError(authRes.error || "Invalid or expired verification code.");
        return;
      }

      // Supabase identity established. Now strictly verify server-side ADMIN role!
      const verifyRes = await fetch("/api/auth/me");
      if (verifyRes.ok) {
        const meData = await verifyRes.json();
        if (meData.authenticated && meData.user?.role === "ADMIN") {
          router.push("/admin");
          return;
        }
      }

      // If user role is NOT ADMIN: Deny access!
      await logout();
      setError(t("auth.adminUnauthorized"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await signInWithGoogle("/admin");
      if (!res.success) {
        setError(res.error || "Google login failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Demo bypass: strictly only available when explicit NEXT_PUBLIC_DEMO_MODE=true
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const handleQuickDemoAdmin = async () => {
    setIsLoading(true);
    try {
      await login("admin@nagriksetu.in", "ADMIN");
      router.push("/admin");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-900/5 -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        
        {/* Header with Dark Administrative Badge */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 font-extrabold flex items-center justify-center mx-auto shadow-lg border border-slate-800">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-marathi">
            {t("auth.adminLoginTitle")}
          </h1>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t("auth.adminLoginSubtitle")}
          </p>
        </div>

        {/* Administration Card */}
        <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-8 space-y-5">
          
          {/* Security Notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              {language === "mr"
                ? "सर्व प्रशासकीय ऑपरेशन्स आणि लॉगिन नोंदींची ऑडिट ट्रेलमध्ये नोंद केली जाते."
                : "All administrator logins and modifications are recorded in the security audit trail."}
            </span>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successMsg && !error && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === "INPUT" && (
            <>
              {/* Google OAuth Login */}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{t("auth.google")}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-semibold uppercase">
                  {language === "mr" ? "किंवा प्रशासकीय OTP" : "Or Admin OTP"}
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Selector */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("EMAIL");
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    authMode === "EMAIL"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{t("auth.emailOtp")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("MOBILE");
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    authMode === "MOBILE"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t("auth.mobileOtp")}</span>
                </button>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendOtp} className="space-y-4">
                {authMode === "EMAIL" ? (
                  <Input
                    label={language === "mr" ? "प्रशासक ईमेल" : "Administrator Email"}
                    type="email"
                    required
                    placeholder="admin@nagriksetu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      {language === "mr" ? "अधिकृत मोबाईल नंबर" : "Authorized Mobile Number"}
                    </label>
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-slate-800 focus-within:border-slate-800">
                      <span className="inline-flex items-center px-3 bg-slate-50 text-slate-500 text-xs font-bold border-r border-slate-200 select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="98XXXXXXXX"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                        className="w-full px-3 py-2 text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {authMode === "EMAIL" ? t("auth.sendEmailOtp") : t("auth.sendMobileOtp")}
                </Button>
              </form>
            </>
          )}

          {/* OTP Verification */}
          {step === "OTP" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center py-1">
                <span className="text-xs text-slate-500 block">
                  {t("auth.codeSentTo")}
                </span>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  {getMaskedTarget()}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("INPUT");
                    setOtp("");
                    setError(null);
                  }}
                  className="text-xs text-slate-700 hover:underline block mx-auto mt-1 font-semibold"
                >
                  {t("auth.changeTarget")}
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 text-center">
                  {t("auth.enterCode")}
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center tracking-[0.5em] text-2xl font-bold font-mono py-2.5 px-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                isLoading={isLoading}
              >
                {t("auth.verifyOtp")}
              </Button>

              <div className="text-center pt-2">
                {cooldown > 0 ? (
                  <span className="text-xs text-slate-400 font-medium">
                    {t("auth.resendIn")} {cooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleSendOtp}
                    className="text-xs font-semibold text-slate-700 hover:underline inline-flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>{t("auth.resendOtp")}</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Quick Demo Admin Button - Strictly available ONLY when NEXT_PUBLIC_DEMO_MODE=true */}
          {isDemoMode && (
            <div className="pt-3 border-t border-slate-100">
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  {language === "mr" ? "डेमो मोड (सक्रिय)" : "Demo Mode (Active)"}
                </span>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleQuickDemoAdmin}
                  className="w-full p-2 rounded-lg border border-amber-300 bg-white hover:bg-amber-100/50 text-left text-xs font-semibold text-amber-900 transition-colors flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{language === "mr" ? "प्रशासक डेमो लॉगिन" : "Instant Demo Administrator Login"}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Back to Student Portal Link */}
        <div className="text-center">
          <Link
            href="/login"
            className="text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === "mr" ? "विद्यार्थी लॉगिनवर परत जा" : "Back to Student Portal"}</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
