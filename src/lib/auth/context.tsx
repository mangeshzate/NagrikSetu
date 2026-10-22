"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, StudentProfile, UserRole } from "@/types/database";
import { DEMO_STUDENT_USER, DEMO_STUDENT_PROFILE, DEMO_ADMIN_USER, DEMO_STUDENT_INTERESTS } from "../database/mockData";
import { dataStore } from "../database/store";

interface AuthContextType {
  user: UserProfile | null;
  studentProfile: StudentProfile | null;
  userInterests: string[];
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  logout: () => void;
  updateStudentProfile: (profile: Partial<StudentProfile>) => Promise<void>;
  updateUserInterests: (interests: string[]) => void;
  completeOnboarding: (profileData: Partial<StudentProfile>, interests: string[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = "nagriksetu_auth_user";
const AUTH_INTERESTS_KEY = "nagriksetu_user_interests";

function setSessionCookie(user: UserProfile) {
  if (typeof document === "undefined") return;
  const sessionData = {
    id: user.id,
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  document.cookie = `nagriksetu_session=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=604800; SameSite=Lax`;
}

function clearSessionCookie() {
  if (typeof document === "undefined") return;
  document.cookie = "nagriksetu_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [userInterests, setUserInterestsState] = useState<string[]>(DEMO_STUDENT_INTERESTS);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from local storage or demo configuration
  useEffect(() => {
    try {
      const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
      const savedUserStr = localStorage.getItem(AUTH_USER_KEY);
      if (savedUserStr) {
        const savedUser: UserProfile = JSON.parse(savedUserStr);
        setUser(savedUser);
        setSessionCookie(savedUser);
        dataStore.getStudentProfile(savedUser.id).then((p) => {
          if (p) setStudentProfile(p);
          else if (savedUser.role === "STUDENT") setStudentProfile(DEMO_STUDENT_PROFILE);
        });
      } else if (isDemoMode) {
        // Default session in DEMO mode only: Demo student logged in so reviewers can explore immediately
        setUser(DEMO_STUDENT_USER);
        setStudentProfile(DEMO_STUDENT_PROFILE);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(DEMO_STUDENT_USER));
        setSessionCookie(DEMO_STUDENT_USER);
      } else {
        // In production mode with no saved user: user remains null (unauthenticated)
        setUser(null);
        setStudentProfile(null);
        clearSessionCookie();
      }

      const savedInterests = localStorage.getItem(AUTH_INTERESTS_KEY);
      if (savedInterests) {
        setUserInterestsState(JSON.parse(savedInterests));
      }
    } catch (e) {
      console.warn("Auth initialization error", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, explicitRole?: UserRole) => {
    setIsLoading(true);
    try {
      const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
      const cleanEmail = email.toLowerCase().trim();
      let loggedUser: UserProfile;

      if (cleanEmail === "admin@nagriksetu.in" || explicitRole === "ADMIN") {
        if (!isDemoMode && process.env.NODE_ENV === "production") {
          return {
            success: false,
            error: "Direct passwordless demo admin login is disabled in production.",
          };
        }
        loggedUser = DEMO_ADMIN_USER;
        setStudentProfile(null);
      } else if (cleanEmail === "student@nagriksetu.in") {
        loggedUser = DEMO_STUDENT_USER;
        const prof = await dataStore.getStudentProfile(loggedUser.id);
        setStudentProfile(prof || DEMO_STUDENT_PROFILE);
      } else {
        // User created via signup
        loggedUser = {
          id: `user_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`,
          userId: `user_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`,
          name: cleanEmail.split("@")[0].toUpperCase(),
          email: cleanEmail,
          role: "STUDENT",
          preferredLanguage: "mr",
          onboardingCompleted: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const prof = await dataStore.getStudentProfile(loggedUser.id);
        setStudentProfile(prof || {
          ...DEMO_STUDENT_PROFILE,
          userId: loggedUser.id,
        });
      }

      setUser(loggedUser);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(loggedUser));
      setSessionCookie(loggedUser);
      return { success: true };
    } catch {
      return { success: false, error: "Login failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string) => {
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(newUser);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
      setSessionCookie(newUser);
      return { success: true, user: newUser };
    } catch {
      return { success: false, error: "Registration failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setStudentProfile(null);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
      clearSessionCookie();
    } catch (e) {
      console.warn("Logout error", e);
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

    const savedProf = await dataStore.saveStudentProfile(user.id, profileData);
    setStudentProfile(savedProf);
    updateUserInterests(interests);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        studentProfile,
        userInterests,
        isLoading,
        login,
        signup,
        logout,
        updateStudentProfile,
        updateUserInterests,
        completeOnboarding,
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
