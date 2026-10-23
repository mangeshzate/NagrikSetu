"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  Mail, 
  Phone, 
  ArrowRight, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

type AuthMode = "EMAIL" | "MOBILE";
type Step = "INPUT" | "OTP";

export default function StudentSignupPage() {
  const { language, t } = useLanguage();
  const { 
    user, 
    isPhoneVerified, 
    signInWithGoogle, 
    sendEmailOtp, 
    verifyEmailOtp, 
    sendMobileOtp, 
    verifyMobileOtp 
  } = useAuth();
  const router = useRouter();

  const [authMode, setAuthMode] = useState<AuthMode>("EMAIL");
  const [step, setStep] = useState<Step>("INPUT");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // If already logged in, route according to verification and onboarding state
  useEffect(() => {
    if (user) {
      if (!isPhoneVerified) {
        router.push("/verify-mobile");
      } else if (!user.onboardingCompleted) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, isPhoneVerified, router]);

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
          setError(language === "mr" ? "कृपया वैध ईमेल पत्ता प्रविष्ट करा." : "Please enter a valid email address.");
          return;
        }
        const res = await sendEmailOtp(email);
        if (res.success) {
          setStep("OTP");
          setCooldown(60);
          setSuccessMsg(language === "mr" ? "ईमेलवर ६-अंकी OTP पाठवला आहे." : "Verification code sent to your email.");
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
          setSuccessMsg(language === "mr" ? "मोबाईलवर ६-अंकी OTP पाठवला आहे." : "SMS verification code sent to your mobile.");
        } else {
          setError(res.error || "Failed to send mobile verification code.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.trim().length < 6) {
      setError(language === "mr" ? "कृपया ६-अंकी OTP प्रविष्ट करा." : "Please enter the 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === "EMAIL") {
        const res = await verifyEmailOtp(email, otp.trim());
        if (res.success) {
          // As per Requirement 3: After email verification, student MUST verify mobile before onboarding
          router.push("/verify-mobile");
        } else {
          setError(res.error || "Invalid or expired verification code.");
        }
      } else {
        const res = await verifyMobileOtp(mobile, otp.trim());
        if (res.success) {
          // Mobile OTP verifies mobile identity immediately -> proceed to onboarding
          router.push("/onboarding");
        } else {
          setError(res.error || "Invalid or expired verification code.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        setError(res.error || "Google registration failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 px-4 space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-civic-700 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-md">
          नS
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-marathi">
          {t("auth.studentSignupTitle")}
        </h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          {t("auth.studentSignupSubtitle")}
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
        
        {step === "INPUT" && (
          <>
            {/* Google Signup Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignup}
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
                {language === "mr" ? "किंवा पडताळणीसह नोंदणी करा" : "Or verify with OTP"}
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("EMAIL");
                  setError(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  authMode === "EMAIL"
                    ? "bg-white text-civic-900 shadow-xs"
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
                    ? "bg-white text-civic-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{t("auth.mobileOtp")}</span>
              </button>
            </div>
          </>
        )}

        {/* Alerts */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && !error && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Step 1: Input Form */}
        {step === "INPUT" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {authMode === "EMAIL" ? (
              <Input
                label={t("auth.email")}
                type="email"
                required
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            ) : (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  {t("auth.mobileNumber")}
                </label>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-civic-600 focus-within:border-civic-600">
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
                <p className="text-[11px] text-slate-400">
                  {language === "mr" ? "१०-अंकी भारतीय मोबाईल नंबर प्रविष्ट करा." : "Enter 10-digit Indian mobile number."}
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full font-bold shadow-xs"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {authMode === "EMAIL" ? t("auth.sendEmailOtp") : t("auth.sendMobileOtp")}
            </Button>
          </form>
        )}

        {/* Step 2: OTP Verification Form */}
        {step === "OTP" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center py-1">
              <span className="text-xs text-slate-500 block">
                {t("auth.codeSentTo")}
              </span>
              <span className="text-sm font-bold text-slate-800">
                {getMaskedTarget()}
              </span>
              <button
                type="button"
                onClick={() => {
                  setStep("INPUT");
                  setOtp("");
                  setError(null);
                }}
                className="text-xs text-civic-700 hover:underline block mx-auto mt-1 font-semibold"
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
                className="w-full text-center tracking-[0.5em] text-2xl font-bold font-mono py-2.5 px-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-civic-600 focus:border-civic-600 outline-none"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full font-bold shadow-xs"
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
                  className="text-xs font-semibold text-civic-700 hover:underline inline-flex items-center gap-1"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>{t("auth.resendOtp")}</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* Footer Navigation */}
        <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="font-bold text-civic-700 hover:underline">
            {t("nav.login")}
          </Link>
        </p>

      </div>

    </div>
  );
}
