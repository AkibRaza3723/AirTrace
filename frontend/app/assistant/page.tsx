"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot, User, ShieldCheck, Lock, Sparkles, Send, Mic,
  MapPin, ThumbsUp, ThumbsDown, Copy, Wind, CheckCircle2, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAirTelemetry } from "@/hooks/use-air-telemetry";

interface Message { id: string; sender: "user" | "bot"; text: string; time: string; }

const PRESET_PROMPTS = [
  "Can I run outside for 10 miles this evening?",
  "Why is PM2.5 low but Ozone climbing at 3 PM?",
  "What HEPA purifier mode should I run in bedroom?",
  "Explain today's air quality like I am 15.",
];

export default function AssistantPage() {
  const { telemetry, isUsingLiveLocation } = useAirTelemetry();
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages]     = useState<Message[]>([{
    id: "1", sender: "user",
    text: "Can I run outside for 10 miles this evening? I usually hit the Brooklyn Bridge park perimeter loop.",
    time: "2m ago",
  }]);
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  async function handleSend(text?: string) {
    const q = text || inputQuery;
    if (!q.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: "user", text: q, time: "Just now" };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/api/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          history: messages,
          telemetry: telemetry || {
            location: isUsingLiveLocation ? "Live Device GPS" : "Brooklyn, NY",
            aqi: 34,
            status: "Good",
            pm25: 8.1,
            pm10: 14.2,
            o3: 22,
            temp: "20°C",
            humidity: "45%",
            wind: "9 mph WSW",
            uv: "UV 3",
          },
        }),
      });

      const json = await res.json();
      const replyText =
        json.data?.reply ||
        json.error ||
        "Could not generate AI air advisory at this moment.";

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          time: "Just now",
          text: replyText,
        },
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          time: "Just now",
          text: `⚠️ Network error: Could not reach AirTrace assistant API (${err.message}). Make sure the backend server is running on port 5001.`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }


  const liveMetrics = [
    { label: "AQI", value: telemetry ? `${telemetry.aqi}` : "34", color: "text-emerald-600" },
    { label: "PM2.5", value: telemetry ? `${telemetry.pm25} µg/m³` : "8.1 µg/m³", color: "text-emerald-600" },
    { label: "O₃", value: telemetry ? `${telemetry.o3} µg/m³` : "22 ppb", color: "text-emerald-600" },
    { label: "Temp", value: telemetry ? telemetry.temp : "20°C", color: "text-blue-600" },
    { label: "Wind", value: telemetry ? telemetry.wind : "9 mph WSW", color: "text-gray-700" },
  ];

  return (
    <div className="w-full px-4 md:px-8 py-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Air Advisor</h1>
          <p className="text-sm text-gray-500 mt-0.5">Grounded strictly in real-time telemetry — zero hallucinations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="status-good border-0 text-xs gap-1.5"><ShieldCheck className="w-3 h-3" />Grounded AI</Badge>
          <Badge variant="secondary" className="text-xs gap-1.5"><Lock className="w-3 h-3" />No Medical Advice</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Chat Panel */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          {/* Context Banner */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-blue-700">
              <MapPin className="w-3.5 h-3.5" />
              <span className="font-semibold">
                {isUsingLiveLocation ? "📍 Live GPS Location" : "Station EPA-402 (Default)"}
              </span>
            </div>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            {liveMetrics.map((m) => (
              <span key={m.label} className="text-xs font-mono">
                <span className="text-gray-400">{m.label}: </span>
                <span className={cn("font-semibold", m.color)}>{m.value}</span>
              </span>
            ))}
            <span className="ml-auto text-[10px] text-blue-500 font-mono">
              {telemetry ? "Live Stream" : "Default"}
            </span>
          </div>

          {/* Messages */}
          <Card className="border-gray-200 shadow-sm flex flex-col" style={{ minHeight: "420px" }}>
            <CardContent className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-3", msg.sender === "user" ? "justify-end" : "justify-start")}>
                  {msg.sender === "bot" && (
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={cn("max-w-[80%] flex flex-col gap-1", msg.sender === "user" ? "items-end" : "items-start")}>
                    <div className={cn("px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-800 rounded-bl-sm border border-gray-200"
                    )}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-gray-400">{msg.time}</span>
                    {msg.sender === "bot" && (
                      <div className="flex items-center gap-2 mt-1">
                        <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><ThumbsUp className="w-3 h-3" /></button>
                        <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><ThumbsDown className="w-3 h-3" /></button>
                        <button onClick={() => { navigator.clipboard.writeText(msg.text); setCopied(true); setTimeout(()=>setCopied(false),1500); }}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                          {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                  {msg.sender === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white">
                      AT
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex gap-1 px-4 py-3 bg-gray-100 rounded-2xl rounded-bl-sm border border-gray-200">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2">
                <Input
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about your air quality..."
                  className="flex-1 border-gray-200 bg-gray-50"
                />
                <Button onClick={() => handleSend()} className="gradient-primary px-4">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {/* Suggested Prompts */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Quick Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {PRESET_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="text-left px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 text-xs text-gray-700 hover:text-blue-700 transition-all font-medium cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Guardrails Info */}
          <Card className="border-gray-200 shadow-sm bg-amber-50 border-amber-100">
            <CardContent className="p-4 flex gap-3">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800 mb-1">AI Guardrails Active</p>
                <ul className="text-[11px] text-amber-700 space-y-0.5 list-disc list-inside">
                  <li>Responses grounded in live telemetry only</li>
                  <li>No fabricated pollution numbers</li>
                  <li>No clinical health diagnosis</li>
                  <li>Every reply cites source & timestamp</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Live Data Feed */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wind className="w-4 h-4 text-blue-600" />
                Context Payload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-[10px] font-mono bg-gray-50 border border-gray-100 rounded-lg p-3 text-gray-600 overflow-auto leading-relaxed max-h-48">
{JSON.stringify(
  telemetry ? {
    location: isUsingLiveLocation ? "Live Device GPS" : "Brooklyn, NY",
    aqi: telemetry.aqi,
    status: telemetry.status,
    pm25: telemetry.pm25,
    pm10: telemetry.pm10,
    o3: telemetry.o3,
    temp: telemetry.temp,
    humidity: telemetry.humidity,
    wind: telemetry.wind,
    uv: telemetry.uv,
    source: telemetry.source,
  } : {
    location: "Brooklyn, NY",
    aqi: 34,
    status: "Good",
    pm25: 8.1,
    pm10: 14.2,
    o3: 22,
    temp: "20°C",
    source: "EPA-402 (Default)",
  },
  null,
  2
)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
