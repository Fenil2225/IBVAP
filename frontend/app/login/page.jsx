"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../services/authservice";
import { isAuthenticated } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@ibvap.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated()) {
    router.push("/dashboard");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ibvap-shell flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel grid-surface w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 lg:flex">
        <div className="flex-1 bg-gradient-to-br from-teal-500/20 via-cyan-500/10 to-transparent p-8 lg:p-12">
          <div className="inline-flex rounded-full border border-teal-400/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-teal-300">
            IBVAP COMMAND
          </div>
          <h1 className="mt-6 text-4xl font-black text-white lg:text-5xl">Border Surveillance Intelligence</h1>
          <p className="mt-4 max-w-md text-base text-slate-300">
            Monitor live camera feeds, track intrusion activity, and review ANPR detections from a unified security operations view.
          </p>

          <div className="mt-8 space-y-4 text-sm text-slate-300">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/15 text-teal-300">01</span>
              Real-time perimeter monitoring
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">02</span>
              Automated ANPR detection workflow
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">03</span>
              Response-ready alerting dashboard
            </div>
          </div>
        </div>

        <div className="w-full max-w-md p-8 lg:p-12">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-teal-300">Login</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Welcome back</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500"
                placeholder="name@ibvap.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Authenticating..." : "Login to dashboard"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            No account yet? {" "}
            <Link href="/register" className="font-semibold text-teal-300 hover:text-teal-200">
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}