"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const { language, t } = useLanguage();
  const { signup } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(language === "mr" ? "कृपया आपले पूर्ण नाव प्रविष्ट करा." : "Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError(language === "mr" ? "कृपया वैध ईमेल पत्ता प्रविष्ट करा." : "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError(language === "mr" ? "पासवर्ड किमान ६ अक्षरांचा असावा." : "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError(language === "mr" ? "पासवर्ड जुळत नाहीत." : "Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await signup(name, email);
      if (res.success) {
        // As per Section 11: After successful signup, send the user to onboarding!
        router.push("/onboarding");
      } else {
        setError(res.error || "Registration failed");
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
          {t("auth.signup.title")}
        </h1>
        <p className="text-xs text-slate-500">
          {t("auth.signup.subtitle")}
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
        
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t("auth.fullName")}
            type="text"
            required
            placeholder="उदा. रोहन पाटील"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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
            placeholder="किमान ६ अक्षरे"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            label={t("auth.confirmPassword")}
            type="password"
            required
            placeholder="पासवर्ड पुन्हा लिहा"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full font-bold shadow-sm"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {t("auth.signup.btn")}
            </Button>
          </div>
        </form>

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
