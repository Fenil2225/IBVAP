"use client";

import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "▣" },
  { href: "/dashboard/cameras", label: "Cameras", icon: "◉" },
  { href: "/dashboard/videos", label: "Videos", icon: "▤" },
  { href: "/dashboard/alerts", label: "Alerts", icon: "⚑" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "◌" },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-72 border-r border-white/10 bg-slate-950/70 p-5 md:flex lg:flex">
      <div className="w-full">
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-teal-400/20 bg-teal-500/5 px-3 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 font-black text-slate-950">
            I
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-teal-300">IBVAP</div>
            <h2 className="text-lg font-bold text-white">Command Center</h2>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-slate-300 transition hover:border-teal-400/30 hover:bg-slate-900/80 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <span className="text-base text-teal-300">{icon}</span>
                {label}
              </span>
              <span className="text-xs text-slate-500 transition group-hover:text-teal-300">→</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}