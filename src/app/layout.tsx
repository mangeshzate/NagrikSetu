import type { Metadata } from "next";
import { Inter, Mukta } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/context";
import { AuthProvider } from "@/lib/auth/context";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mukta = Mukta({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["devanagari", "latin"],
  variable: "--font-mukta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "नागरिकसेतू — NagrikSetu | Student Opportunities & Action Platform",
  description:
    "Maharashtra's verified citizen platform connecting students with scholarships, internships, government exams, and courses through deterministic matching and guided action journeys.",
  keywords: [
    "Maharashtra Scholarship",
    "MahaDBT",
    "NagrikSetu",
    "MPSC Exam",
    "Student Internships Maharashtra",
    "Diploma Scholarships Pune",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mr" className={`${inter.variable} ${mukta.variable}`}>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-civic-100 selection:text-civic-900">
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {children}
            </main>
            <BottomNav />
            <Footer />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
