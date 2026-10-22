"use client";

import React, { useState } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import type { AssistantResponse } from "@/lib/ai/provider";
import { Opportunity } from "@/types/database";
import { Button } from "../ui/Button";
import { OpportunityCard } from "../opportunities/OpportunityCard";
import { Bot, Send, Sparkles, ShieldCheck, User } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  opportunities?: Opportunity[];
}

export interface AssistantDrawerProps {
  initialPrompt?: string;
  compact?: boolean;
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  initialPrompt = "",
  compact = false,
}) => {
  const { language, t } = useLanguage();
  const { studentProfile, userInterests } = useAuth();
  const [input, setInput] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_welcome",
      sender: "bot",
      text:
        language === "mr"
          ? "नमस्कार! मी नागरिकसेतू मार्गदर्शक आहे. तुम्हाला शिष्यवृत्ती, इंटर्नशिप किंवा शासकीय परीक्षांबद्दल कोणती माहिती हवी आहे? मला विचारा!"
          : "Hello! I am your NagrikSetu civic guide. Ask me about scholarships, internships, or competitive exams in Maharashtra.",
    },
  ]);

  const quickPrompts =
    language === "mr"
      ? [
          "मला शिष्यवृत्ती पाहिजे.",
          "माझ्याकडे उत्पन्न दाखला नाही.",
          "डिप्लोमा विद्यार्थ्यांसाठी कोणत्या इंटर्नशिप्स आहेत?",
          "एमपीएससी परीक्षेसाठी कोण पात्र आहे?",
        ]
      : [
          "I need scholarships for diploma students.",
          "I don't have an income certificate.",
          "What internships are available in Maharashtra?",
          "Am I eligible for engineering assistance?",
        ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          context: {
            studentProfile,
            userInterests,
            language,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Assistant service temporarily unavailable");
      }

      const response: AssistantResponse = await res.json();

      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: "bot",
        text: response.reply,
        opportunities: response.suggestedOpportunities,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: "bot",
          text:
            language === "mr"
              ? "क्षमस्व, माहिती मिळवण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा किंवा संधी शोधा पृष्ठावर जा."
              : "Apologies, could not process query right now. Please try again or browse opportunities.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-civic-800 to-civic-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-civic-200">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">
              {language === "mr" ? "नागरिकसेतू सहाय्यक" : "Ask NagrikSetu"}
            </h3>
            <p className="text-[10px] text-civic-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-civic-300" />
              <span>{language === "mr" ? "खात्रीशीर शासकीय माहितीवर आधारित" : "Grounded in verified data"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 min-h-[300px]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-2xs ${
                m.sender === "user"
                  ? "bg-civic-700 text-white rounded-br-xs"
                  : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
              }`}
            >
              {m.text}
            </div>

            {/* If bot returned relevant opportunity cards */}
            {m.opportunities && m.opportunities.length > 0 && (
              <div className="w-full mt-3 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {language === "mr" ? "सुचवलेल्या संधी:" : "Suggested Opportunities:"}
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  {m.opportunities.map((opp) => (
                    <OpportunityCard key={opp.id} opportunity={opp} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 text-xs text-slate-500 bg-white rounded-xl border border-slate-200/80 w-fit animate-pulse">
            <Sparkles className="w-4 h-4 text-civic-600 animate-spin" />
            <span>{language === "mr" ? "माहिती शोधत आहे..." : "Consulting verified database..."}</span>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        {quickPrompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handleSend(p)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("dashboard.askPlaceholder")}
          className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-civic-600 focus:ring-1 focus:ring-civic-600/30"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!input.trim() || isLoading}
          aria-label="Send query"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};
