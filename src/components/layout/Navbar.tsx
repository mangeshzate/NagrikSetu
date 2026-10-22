"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { 
  Compass, 
  MapPin, 
  Bot, 
  User, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X,
  Languages,
  Sparkles
} from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

export const Navbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: t("nav.home"), icon: <Compass className="w-4 h-4" />, authRequired: true },
    { href: "/discover", label: t("nav.discover"), icon: <Compass className="w-4 h-4" /> },
    { href: "/journeys", label: t("nav.journeys"), icon: <MapPin className="w-4 h-4" />, authRequired: true },
    { href: "/assistant", label: t("nav.assistant"), icon: <Bot className="w-4 h-4" /> },
  ];

  const toggleLanguage = () => {
    setLanguage(language === "mr" ? "en" : "mr");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-civic-700 to-civic-900 flex items-center justify-center text-white shadow-md shadow-civic-900/10 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-lg tracking-tight">नS</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900 font-marathi">
                  नागरिकसेतू
                </span>
                <span className="hidden sm:inline-block text-xs font-semibold px-1.5 py-0.5 rounded bg-civic-50 text-civic-800 border border-civic-200">
                  महाराष्ट्र
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block -mt-0.5">
                {language === "mr" ? "संधी व कृती व्यासपीठ" : "Citizen Action Platform"}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              if (link.authRequired && !user) return null;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive
                      ? "text-civic-800 bg-civic-50 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Admin Link if role is ADMIN */}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith("/admin")
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "text-amber-700 hover:bg-amber-50"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>{t("nav.admin")}</span>
              </Link>
            )}
          </nav>

          {/* Action CTAs & Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bilingual Toggle Button */}
            <button
              onClick={toggleLanguage}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
              title="Change Language"
            >
              <Languages className="w-3.5 h-3.5 text-civic-700" />
              <span>{language === "mr" ? "English" : "मराठी"}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="max-w-[100px] truncate">{user.name}</span>
                </Link>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">
                    {t("nav.signup")}
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-2 shadow-lg">
          {navLinks.map((link) => {
            if (link.authRequired && !user) return null;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}

          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-amber-800 bg-amber-50"
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              {t("nav.admin")}
            </Link>
          )}

          {user && (
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <User className="w-4 h-4" />
              {t("nav.profile")} ({user.name})
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
