"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { Shield, ExternalLink, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  const { language, t } = useLanguage();

  return (
    <footer className="w-full bg-slate-900 text-slate-300 py-12 pb-24 md:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-civic-600 flex items-center justify-center text-white font-bold text-sm">
                नS
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-marathi">
                नागरिकसेतू
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              {language === "mr"
                ? "महाराष्ट्रातील विद्यार्थ्यांसाठी शिष्यवृत्ती, शासकीय परीक्षा, इंटर्नशिप आणि कौशल्याच्या खात्रीशीर संधींचे मार्गदर्शक व्यासपीठ. माहितीपासून कृतीपर्यंतचा विश्वासू सेतू."
                : "A verified public-service platform connecting Maharashtra students with scholarships, competitive exams, internships, and educational action pathways."}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-[11px] px-2.5 py-1 rounded bg-slate-800 text-civic-400 border border-slate-700 font-medium">
                महाराष्ट्रातील विद्यार्थ्यांसाठी समर्पित
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              {language === "mr" ? "महत्त्वाचे दुवे" : "Platform"}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/discover" className="hover:text-white transition-colors">
                  {t("nav.discover")}
                </Link>
              </li>
              <li>
                <Link href="/journeys" className="hover:text-white transition-colors">
                  {t("nav.journeys")}
                </Link>
              </li>
              <li>
                <Link href="/assistant" className="hover:text-white transition-colors">
                  {t("nav.assistant")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  {language === "mr" ? "गोपनीयता धोरण व अटी" : "Privacy & Civic Disclaimer"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Portals */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              {language === "mr" ? "अधिकृत शासकीय संकेतस्थळे" : "Official Govt Portals"}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a
                  href="https://mahadbt.maharashtra.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>MahaDBT Portal</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://mpsc.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>MPSC Portal</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://dtemaharashtra.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>DTE Maharashtra</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Civic Disclaimer Banner (Mandatory requirement from prompt section 46 & 54) */}
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-400 flex items-start gap-3">
          <Shield className="w-5 h-5 text-civic-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-200">
              {language === "mr" ? "नागरिक पारदर्शकता व सूचना:" : "Citizen Transparency & Disclaimer:"}
            </p>
            <p className="leading-relaxed">
              {t("common.disclaimer")}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} NagrikSetu (नागरिकसेतू). Built with care for Maharashtra students.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-400">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-slate-400">
              Student Login
            </Link>
            <span>•</span>
            <Link href="/admin" className="hover:text-slate-400">
              Admin
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
