"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Bot,
  User,
  ShieldCheck,
  Lock,
  Sparkles,
  Send,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Wind,
  CheckCircle2,
  Info,
  RotateCcw,
  Thermometer,
  Droplets,
  Gauge,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileCode,
  HeartPulse,
  AlertTriangle,
  Flame,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAirTelemetry } from "@/hooks/use-air-telemetry";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  groundedMetrics?: {
    aqi: number;
    status: string;
    pm25: number;
  };
}

interface PromptCategory {
  category: string;
  prompts: string[];
}

const CATEGORIZED_PROMPTS: PromptCategory[] = [
  {
    category: "🏃 Outdoor & Sports",
    prompts: [
      "Can I run outside for 5 km this evening?",
      "What is the safest hour for outdoor athletics today?",
      "Is it safe for children to play soccer in this air?",
    ],
  },
  {
    category: "🏠 Indoor & Filtration",
    prompts: [
      "What HEPA purifier fan speed should I run right now?",
      "Should I open my windows for cross ventilation today?",
      "How effective is an indoor air purifier with PM2.5 at this level?",
    ],
  },
  {
    category: "😷 Health & Masks",
    prompts: [
      "Do I need an N95 mask for my 30-minute walking commute?",
      "What precautions should an asthmatic person take today?",
      "Why is Ozone low in the morning but surging at 2 PM?",
    ],
  },
  {
    category: "🚨 Regulatory & GRAP",
    prompts: [
      "What GRAP Stage restrictions apply under current Delhi AQI?",
      "Explain today's atmospheric inversion impact simply.",
    ],
  },
];

type UserPerspective = "general" | "athlete" | "sensitive" | "school_admin";

const PERSPECTIVE_CONFIG: Record<
  UserPerspective,
  { label: string; icon: string; desc: string; prefix: string }
> = {
  general: {
    label: "General Citizen",
    icon: "👤",
    desc: "Everyday lifestyle, transit, and indoor ventilation advice.",
    prefix: "",
  },
  athlete: {
    label: "Outdoor Athlete",
    icon: "🏃",
    desc: "Cardio exertion windows, aerobic threshold, and recovery.",
    prefix: "[Perspective: Endurance Athlete / High Exertion] ",
  },
  sensitive: {
    label: "Sensitive Respiratory",
    icon: "🫁",
    desc: "Asthma, elderly, pediatric, and high-particulate defense.",
    prefix: "[Perspective: Asthmatic / High Risk Vulnerable Group] ",
  },
  school_admin: {
    label: "School Administrator",
    icon: "🎓",
    desc: "Campus recess, PE outdoor guidelines, and student safety.",
    prefix: "[Perspective: University / School Administrator] ",
  },
};

