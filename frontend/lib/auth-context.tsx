"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CampusProfile {
  id?: string;
  userId?: string;
  campusName: string;
  campusLatitude: number;
  campusLongitude: number;
  campusAddress?: string | null;
}

export type ProfessionType = "STUDENT" | "PROFESSIONAL";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profession: ProfessionType;
  onboardingCompleted: boolean;
  preferredAddress?: string | null;
  preferredLat?: number | null;
  preferredLng?: number | null;
  campusProfile?: CampusProfile | null;
  // Compatibility helpers
  role: "Student" | "Professional";
  college: string;
  isLoggedIn: boolean;
  createdAt?: string;
}

export interface SignupInput {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  profession: ProfessionType;
  campusName?: string;
  campusLatitude?: number;
  campusLongitude?: number;
  campusAddress?: string;
  preferredAddress?: string;
  preferredLat?: number;
  preferredLng?: number;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: any;
  redirectTo?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (data: SignupInput) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateCampusProfile: (data: {
    campusName: string;
    campusLatitude: number;
    campusLongitude: number;
    campusAddress?: string | null;
  }) => Promise<AuthResponse>;
  updateProfile: (data: {
    name?: string;
    preferredAddress?: string | null;
    preferredLat?: number | null;
    preferredLng?: number | null;
  }) => Promise<AuthResponse>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapBackendUser(backendUser: any): UserProfile {
  const isStudent = backendUser.profession === "STUDENT";
  return {
    id: backendUser.id,
    name: backendUser.name,
    email: backendUser.email,
    profession: backendUser.profession as ProfessionType,
    onboardingCompleted: Boolean(backendUser.onboardingCompleted),
    preferredAddress: backendUser.preferredAddress || null,
    preferredLat: backendUser.preferredLat || null,
    preferredLng: backendUser.preferredLng || null,
    campusProfile: backendUser.campusProfile || null,
    // Compatibility fields
    role: isStudent ? "Student" : "Professional",
    college: backendUser.campusProfile?.campusName || (isStudent ? "Campus Unset" : "N/A"),
    isLoggedIn: true,
    createdAt: backendUser.createdAt,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Check persistent server session on mount
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/auth/session`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(mapBackendUser(data.user));
          return;
        }
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Login action
  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const profile = mapBackendUser(data.user);
        setUser(profile);
        setIsAuthModalOpen(false);
        return { success: true, user: profile, redirectTo: data.redirectTo };
      }

      return {
        success: false,
        error: data.error || "Login failed. Please check your credentials.",
      };
    } catch (err: any) {
      return {
        success: false,
        error: "Network error occurred while signing in. Please verify connection.",
      };
    }
  };

  // Signup action
  const signup = async (input: SignupInput): Promise<AuthResponse> => {
    try {
      const res = await fetch(`${apiUrl}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });

      const data = await res.json();
      if ((res.status === 201 || res.ok) && data.success && data.user) {
        const profile = mapBackendUser(data.user);
        setUser(profile);
        setIsAuthModalOpen(false);
        return { success: true, user: profile, redirectTo: data.redirectTo };
      }

      return {
        success: false,
        error: data.error || "Failed to create account. Please check your details.",
      };
    } catch (err: any) {
      return {
        success: false,
        error: "Network error occurred while registering. Please verify connection.",
      };
    }
  };

  // Logout action
  const logout = async () => {
    try {
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    }
  };

  // Update Campus Profile (Student onboarding)
  const updateCampusProfile = async (campusData: {
    campusName: string;
    campusLatitude: number;
    campusLongitude: number;
    campusAddress?: string | null;
  }): Promise<AuthResponse> => {
    try {
      const res = await fetch(`${apiUrl}/api/profile/campus`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(campusData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (user) {
          setUser({
            ...user,
            onboardingCompleted: true,
            campusProfile: data.campusProfile,
            college: data.campusProfile.campusName,
          });
        }
        return { success: true, redirectTo: data.redirectTo || "/dashboard" };
      }

      return { success: false, error: data.error || "Failed to update campus profile." };
    } catch (err) {
      return { success: false, error: "Network error updating campus details." };
    }
  };

  // Update general profile
  const updateProfile = async (profileData: {
    name?: string;
    preferredAddress?: string | null;
    preferredLat?: number | null;
    preferredLng?: number | null;
  }): Promise<AuthResponse> => {
    try {
      const res = await fetch(`${apiUrl}/api/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profileData),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUser(mapBackendUser(data.user));
        return { success: true, user: data.user };
      }

      return { success: false, error: data.error || "Failed to update profile." };
    } catch (err) {
      return { success: false, error: "Network error updating profile." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        refreshSession,
        updateCampusProfile,
        updateProfile,
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
