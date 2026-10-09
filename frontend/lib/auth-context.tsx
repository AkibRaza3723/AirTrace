"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  name: string;
  email: string;
  college: string;
  role: "Student" | "Faculty / Researcher" | "Campus Safety Officer" | "Environmental Health Officer";
  roleId?: string;
  roleDetails?: string;
  studentId?: string;
  deanAuthId?: string;
  isLoggedIn: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (profile: Omit<UserProfile, "isLoggedIn">) => void;
  logout: () => void;
  demoLogin: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const STORAGE_KEY = "airtrace_user_session";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const login = (profile: Omit<UserProfile, "isLoggedIn">) => {
    const fullUser: UserProfile = { ...profile, isLoggedIn: true };
    setUser(fullUser);
    setIsAuthModalOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fullUser));
    } catch {}
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const demoLogin = () => {
    login({
      name: "Alex Morgan",
      email: "alex.morgan@campus.edu",
      college: "Delhi Technological University (DTU)",
      role: "Student",
      studentId: "DTU-2026-CS-1048",
      deanAuthId: "DEAN-ENV-8842",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user: mounted ? user : null,
        isLoading: !mounted,
        login,
        logout,
        demoLogin,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
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