export default function AssistantPage() {
  const { telemetry, isUsingLiveLocation } = useAirTelemetry();
  const [inputQuery, setInputQuery] = useState("");
  const [perspective, setPerspective] = useState<UserPerspective>("general");
  const [showPayloadInspector, setShowPayloadInspector] = useState(false);

  // Initial welcome message grounded in current environment
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "👋 Hello! I am **AirTrace Copilot**, your environmental and respiratory intelligence advisor.\n\nI am directly tethered to real-time atmospheric telemetry and CPCB National Air Quality standards. Ask me anything about safe outdoor workout windows, mask protocols, indoor HEPA filtration, or GRAP restrictions.",
      time: "Just now",
      groundedMetrics: {
        aqi: telemetry?.aqi ?? 142,
        status: telemetry?.status ?? "Moderate",
        pm25: telemetry?.pm25 ?? 52.4,
      },
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Telemetry fallback defaults tailored to Delhi-NCR / CPCB
  const activeTelemetryPayload = useMemo(() => {
    return (
      telemetry || {
        location: isUsingLiveLocation ? "Live Device GPS" : "Delhi-NCR Central Grid",
        aqi: 142,
        status: "Moderate",
        pm25: 52.4,
        pm10: 118.0,
        o3: 28.5,
        no2: 44.2,
        so2: 12.0,
        co: 1.1,
        temp: "26°C",
        humidity: "58%",
        wind: "8 km/h NW",
        uv: "UV 4",
        source: "CPCB CAAQMS Grid (Delhi)",
      }
    );
  }, [telemetry, isUsingLiveLocation]);

  async function handleSend(text?: string) {
    const rawQuery = text || inputQuery;
    if (!rawQuery.trim()) return;

    const queryWithPerspective =
      perspective !== "general"
        ? `${PERSPECTIVE_CONFIG[perspective].prefix}${rawQuery}`
        : rawQuery;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: rawQuery,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/api/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryWithPerspective,
          history: messages,
          telemetry: activeTelemetryPayload,
        }),
      });

      const json = await res.json();
      const replyText =
        json.data?.reply ||
        json.error ||
        "Could not generate AI air advisory at this moment.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: replyText,
          groundedMetrics: {
            aqi: activeTelemetryPayload.aqi,
            status: activeTelemetryPayload.status,
            pm25: activeTelemetryPayload.pm25,
          },
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: `⚠️ **Connection Notice:** Could not communicate with AirTrace assistant service (${err.message}). Ensure backend server is reachable on port 5001.`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const categoryBadgeColor = (cat?: string) => {
    switch (cat?.toLowerCase()) {
      case "good":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "satisfactory":
        return "bg-green-100 text-green-800 border-green-300";
      case "moderate":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "poor":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "very poor":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "severe":
        return "bg-red-200 text-red-900 border-red-400";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4.5rem)] px-3 md:px-6 py-4 flex flex-col gap-4 max-w-[1700px] mx-auto animate-fade-up">
      {/* 1. Top Enterprise AI Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
                AirTrace Neural Copilot
              </h1>
              <Badge variant="outline" className="text-xs font-semibold bg-indigo-50 text-indigo-700 border-indigo-200 gap-1 hidden sm:inline-flex">
                <Sparkles className="w-3 h-3" /> AWS Bedrock Claude 3.5 Sonnet
              </Badge>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">
              Evidence-based atmospheric copilot strictly grounded in real-time CAAQMS sensors.
            </p>
          </div>
        </div>

        {/* Perspective Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hidden lg:inline">
            Advisory Lens:
          </span>
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200 text-xs">
            {(Object.keys(PERSPECTIVE_CONFIG) as UserPerspective[]).map((key) => {
              const cfg = PERSPECTIVE_CONFIG[key];
              const isActive = perspective === key;
              return (
                <button
                  key={key}
                  onClick={() => setPerspective(key)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5",
                    isActive
                      ? "bg-white text-gray-900 shadow-xs font-semibold"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                  title={cfg.desc}
                >
                  <span>{cfg.icon}</span>
                  <span className="hidden md:inline">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Live Telemetry HUD Strip */}
      <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-xs border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
            <MapPin className="w-3.5 h-3.5" />
            <span>{isUsingLiveLocation ? "Live GPS Coordinates" : "Delhi-NCR Monitoring Grid"}</span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* Active Sensor Metrics */}
          <div className="flex items-center gap-3 font-mono text-[11px] overflow-x-auto">
            <span className="flex items-center gap-1">
              <span className="text-gray-400">AQI:</span>
              <span className="font-bold text-amber-400">{activeTelemetryPayload.aqi}</span>
              <span className="text-[9px] text-gray-400 font-sans">({activeTelemetryPayload.status})</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <span className="text-gray-400">PM2.5:</span>
              <span className="font-bold text-rose-400">{activeTelemetryPayload.pm25} µg</span>
            </span>
            <span className="text-slate-600 hidden md:inline">•</span>
            <span className="hidden md:flex items-center gap-1">
              <span className="text-gray-400">PM10:</span>
              <span className="font-bold text-yellow-400">{activeTelemetryPayload.pm10} µg</span>
            </span>
            <span className="text-slate-600 hidden lg:inline">•</span>
            <span className="hidden lg:flex items-center gap-1">
              <span className="text-gray-400">O₃:</span>
              <span className="font-bold text-sky-400">{activeTelemetryPayload.o3} µg</span>
            </span>
            <span className="text-slate-600 hidden xl:inline">•</span>
            <span className="hidden xl:flex items-center gap-1">
              <span className="text-gray-400">Wind:</span>
              <span className="text-gray-300 font-sans">{activeTelemetryPayload.wind}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">
            Grounding Active
          </span>
        </div>
      </div>

      {/* 3. Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-stretch">
        {/* Left Column: Interactive Chat Interface (7 or 8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3">
          <Card className="border-gray-200/80 shadow-xs rounded-2xl bg-white flex flex-col flex-1 min-h-[520px] max-h-[720px] overflow-hidden">
            {/* Chat Messages Timeline */}
            <CardContent className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex gap-3", msg.sender === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.sender === "bot" && (
                    <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shrink-0 mt-0.5 shadow-xs text-white">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[85%] sm:max-w-[78%] flex flex-col gap-1.5",
                      msg.sender === "user" ? "items-end" : "items-start"
                    )}
                  >
                    {/* Speech Bubble */}
                    <div
                      className={cn(
                        "px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs",
                        msg.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-xs font-medium"
                          : "bg-slate-50 text-gray-800 rounded-bl-xs border border-gray-200/80"
                      )}
                    >
                      <div className="whitespace-pre-line font-sans">{msg.text}</div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-2 px-1 text-[10px] text-gray-400">
                      <span>{msg.time}</span>
                      {msg.sender === "bot" && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                            <ShieldCheck className="w-3 h-3" /> Grounded
                          </span>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {msg.sender === "user" && (
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-2xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing State */}
              {isTyping && (
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shrink-0 text-white shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 rounded-2xl rounded-bl-xs border border-gray-200 text-xs text-gray-500">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="ml-2 font-medium text-gray-600">Cross-referencing CPCB NAQI observations...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </CardContent>

            {/* Categorized Quick Question Chips */}
            <div className="px-4 py-2 bg-gray-50/70 border-t border-gray-100 flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">
                Quick Prompts:
              </span>
              {CATEGORIZED_PROMPTS.flatMap((c) => c.prompts)
                .slice(0, 5)
                .map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-700 text-gray-700 border border-gray-200 text-[11px] whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    💡 {p}
                  </button>
                ))}
            </div>

            {/* Chat Input Console */}
            <div className="p-3 bg-white border-t border-gray-200/80">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={`Ask AirTrace Copilot (e.g. 'Can I run outside today?', 'HEPA filter settings?')...`}
                  className="flex-1 text-xs sm:text-sm h-10 bg-gray-50/80 rounded-xl border-gray-200 focus:bg-white"
                />
                <Button
                  type="submit"
                  disabled={isTyping || !inputQuery.trim()}
                  className="gradient-primary h-10 px-4 text-xs font-bold text-white rounded-xl shadow-xs gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Right Column: Telemetry Grounding & Guardrails Intelligence (4 or 5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3.5">
          {/* Active Reasoning Telemetry Node */}
          <Card className="border-gray-200/80 shadow-xs rounded-2xl bg-white">
            <CardHeader className="pb-2.5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-blue-600" />
                  Active Telemetry Grounding Node
                </CardTitle>
                <Badge className={cn("text-[10px] font-bold", categoryBadgeColor(activeTelemetryPayload.status))}>
                  {activeTelemetryPayload.status}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Real-time metrics injected into the AI system prompt to prevent hallucinations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Primary Score Deck */}
              <div className="p-3 rounded-xl bg-slate-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Current NAQI Score</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black font-mono text-gray-950">
                      {activeTelemetryPayload.aqi}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">CPCB Standard</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Prominent Particulate</span>
                  <p className="text-sm font-extrabold text-rose-600 font-mono">
                    {activeTelemetryPayload.pm25} µg/m³
                  </p>
                  <span className="text-[10px] text-gray-500">Fine Dust (PM2.5)</span>
                </div>
              </div>

              {/* Multi-Pollutant Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-[10px] text-gray-400 font-bold block">PM10</span>
                  <span className="font-mono font-bold text-gray-800">{activeTelemetryPayload.pm10}</span>
                  <span className="text-[9px] text-gray-400 block">µg/m³</span>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-[10px] text-gray-400 font-bold block">O₃</span>
                  <span className="font-mono font-bold text-gray-800">{activeTelemetryPayload.o3}</span>
                  <span className="text-[9px] text-gray-400 block">µg/m³</span>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-[10px] text-gray-400 font-bold block">NO₂</span>
                  <span className="font-mono font-bold text-gray-800">{activeTelemetryPayload.no2 ?? 44.2}</span>
                  <span className="text-[9px] text-gray-400 block">µg/m³</span>
                </div>
              </div>

              {/* Environmental Ambient Factors */}
              <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-600 pt-1 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                  <span>{activeTelemetryPayload.temp}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span>{activeTelemetryPayload.humidity}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-teal-500" />
                  <span>{activeTelemetryPayload.wind}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Guardrails & Regulatory Compliance Card */}
          <Card className="border-gray-200/80 shadow-xs rounded-2xl bg-amber-50/50 border-amber-200/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-amber-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Zero-Hallucination Guardrails Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-[11px] text-amber-900 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Sensor Anchored: </strong>Answers strictly tethered to live telemetry numbers.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Domain Constrained: </strong>Refuses unrelated or general trivia queries.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Non-Medical: </strong>Preventative lifestyle guidance only; no clinical prescriptions.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Collapsible Telemetry Context Payload Inspector */}
          <Card className="border-gray-200/80 shadow-xs rounded-2xl bg-white">
            <button
              onClick={() => setShowPayloadInspector(!showPayloadInspector)}
              className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold text-gray-900">System Telemetry Payload</span>
              </div>
              {showPayloadInspector ? (
                <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>

            {showPayloadInspector && (
              <CardContent className="pt-0 pb-3.5 px-3.5">
                <pre className="text-[10px] font-mono bg-slate-900 text-slate-200 rounded-xl p-3 max-h-48 overflow-auto leading-relaxed border border-slate-800">
                  {JSON.stringify(activeTelemetryPayload, null, 2)}
                </pre>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
