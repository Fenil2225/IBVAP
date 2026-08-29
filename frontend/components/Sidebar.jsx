"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-slate-800 bg-slate-900 p-4 md:block">

      <div className="mb-8 px-3">
        <h2 className="text-xl font-bold text-white">
          IBVAP
        </h2>
      </div>

      <nav className="space-y-2">

        <Link
          href="/dashboard"
          className="block rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Dashboard
        </Link>

        <Link
          href="/dashboard/cameras"
          className="block rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Cameras
        </Link>

        <Link
          href="/dashboard/videos"
          className="block rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Videos
        </Link>

        <Link
          href="/dashboard/alerts"
          className="block rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Alerts
        </Link>

        <Link
          href="/dashboard/analytics"
          className="block rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Analytics
        </Link>

      </nav>
    </aside>
  );
}