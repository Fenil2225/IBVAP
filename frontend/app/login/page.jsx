"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Radio,
  Eye,
  Car,
  AlertTriangle,
  Cpu,
  KeyRound,
} from "lucide-react";
import { loginUser } from "../../services/authservice";
import { isAuthenticated } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@ibvap.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Login authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  }

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <main className="ibvap-shell flex min-h-screen items-center justify-center p-4 lg:p-8">
      <div className="glass-panel grid-surface w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-800 shadow-2xl lg:flex">
        {/* Left Tactical Feature Showcase */}
        <div className="flex-1 bg-gradient-to-br from-teal-500/15 via-cyan-500/5 to-slate-950/80 p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.25em] text-teal-300">
              <Cpu className="h-3.5 w-3.5 text-teal-400" />
              Smart India Hackathon • SIH
            </div>

            <h1 className="mt-6 text-3xl font-black text-white lg:text-4xl tracking-tight leading-tight">
              Intelligent Border Video Analytics Platform
            </h1>

            <p className="mt-4 text-sm text-slate-300 leading-relaxed max-w-md">
              AI-driven perimeter defense and surveillance suite featuring real-time YOLO intrusion detection, automated ANPR license plate forensics, and multi-camera RTSP streaming.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300">
                  <Radio className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Live Multi-Camera RTSP Matrix</div>
                  <div className="text-[11px] text-slate-400">Synchronized border perimeter feeds</div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
                  <Car className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Automated ANPR & OCR Intelligence</div>
                  <div className="text-[11px] text-slate-400">High-speed plate recognition & vehicle tagging</div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Instant Threat & Intrusion Triage</div>
                  <div className="text-[11px] text-slate-400">Real-time alert dispatch with 1-click resolution</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>IBVAP Defense Protocol</span>
            <span className="font-mono text-teal-400">SEC-ID // 2026-LIVE</span>
          </div>
        </div>

        {/* Right Authentication Form */}
        <div className="w-full max-w-md p-8 lg:p-12 flex flex-col justify-between bg-slate-950/60">
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-teal-400">
                <Lock className="h-3.5 w-3.5" /> Secure Authentication
              </div>
              <h2 className="mt-2 text-2xl font-extrabold text-white">Access Command Portal</h2>
              <p className="mt-1 text-xs text-slate-400">
                Enter authorized credentials to access tactical surveillance.
              </p>
            </div>

            {/* Quick Demo Credentials Pill */}
            <div className="mb-6 rounded-2xl border border-teal-500/20 bg-teal-500/5 p-3 text-xs">
              <div className="flex items-center justify-between text-teal-300 font-bold mb-1.5">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" /> Quick Fill Demo User:
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo("admin@ibvap.com", "admin123")}
                  className="flex-1 rounded-lg border border-teal-500/30 bg-teal-500/15 py-1 px-2 text-[11px] font-bold text-teal-200 hover:bg-teal-500/25"
                >
                  Admin Officer
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("officer@ibvap.com", "officer123")}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 py-1 px-2 text-[11px] font-medium text-slate-300 hover:bg-slate-800"
                >
                  Guard Officer
                </button>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Operator Email
                </label>
                <div className="relative">
                  <Mail className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-3 pr-4 pl-10 text-sm text-white placeholder:text-slate-600 focus:border-teal-400"
                    placeholder="officer@ibvap.gov.in"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Access Key / Password
                </label>
                <div className="relative">
                  <Lock className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-3 pr-4 pl-10 text-sm text-white placeholder:text-slate-600 focus:border-teal-400"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 py-3.5 px-4 font-extrabold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:opacity-95 disabled:opacity-60"
              >
                {loading ? (
                  "Authenticating Terminal..."
                ) : (
                  <>
                    <span>Enter Command Center</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Need a new command account?{" "}
            <Link href="/register" className="font-bold text-teal-300 hover:text-teal-200">
              Register Operator
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}