"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "../../services/authservice";
import { isAuthenticated } from "../../lib/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated()) {
    router.push("/dashboard");
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await registerUser(form.name, form.email, form.password, form.role);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ibvap-shell flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel w-full max-w-xl rounded-[30px] border border-white/10 p-8 lg:p-10">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.28em] text-teal-300">Register</p>
          <h1 className="mt-2 text-3xl font-black text-white">Create your command account</h1>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Full name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter full name"
              required
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="name@ibvap.com"
              required
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create password"
              required
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-white"
            >
              <option value="viewer">Viewer</option>
              <option value="security_officer">Security Officer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-400 px-4 py-3 font-semibold text-slate-950 hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account? {" "}
          <Link href="/login" className="font-semibold text-teal-300 hover:text-teal-200">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}