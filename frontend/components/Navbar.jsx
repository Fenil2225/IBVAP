"use client";

import { useRouter } from "next/navigation";
import { getUser, logout } from "../lib/auth";

export default function Navbar() {
  const router = useRouter();
  const user = getUser();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="flex h-20 items-center justify-between border-b border-white/10 bg-slate-950/50 px-6 backdrop-blur-xl">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-teal-300">Live operations</p>
        <h1 className="mt-1 text-xl font-bold text-white">Border security overview</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden rounded-2xl border border-teal-400/20 bg-teal-500/5 px-3 py-2 text-right md:block">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Logged in</div>
          <div className="text-sm font-semibold text-white">{user?.name || "Operator"}</div>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
        >
          Logout
        </button>
      </div>
    </header>
  );
}