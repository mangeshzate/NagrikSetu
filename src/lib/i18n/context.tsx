"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { LanguageCode } from "@/types/database";
import { I18nContextType } from "@/types/i18n";
import { translations } from "./translations";

const LanguageContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "nagriksetu_preferred_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("mr"); // default Marathi for Maharashtra target

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null;
      if (saved && (saved === "en" || saved === "mr")) {
        setLanguageState(saved);
      }
    } catch {
      // ignore local storage errors
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
