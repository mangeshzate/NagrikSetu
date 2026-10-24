"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserProfile, StudentProfile, UserRole } from "@/types/database";
import { DEMO_STUDENT_USER, DEMO_STUDENT_PROFILE, DEMO_ADMIN_USER, DEMO_STUDENT_INTERESTS } from "../database/mockData";
import { dataStore } from "../database/store";
import { getBrowserSupabaseClient } from "../supabase/client";
import { isSupabaseConfigured, getAppUrl } from "../supabase/config";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

export interface AuthContextType {
  user: UserProfile | null;
  supabaseUser: SupabaseAuthUser | null;
  studentProfile: StudentProfile | null;
  userInterests: string[];
  isLoading: boolean;
  isPhoneVerified: boolean;
  // Production Auth Methods
  signInWithGoogle: (redirectTo?: string) => Promise<{ success: boolean; error?: string }>;
  sendEmailOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  sendMobileOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyMobileOtp: (phone: string, token: string) => Promise<{ success: boolean; error?: string }>;
  // Compatibility & Session Methods
  login: (email: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  logout: () => Promise<void>;
  updateStudentProfile: (profile: Partial<StudentProfile>) => Promise<void>;
  updateUserInterests: (interests: string[]) => void;
  completeOnboarding: (profileData: Partial<StudentProfile>, interests: string[]) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = "nagriksetu_auth_user";
const AUTH_INTERESTS_KEY = "nagriksetu_user_interests";

/**
 * Normalizes Indian mobile number to E.164 (+91XXXXXXXXXX)
 */
export function normalizeIndianMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) {
    return `+${digits}`;
  }
  return null;
}

/**
 * Sanitizes auth error messages to prevent exposing internal tokens, secrets, or keys to the UI.
 */
export function sanitizeAuthError(message?: string): string {
  if (!message) return "Failed to send verification code.";
  return message
    .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, "Bearer [REDACTED]")
    .replace(/(key|token|secret|password)[=:\s]+[a-zA-Z0-9_\-\.]+/gi, "$1=[REDACTED]")
    .trim();
}

function setDemoSessionCookie(user: UserProfile) {
  if (typeof document === "undefined") return;
  const sessionData = {
    id: user.id,
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
    onboardingCompleted: user.onboardingCompleted,
  };
  document.cookie = `nagriksetu_session=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=604800; SameSite=Lax`;
}

