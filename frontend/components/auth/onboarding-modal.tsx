"use client";

import { useState } from "react";
import {
  X, CheckCircle2, Building2, UserCircle2,
  Shield, Sparkles, ArrowRight, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, UserProfile } from "@/lib/auth-context";

const ROLES: Array<{ id: UserProfile["role"]; title: string; desc: string; icon: string }> = [
  { id: "Student", title: "Student", desc: "Track commute exposure & personal intake metrics", icon: "🎓" },
  { id: "Faculty / Researcher", title: "Faculty / Researcher", desc: "Telemetry analysis, pollutant datasets & research export", icon: "🔬" },
  { id: "Campus Safety Officer", title: "Campus Safety Officer", desc: "Institutional air thresholds, sports & indoor protocols", icon: "🛡️" },
  { id: "Environmental Health Officer", title: "Health Officer", desc: "Micro-sensor networks & emergency incident reports", icon: "🌿" },
];

const ROLE_CONFIG: Record<
  UserProfile["role"],
  {
    title: string;
    description: string;
    idLabel: string;
    idPlaceholder: string;
    idHelp: string;
    detailLabel: string;
    detailPlaceholder: string;
    detailHelp: string;
    defaultId: string;
    defaultDetail: string;
    idIcon: string;
  }
> = {
  "Student": {
    title: "Student Academic Details",
    description: "Provide your student enrollment ID and degree branch to configure personal exposure telemetry.",
    idLabel: "Student / Roll Number / Enrollment ID",
    idPlaceholder: "e.g. 2026-CS-1048 or DTU/STU/8492",
    idHelp: "Your university roll number or student enrollment ID.",
    detailLabel: "Degree Program / Branch / Major",
    detailPlaceholder: "e.g. B.Tech Computer Science & Engineering (2024-2028)",
    detailHelp: "Your academic discipline or department.",
    defaultId: "DTU-2026-CS-1048",
    defaultDetail: "B.Tech Computer Science",
    idIcon: "🎓",
  },
  "Faculty / Researcher": {
    title: "Faculty & Researcher Credentials",
    description: "Provide your academic employee ID and research laboratory or department.",
    idLabel: "Faculty / Employee / Researcher ID",
    idPlaceholder: "e.g. FAC-ENV-4029 or RES-IITD-88",
    idHelp: "Your official faculty or researcher staff ID.",
    detailLabel: "Department / Research Laboratory",
    detailPlaceholder: "e.g. Dept. of Civil & Environmental Engineering / Air Quality Lab",
    detailHelp: "Your research division or teaching department.",
    defaultId: "FAC-ENV-4029",
    defaultDetail: "Dept. of Environmental Engineering",
    idIcon: "🔬",
  },
  "Campus Safety Officer": {
    title: "Campus Safety Directorate Credentials",
    description: "Provide your safety officer badge ID and designated campus zone or athletic jurisdiction.",
    idLabel: "Safety Officer Badge / Staff ID",
    idPlaceholder: "e.g. CSO-DEL-912 or SEC-CAMPUS-44",
    idHelp: "Your official campus safety officer badge number.",
    detailLabel: "Campus Zone / Athletic Directorate",
    detailPlaceholder: "e.g. Main Campus Athletic Complex & Outdoor Quad",
    detailHelp: "Zone or sports division under your air safety oversight.",
    defaultId: "CSO-DEL-912",
    defaultDetail: "Campus Emergency & Athletic Directorate",
    idIcon: "🛡️",
  },
  "Environmental Health Officer": {
    title: "Environmental Health Authority Credentials",
    description: "Provide your health officer registration license and regional sensor monitoring unit.",
    idLabel: "Health Officer License / Registration ID",
    idPlaceholder: "e.g. EHO-MOH-5521 or ENV-GOV-901",
    idHelp: "Your registered environmental health practitioner ID.",
    detailLabel: "Monitoring Unit / Health Directorate",
    detailPlaceholder: "e.g. Regional Air Quality & Micro-Sensor Network Unit",
    detailHelp: "Designated health jurisdiction or sensor network unit.",
    defaultId: "EHO-MOH-5521",
    defaultDetail: "Regional Environmental Health Directorate",
    idIcon: "🌿",
  },
};

