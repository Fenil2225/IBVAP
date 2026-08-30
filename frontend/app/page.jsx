"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isAuthenticated() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <main className="ibvap-shell flex items-center justify-center">
      <div className="glass-panel grid-surface rounded-3xl border px-8 py-10 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-xl font-bold text-slate-900">
          I
        </div>
        <p className="text-sm uppercase tracking-[0.32em] text-teal-300">Launching IBVAP</p>
        <h1 className="mt-3 text-3xl font-black text-white">Secure Border Intelligence</h1>
      </div>
    </main>
  );
}