function clearSessionCookies() {
  if (typeof document === "undefined") return;
  document.cookie = "nagriksetu_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "sb-demo-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseAuthUser | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [userInterests, setUserInterestsState] = useState<string[]>(DEMO_STUDENT_INTERESTS);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sync profile from authoritative backend
  const loadAuthoritativeProfile = useCallback(async (authUser: SupabaseAuthUser) => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            userId: data.user.userId,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            preferredLanguage: data.user.preferredLanguage,
            onboardingCompleted: Boolean(data.user.onboardingCompleted),
            phone: data.user.phone,
            phoneVerified: Boolean(data.user.phoneVerified),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setUser(profile);
          setIsPhoneVerified(Boolean(data.user.phoneVerified));

          if (profile.role === "STUDENT") {
            const sp = await dataStore.getStudentProfile(profile.id);
            if (sp) setStudentProfile(sp);
          }
          return;
        }
      }

      // Fallback if API is unreachable
      const hasConfirmedPhone = Boolean(authUser.phone && authUser.phone_confirmed_at);
      const fallbackUser: UserProfile = {
        id: authUser.id,
        userId: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Student",
        email: authUser.email || "",
        role: "STUDENT",
        preferredLanguage: "mr",
        onboardingCompleted: false,
        phone: authUser.phone,
        phoneVerified: hasConfirmedPhone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(fallbackUser);
      setIsPhoneVerified(hasConfirmedPhone);
    } catch (e) {
      console.warn("[Auth] Failed to load authoritative profile", e);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setIsLoading(true);
      const supabase = getBrowserSupabaseClient();

      if (isSupabaseConfigured() && supabase) {
        try {
          const { data } = await supabase.auth.getUser();
          if (data?.user && isMounted) {
            setSupabaseUser(data.user);
            await loadAuthoritativeProfile(data.user);
          } else if (isMounted) {
            setUser(null);
            setSupabaseUser(null);
            setIsPhoneVerified(false);
          }
        } catch (e) {
          console.warn("[Auth] Error fetching initial Supabase session", e);
        }

        // Listen for live Supabase Auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return;
          if (session?.user) {
            setSupabaseUser(session.user);
            await loadAuthoritativeProfile(session.user);
          } else {
            setUser(null);
            setSupabaseUser(null);
            setStudentProfile(null);
            setIsPhoneVerified(false);
          }
        });

        if (isMounted) setIsLoading(false);
        return () => {
          authListener.subscription.unsubscribe();
        };
      } else {
        // Demo Mode / Unconfigured fallback
        const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
        try {
          const savedUserStr = localStorage.getItem(AUTH_USER_KEY);
          if (savedUserStr) {
            const savedUser: UserProfile = JSON.parse(savedUserStr);
            setUser(savedUser);
            setIsPhoneVerified(Boolean(savedUser.phoneVerified ?? true));
            setDemoSessionCookie(savedUser);
            dataStore.getStudentProfile(savedUser.id).then((p) => {
              if (p) setStudentProfile(p);
              else if (savedUser.role === "STUDENT") setStudentProfile(DEMO_STUDENT_PROFILE);
            });
          } else if (isDemoMode) {
            setUser(DEMO_STUDENT_USER);
            setIsPhoneVerified(true);
            setStudentProfile(DEMO_STUDENT_PROFILE);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(DEMO_STUDENT_USER));
            setDemoSessionCookie(DEMO_STUDENT_USER);
          } else {
            setUser(null);
            setIsPhoneVerified(false);
            clearSessionCookies();
          }

          const savedInterests = localStorage.getItem(AUTH_INTERESTS_KEY);
          if (savedInterests) {
            setUserInterestsState(JSON.parse(savedInterests));
          }
        } catch (e) {
          console.warn("Auth initialization error", e);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [loadAuthoritativeProfile]);

  const refreshSession = async () => {
    const supabase = getBrowserSupabaseClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setSupabaseUser(data.user);
        await loadAuthoritativeProfile(data.user);
      }
    }
  };

  // --- GOOGLE OAUTH ---
  const signInWithGoogle = async (redirectTo?: string) => {
    const supabase = getBrowserSupabaseClient();
    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        error: "Google Authentication is not configured. Supabase credentials required.",
      };
    }

    try {
      const callbackUrl = redirectTo || `${getAppUrl()}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to initialize Google login." };
    }
  };

  // --- EMAIL OTP ---
  const sendEmailOtp = async (email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    const supabase = getBrowserSupabaseClient();
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${getAppUrl()}/auth/callback`,
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e?.message || "Failed to send email verification code." };
      }
    }

    // Demo Mode simulation
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      return { success: true };
    }

    return { success: false, error: "Authentication system is not configured." };
  };

  const verifyEmailOtp = async (email: string, token: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanToken = token.trim();

    if (!cleanToken || cleanToken.length < 6) {
      return { success: false, error: "Please enter the 6-digit verification code." };
    }

    const supabase = getBrowserSupabaseClient();
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: "email",
        });

        if (error || !data.user) {
          return { success: false, error: error?.message || "Invalid or expired verification code." };
        }

        setSupabaseUser(data.user);
        await loadAuthoritativeProfile(data.user);
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e?.message || "Verification failed." };
      }
    }

    // Demo Mode simulation
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      const demoUser: UserProfile = {
        id: `user_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`,
        userId: `user_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`,
        name: cleanEmail.split("@")[0].toUpperCase(),
        email: cleanEmail,
        role: "STUDENT",
        preferredLanguage: "mr",
        onboardingCompleted: false,
        phoneVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(demoUser);
      setIsPhoneVerified(false);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(demoUser));
      setDemoSessionCookie(demoUser);
      return { success: true };
    }

    return { success: false, error: "Authentication system is not configured." };
  };

  // --- MOBILE OTP ---
  const sendMobileOtp = async (phone: string) => {
    const normalized = normalizeIndianMobile(phone);
    if (!normalized) {
      return { success: false, error: "Please enter a valid 10-digit Indian mobile number." };
    }

    const supabase = getBrowserSupabaseClient();
    if (isSupabaseConfigured() && supabase) {
      try {
        // If user is already logged in and linking/verifying their mobile
        if (supabaseUser) {
          const { error } = await supabase.auth.updateUser({
            phone: normalized,
          });
          if (error) {
            console.error("[sendMobileOtp Error]", error);
            return { success: false, error: sanitizeAuthError(error.message) };
          }
          return { success: true };
        }

        // New signin / signup via Mobile OTP
        const { error } = await supabase.auth.signInWithOtp({
          phone: normalized,
          options: {
            channel: "sms",
          },
        });

        if (error) {
          console.error("[sendMobileOtp Error]", error);
          return { success: false, error: sanitizeAuthError(error.message) };
        }

        return { success: true };
      } catch (e: any) {
        console.error("[sendMobileOtp Error]", e);
        return { success: false, error: sanitizeAuthError(e?.message) };
      }
    }

    // Demo Mode simulation
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      return { success: true };
    }

    return { success: false, error: "Authentication system is not configured." };
  };

  const verifyMobileOtp = async (phone: string, token: string) => {
    const normalized = normalizeIndianMobile(phone);
    const cleanToken = token.trim();

    if (!normalized) {
      return { success: false, error: "Invalid mobile number format." };
    }
    if (!cleanToken || cleanToken.length < 6) {
      return { success: false, error: "Please enter the 6-digit verification code." };
    }

    const supabase = getBrowserSupabaseClient();
    if (isSupabaseConfigured() && supabase) {
      try {
        // Call backend API to verify and update profiles table authoritatively
        const res = await fetch("/api/auth/verify-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: normalized, token: cleanToken }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || "Invalid or expired verification code." };
        }

        setIsPhoneVerified(true);
        if (user) {
          const updatedUser = { ...user, phone: normalized, phoneVerified: true };
          setUser(updatedUser);
        }
        await refreshSession();
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e?.message || "Mobile verification failed." };
      }
    }

    // Demo Mode simulation
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      setIsPhoneVerified(true);
      if (user) {
        const updatedUser = { ...user, phone: normalized, phoneVerified: true };
        setUser(updatedUser);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      }
      return { success: true };
    }

    return { success: false, error: "Authentication system is not configured." };
  };

  // --- COMPATIBILITY & DEMO LOGIN ---
  const login = async (email: string, explicitRole?: UserRole) => {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    if (!isDemoMode && process.env.NODE_ENV === "production") {
      return {
        success: false,
        error: "Passwordless demo bypass is disabled in production. Please use Email OTP, Mobile OTP, or Google Login.",
      };
    }

    setIsLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      let loggedUser: UserProfile;

      if (cleanEmail === "admin@nagriksetu.in" || explicitRole === "ADMIN") {
        loggedUser = DEMO_ADMIN_USER;
        setStudentProfile(null);
      } else if (cleanEmail === "student@nagriksetu.in") {
        loggedUser = DEMO_STUDENT_USER;
        const prof = await dataStore.getStudentProfile(loggedUser.id);
        setStudentProfile(prof || DEMO_STUDENT_PROFILE);
      } else {
        loggedUser = {
          id: `user_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`,
          userId: `user_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`,
          name: cleanEmail.split("@")[0].toUpperCase(),
          email: cleanEmail,
          role: "STUDENT",
          preferredLanguage: "mr",
          onboardingCompleted: true,
          phone: "+919820012345",
          phoneVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const prof = await dataStore.getStudentProfile(loggedUser.id);
        setStudentProfile(prof || { ...DEMO_STUDENT_PROFILE, userId: loggedUser.id });
      }

      setUser(loggedUser);
      setIsPhoneVerified(true);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(loggedUser));
      setDemoSessionCookie(loggedUser);
      return { success: true };
    } catch {
      return { success: false, error: "Login failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string) => {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    if (!isDemoMode && process.env.NODE_ENV === "production") {
      return {
        success: false,
        error: "Direct signup is disabled. Please sign up using Email OTP, Mobile OTP, or Google.",
      };
    }

    setIsLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        userId: `user_${Date.now()}`,
        name: name.trim(),
        email: cleanEmail,
        role: "STUDENT",
        preferredLanguage: "mr",
        onboardingCompleted: false,
        phoneVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(newUser);
      setIsPhoneVerified(false);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
      setDemoSessionCookie(newUser);
      return { success: true, user: newUser };
    } catch {
      return { success: false, error: "Registration failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const supabase = getBrowserSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn("Supabase signOut error", e);
      }
    }

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
    }

    setUser(null);
    setSupabaseUser(null);
    setStudentProfile(null);
    setIsPhoneVerified(false);

    try {
      localStorage.removeItem(AUTH_USER_KEY);
      clearSessionCookies();
    } catch (e) {
      console.warn("Logout cleanup error", e);
    }

    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const updateStudentProfile = async (profileData: Partial<StudentProfile>) => {
    if (!user) return;
    const updated = await dataStore.saveStudentProfile(user.id, profileData);
    setStudentProfile(updated);
  };

  const updateUserInterests = (interests: string[]) => {
    setUserInterestsState(interests);
    try {
      localStorage.setItem(AUTH_INTERESTS_KEY, JSON.stringify(interests));
    } catch (e) {
      console.warn("Error saving interests", e);
    }
  };

  const completeOnboarding = async (profileData: Partial<StudentProfile>, interests: string[]) => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    };
    setUser(updatedUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
    setDemoSessionCookie(updatedUser);

    const savedProf = await dataStore.saveStudentProfile(user.id, profileData);
    setStudentProfile(savedProf);
    updateUserInterests(interests);

    // Sync to Supabase if configured
    const supabase = getBrowserSupabaseClient();
    if (supabase && user.userId) {
      try {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
          .eq("user_id", user.userId);
      } catch (e) {
        console.warn("Failed to sync onboarding status to Supabase", e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        studentProfile,
        userInterests,
        isLoading,
        isPhoneVerified,
        signInWithGoogle,
        sendEmailOtp,
        verifyEmailOtp,
        sendMobileOtp,
        verifyMobileOtp,
        login,
        signup,
        logout,
        updateStudentProfile,
        updateUserInterests,
        completeOnboarding,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
