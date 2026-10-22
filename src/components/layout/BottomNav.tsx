"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { Compass, MapPin, Bot, User, Home } from "lucide-react";

export const BottomNav: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const pathname = usePathname();

  // Hide on login, signup, onboarding to prevent distraction
  if (pathname === "/login" || pathname === "/signup" || pathname === "/onboarding") {
    return null;
  }

  const items = [
    {
      href: user ? "/dashboard" : "/",
      label: t("nav.home"),
      icon: <Home className="w-5 h-5" />,
      active: pathname === "/dashboard" || pathname === "/",
    },
    {
      href: "/discover",
      label: t("nav.discover"),
      icon: <Compass className="w-5 h-5" />,
      active: pathname.startsWith("/discover") || pathname.startsWith("/opportunities"),
    },
    {
      href: "/journeys",
      label: t("nav.journeys"),
      icon: <MapPin className="w-5 h-5" />,
      active: pathname.startsWith("/journeys"),
      authRequired: true,
    },
    {
      href: "/assistant",
      label: "AI सहाय्यक",
      icon: <Bot className="w-5 h-5" />,
      active: pathname === "/assistant",
    },
    {
      href: user ? "/profile" : "/login",
      label: t("nav.profile"),
      icon: <User className="w-5 h-5" />,
      active: pathname === "/profile" || pathname === "/login",
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1 safe-area-pb"
    >
      <div className="flex items-center justify-around">
        {items.map((item) => {
          if (item.authRequired && !user) return null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 min-w-[60px] rounded-lg transition-colors ${
                item.active
                  ? "text-civic-700 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className={`${item.active ? "scale-110" : ""} transition-transform`}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[70px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
