"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/Button";
import { 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  LogOut 
} from "lucide-react";

export default function VerifyMobilePage() {
  const { language, t } = useLanguage();
  const { user, isPhoneVerified, sendMobileOtp, verifyMobileOtp, logout, refreshSession } = useAuth();
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"INPUT" | "OTP">("INPUT");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // If phone is already verified, proceed to onboarding or dashboard
  useEffect(() => {
    if (user && isPhoneVerified) {
      if (!user.onboardingCompleted) {
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

  const getMaskedMobile = () => {
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

    const digits = mobile.replace(/\D/g, "");
    if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
      setError(
        language === "mr"
          ? "कृपया वैध १०-अंकी भारतीय मोबाईल नंबर प्रविष्ट करा (६, ७, ८, किंवा ९ ने सुरू होणारा)."
          : "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9."
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendMobileOtp(digits);
      if (res.success) {
        setStep("OTP");
        setCooldown(60);
        setSuccessMsg(
          language === "mr"
            ? "मोबाईल नंबरवर ६-अंकी पडताळणी कोड पाठवला आहे."
            : "6-digit verification code sent to your mobile number."
        );
      } else {
        setError(res.error || "Failed to send verification code.");
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
      setError(
        language === "mr"
          ? "कृपया पूर्ण ६-अंकी पडताळणी कोड प्रविष्ट करा."
          : "Please enter the complete 6-digit verification code."
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyMobileOtp(mobile, cleanOtp);
      if (res.success) {
        setSuccessMsg(
          language === "mr"
            ? "मोबाईल नंबर यशस्वीरीत्या सत्यापित झाला! पुढे जात आहे..."
            : "Mobile number verified successfully! Redirecting..."
        );
        await refreshSession();
        setTimeout(() => {
          if (!user?.onboardingCompleted) {
            router.push("/onboarding");
          } else {
            router.push("/dashboard");
          }
        }, 1000);
      } else {
        setError(res.error || "Invalid or expired verification code.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-14 px-4 space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-md">
          <Phone className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-marathi">
          {t("auth.verifyMobileTitle")}
        </h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          {t("auth.verifyMobileSubtitle")}
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
        
        {/* Info Banner */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>{language === "mr" ? "शासकीय योजना सुरक्षा पडताळणी" : "Official Verification Requirement"}</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {language === "mr"
              ? "महाराष्ट्र शासनाच्या शिष्यवृत्ती व योजनांसाठी अचूक SMS सूचना आणि मुदतीचे अलर्ट मिळवण्यासाठी मोबाईल नंबर आवश्यक आहे."
              : "A verified Indian mobile number is required to receive direct SMS scheme deadline alerts and official status updates."}
          </p>
        </div>

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

        {/* Step 1: Input Mobile */}
        {step === "INPUT" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
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
                  autoFocus
                  placeholder="98XXXXXXXX"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-2.5 text-sm text-slate-900 focus:outline-none placeholder:text-slate-400 font-mono tracking-wider"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {language === "mr" ? "१०-अंकी भारतीय मोबाईल नंबर प्रविष्ट करा." : "Enter 10-digit Indian mobile number."}
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full font-bold shadow-xs"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {t("auth.sendMobileOtp")}
            </Button>
          </form>
        )}

        {/* Step 2: Enter & Verify OTP */}
        {step === "OTP" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center py-1">
              <span className="text-xs text-slate-500 block">
                {t("auth.codeSentTo")}
              </span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {getMaskedMobile()}
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

        {/* Sign Out Option */}
        <div className="text-center pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={logout}
            className="text-xs text-slate-400 hover:text-rose-600 inline-flex items-center gap-1 font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{language === "mr" ? "वेगळ्या खात्याने लॉगिन करा / बाहेर पडा" : "Sign in with a different account / Sign out"}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
