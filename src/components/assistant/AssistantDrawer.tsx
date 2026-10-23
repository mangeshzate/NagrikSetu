"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import type { AssistantResponse } from "@/lib/ai/provider";
import { Opportunity } from "@/types/database";
import { Button } from "../ui/Button";
import { OpportunityCard } from "../opportunities/OpportunityCard";
import { Bot, Send, Sparkles, ShieldCheck, User, RefreshCw } from "lucide-react";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_welcome",
      sender: "bot",
      text:
        language === "mr"
          ? "नमस्कार! मी नागरिकसेतू मार्गदर्शक आहे. तुम्हाला शिष्यवृत्ती, पात्रता निकष, आवश्यक कागदपत्रे किंवा मुदतींबद्दल कोणती माहिती हवी आहे? मला विचारा!"
          : "Hello! I am your NagrikSetu civic guide. Ask me about scholarships, eligibility, required documents, deadlines, or your application journey.",
    },
  ]);

  // Suggested prompts matching section 17
  const quickPrompts =
    language === "mr"
      ? [
          "माझ्यासाठी शिष्यवृत्ती शोधा",
          "मी पात्र आहे का?",
          "मला कोणती कागदपत्रे लागतील?",
          "माझी पुढची पायरी काय आहे?",
          "कोणत्या मुदती जवळ आल्या आहेत?",
        ]
      : [
          "Find scholarships for me",
          "Am I eligible?",
          "What documents do I need?",
          "What is my next step?",
          "Which deadlines are coming soon?",
        ];

  // Auto-scroll to bottom on message update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: textToSend,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Format bounded history (last 6 messages)
    const historyPayload = newMessages.slice(-6).map((m) => ({
      role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.text,
    }));

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          history: historyPayload,
          context: {
            studentProfile,
            userInterests,
            language,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Assistant service error");
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
              ? "नागरिकसेतू डेटाबेसमध्ये याबद्दल पुरेशी खात्रीशीर माहिती उपलब्ध नाही. तुम्ही उपलब्ध संधी, पात्रता, आवश्यक कागदपत्रे, मुदत किंवा अर्जाच्या टप्प्यांबद्दल विचारू शकता."
              : "I don't have enough verified information in NagrikSetu to answer that reliably. Try asking about an opportunity, eligibility, required documents, deadlines, or your application journey.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
              {language === "mr" ? "नागरिकसेतू मार्गदर्शक" : "Ask NagrikSetu"}
            </h3>
            <p className="text-[10px] text-civic-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-civic-300" />
              <span>{language === "mr" ? "खात्रीशीर डेटाबेसमधून थेट मार्गदर्शन" : "Grounded in verified schemes & rules"}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: `msg_welcome_${Date.now()}`,
                sender: "bot",
                text:
                  language === "mr"
                    ? "नवीन संभाषणासाठी तयार! तुम्हाला शिष्यवृत्ती, पात्रता किंवा कागदपत्रांबद्दल काय माहिती हवी आहे?"
                    : "Conversation reset. How can I help you with scholarships or application roadmaps?",
              },
            ]);
          }}
          title="Reset conversation"
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 min-h-[300px]"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-start gap-2 max-w-[88%] sm:max-w-[78%]">
              {m.sender === "bot" && (
                <div className="w-7 h-7 rounded-lg bg-civic-100 text-civic-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-2xs ${
                  m.sender === "user"
                    ? "bg-civic-700 text-white rounded-br-xs"
                    : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                }`}
              >
                {m.text}
              </div>

              {m.sender === "user" && (
                <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* If bot returned relevant opportunity cards */}
            {m.opportunities && m.opportunities.length > 0 && (
              <div className="w-full mt-3 pl-9 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
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

      {/* Suggested Quick Prompts */}
      <div className="px-3.5 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        {quickPrompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handleSend(p)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium border border-slate-200/60"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Multiline Input Form (Enter to send, Shift+Enter for newline) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-end gap-2"
      >
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("dashboard.askPlaceholder")}
          className="flex-1 max-h-24 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:border-civic-600 focus:ring-1 focus:ring-civic-600/30 resize-none"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
          className="h-10 px-3.5"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};
