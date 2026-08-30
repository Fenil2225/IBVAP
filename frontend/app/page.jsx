"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { isAuthenticated } from "../lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className="ibvap-shell flex min-h-screen items-center justify-center p-4">
      <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-10 text-center max-w-sm w-full">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 font-black text-slate-950 shadow-xl shadow-teal-500/20">
          <Shield className="h-8 w-8 text-slate-950" />
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-teal-400">
          IBVAP Intelligence
        </p>
        <h1 className="mt-2 text-xl font-black text-white">Border Command System</h1>
        <p className="mt-1 text-xs text-slate-400">Routing to operational portal...</p>
      </div>
    </main>
  );
}