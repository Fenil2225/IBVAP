"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, Mail, Lock, UserCheck, ArrowRight } from "lucide-react";
import { registerUser } from "../../services/authservice";
import { isAuthenticated } from "../../lib/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "security_officer",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await registerUser(form.name, form.email, form.password, form.role);
      router.push(`/login?registered=true&email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(err.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ibvap-shell flex min-h-screen items-center justify-center p-4 lg:p-8">
      <div className="glass-panel grid-surface w-full max-w-xl rounded-[32px] border border-slate-800 p-8 lg:p-10 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-teal-300">
              <Shield className="h-3 w-3 text-teal-400" />
              Enrollment Portal
            </div>
            <h1 className="mt-3 text-2xl font-black text-white lg:text-3xl">
              Register Operator Profile
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Create an authorized credential to monitor border perimeter systems.
            </p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Full Officer Name
            </label>
            <div className="relative">
              <User className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-500" />
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Captain Rajesh Kumar"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-3 pr-4 pl-10 text-sm text-white placeholder:text-slate-600 focus:border-teal-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Official Email
            </label>
            <div className="relative">
              <Mail className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-500" />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="officer@ibvap.gov.in"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-3 pr-4 pl-10 text-sm text-white placeholder:text-slate-600 focus:border-teal-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Master Access Key / Password
            </label>
            <div className="relative">
              <Lock className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-500" />
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-3 pr-4 pl-10 text-sm text-white placeholder:text-slate-600 focus:border-teal-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Operational Clearance Level
            </label>
            <div className="relative">
              <UserCheck className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-500" />
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-3 pr-4 pl-10 text-sm text-white focus:border-teal-400"
              >
                <option value="security_officer">Security Officer (Monitoring & Incident Response)</option>
                <option value="admin">Administrator (Full Camera & System Control)</option>
                <option value="viewer">Viewer (Read-only Intelligence)</option>
              </select>
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
              "Enrolling Officer..."
            ) : (
              <>
                <span>Complete Enrollment</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already registered in the command matrix?{" "}
          <Link href="/login" className="font-bold text-teal-300 hover:text-teal-200">
            Sign In Here
          </Link>
        </p>
      </div>
    </main>
  );
}