export function OnboardingModal() {
  const { isAuthModalOpen, closeAuthModal, login } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    college: "",
    role: "Student" as UserProfile["role"],
    roleId: "",
    roleDetails: "",
  });
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isAuthModalOpen) return null;

  const currentRoleConfig = ROLE_CONFIG[formData.role] || ROLE_CONFIG["Student"];

  const handleComplete = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      login({
        name: formData.name || "Alex Morgan",
        email: formData.email || "user@campus.edu",
        college: formData.college || "Delhi Technological University (DTU)",
        role: formData.role,
        roleId: formData.roleId || currentRoleConfig.defaultId,
        roleDetails: formData.roleDetails || currentRoleConfig.defaultDetail,
        studentId: formData.roleId || currentRoleConfig.defaultId,
        deanAuthId: "AUTH-VERIFIED",
      });
      setStep(1);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-up">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        
        {/* Header & Steps Indicator */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                AT
              </span>
              <h3 className="font-bold text-gray-900 text-lg">
                {step === 1 && "Create AirTrace Account"}
                {step === 2 && "College & Role Selection"}
                {step === 3 && currentRoleConfig.title}
                {step === 4 && "Review & Unlock Access"}
              </h3>
            </div>
            <button
              onClick={closeAuthModal}
              className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  s === step ? "bg-blue-600" : s < step ? "bg-emerald-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[70vh]">
          
          {/* STEP 1: Account Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-gray-700">Full Name</Label>
                <Input
                  placeholder="e.g. Alex Morgan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 text-sm"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700">Institutional or Personal Email</Label>
                <Input
                  type="email"
                  placeholder="name@campus.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700">Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* STEP 2: College & Role Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  College / University Name
                </Label>
                <Input
                  placeholder="e.g. Delhi Technological University (DTU), IIT Delhi, Columbia..."
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  className="mt-1 text-sm"
                />
                <p className="text-[11px] text-gray-400 mt-1">Type your registered university or institution name.</p>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                  <UserCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Select Your Role
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ROLES.map((r) => {
                    const isSelected = formData.role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: r.id })}
                        className={`p-3 text-left rounded-xl border transition-all text-xs flex flex-col justify-between gap-1.5 cursor-pointer ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20 shadow-sm"
                            : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-base">{r.icon}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{r.title}</div>
                          <div className="text-gray-500 text-[11px] leading-tight mt-0.5">{r.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Dynamic Role-Specific Credentials */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-start gap-2.5">
                <span className="text-base shrink-0">{currentRoleConfig.idIcon}</span>
                <div>
                  <span className="font-bold text-blue-900 block">{currentRoleConfig.title}</span>
                  <span className="text-blue-800 text-[11px]">{currentRoleConfig.description}</span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  {currentRoleConfig.idLabel}
                </Label>
                <Input
                  placeholder={currentRoleConfig.idPlaceholder}
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="mt-1 text-sm font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">{currentRoleConfig.idHelp}</p>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  {currentRoleConfig.detailLabel}
                </Label>
                <Input
                  placeholder={currentRoleConfig.detailPlaceholder}
                  value={formData.roleDetails}
                  onChange={(e) => setFormData({ ...formData, roleDetails: e.target.value })}
                  className="mt-1 text-sm"
                />
                <p className="text-[11px] text-gray-400 mt-1">{currentRoleConfig.detailHelp}</p>
              </div>
            </div>
          )}

          {/* STEP 4: Verification Summary */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-gray-900">Review & Unlock Access</h4>
                <p className="text-xs text-gray-500">Your {formData.role} profile is ready</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-semibold text-gray-900">{formData.name || "Alex Morgan"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Institution:</span>
                  <span className="font-semibold text-gray-900">{formData.college || "Delhi Technological University (DTU)"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Assigned Role:</span>
                  <span className="font-semibold text-blue-700">{formData.role}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">{currentRoleConfig.idLabel.split("/")[0]}:</span>
                  <span className="font-mono font-semibold text-gray-900">{formData.roleId || currentRoleConfig.defaultId}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">{currentRoleConfig.detailLabel.split("/")[0]}:</span>
                  <span className="font-semibold text-emerald-700">{formData.roleDetails || currentRoleConfig.defaultDetail}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          {step > 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="text-xs gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button
              size="sm"
              onClick={() => {
                if (step === 3) {
                  if (!formData.roleId) setFormData((prev) => ({ ...prev, roleId: currentRoleConfig.defaultId }));
                  if (!formData.roleDetails) setFormData((prev) => ({ ...prev, roleDetails: currentRoleConfig.defaultDetail }));
                }
                setStep((s) => (s + 1) as any);
              }}
              className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={isVerifying}
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {isVerifying ? "Verifying..." : "Complete & Open Dashboard"}
              <CheckCircle2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
