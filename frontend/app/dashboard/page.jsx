"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { getDashboardSummary } from "../../services/analyticsservice";

const stats = [
  ["total_cameras", "Cameras", "bg-teal-400"],
  ["online_cameras", "Online now", "bg-emerald-400"],
  ["total_detections", "Detections", "bg-cyan-400"],
  ["unacknowledged_alerts", "Open alerts", "bg-amber-400"],
];

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch((err) => setError(err.message || "Unable to load dashboard data"));
  }, []);

  return (
    <ProtectedRoute>
      <div className="ibvap-shell min-h-screen text-white">
        <Sidebar />
        <div className="md:ml-72">
          <Navbar />
          <main className="grid-surface min-h-[calc(100vh-5rem)] p-5 lg:p-8">
            <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-teal-300">Operations snapshot</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-white lg:text-4xl">Surveillance dashboard</h1>
                <p className="mt-2 text-slate-400">A live view of cameras, detections, video processing, and response activity.</p>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-300">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />System monitoring active
              </div>
            </div>

            {error && <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map(([key, label, color]) => (
                <div key={key} className="glass-panel rounded-3xl p-5">
                  <div className={`mb-5 h-1 w-12 rounded-full ${color}`} />
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="mt-2 text-4xl font-black text-white">{summary ? summary[key] : "--"}</p>
                </div>
              ))}
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <MetricPanel title="Response queue" tag="Priority">
                <Metric label="Critical alerts" value={summary?.critical_alerts} tone="text-red-300" />
                <Metric label="High alerts" value={summary?.high_alerts} tone="text-amber-300" />
                <Metric label="Intrusion detections" value={summary?.intrusion_detections} tone="text-cyan-300" />
              </MetricPanel>
              <MetricPanel title="Infrastructure health" tag="Status">
                <Metric label="Online cameras" value={summary?.online_cameras} tone="text-emerald-300" />
                <Metric label="Offline cameras" value={summary?.offline_cameras} tone="text-slate-300" />
                <Metric label="Videos processing" value={summary?.processing_videos} tone="text-cyan-300" />
              </MetricPanel>
            </section>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function MetricPanel({ title, tag, children }) {
  return (
    <div className="glass-panel rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-teal-300">{tag}</span>
      </div>
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-2xl font-black ${tone}`}>{value ?? "--"}</span>
    </div>
  );
}