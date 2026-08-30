"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Activity,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Camera,
  Car,
  User,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  Cpu,
} from "lucide-react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import StatsCard from "../../../components/StatsCard";
import {
  getAnalyticsSummary,
  getDetectionStatistics,
  getAlertStatistics,
  getRecentDetections,
  getRecentAlerts,
} from "../../../services/analyticsservice";

export default function AnalyticsPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [detectionStats, setDetectionStats] = useState([]);
  const [alertStats, setAlertStats] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [sumRes, detRes, altRes, recDetRes, recAltRes] = await Promise.allSettled([
        getAnalyticsSummary(),
        getDetectionStatistics(),
        getAlertStatistics(),
        getRecentDetections(),
        getRecentAlerts(),
      ]);

      if (sumRes.status === "fulfilled") setSummary(sumRes.value?.data);
      if (detRes.status === "fulfilled") setDetectionStats(detRes.value?.data || []);
      if (altRes.status === "fulfilled") setAlertStats(altRes.value?.data || []);
      if (recDetRes.status === "fulfilled") setRecentDetections(recDetRes.value?.data || []);
      if (recAltRes.status === "fulfilled") setRecentAlerts(recAltRes.value?.data || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute totals
  const totalDetections = detectionStats.reduce((acc, d) => acc + (d.total || 0), 0) || 1;
  const totalAlerts = alertStats.reduce((acc, a) => acc + (a.total || 0), 0) || 1;

  return (
    <ProtectedRoute>
      <div className="ibvap-shell min-h-screen text-slate-100">
        <Sidebar isMobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

        <div className="md:ml-72 flex flex-col min-h-screen">
          <Navbar onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />

          <main className="grid-surface flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-teal-400" />
                  <p className="text-xs font-bold tracking-[0.28em] text-teal-400 uppercase">
                    Threat Telemetry
                  </p>
                </div>
                <h1 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  Perimeter Intelligence & Threat Analytics
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  Quantitative threat intelligence, classification volumes, and sector heat distributions.
                </p>
              </div>

              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:border-teal-500/40 hover:text-white"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-teal-400" : ""}`} />
                <span>Sync Analytics</span>
              </button>
            </div>

            {/* Top KPI row */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard
                title="Camera Network"
                value={`${summary?.cameras?.online || 0} / ${summary?.cameras?.total || 0}`}
                subtitle="Online vs Total Registered"
                icon={Camera}
                color="teal"
                trend="99.4% Operational"
              />

              <StatsCard
                title="Total Detections"
                value={summary?.detections?.total ?? totalDetections}
                subtitle="Indexed in database"
                icon={Activity}
                color="cyan"
                trend="YOLO Deep Engine"
              />

              <StatsCard
                title="Incident Alerts"
                value={summary?.alerts?.total ?? totalAlerts}
                subtitle={`${summary?.alerts?.unacknowledged || 0} unacknowledged`}
                icon={ShieldAlert}
                color="rose"
                trend={`${summary?.alerts?.resolved || 0} Resolved`}
              />

              <StatsCard
                title="Surveillance Archive"
                value={summary?.videos?.total || 0}
                subtitle="Footage files analyzed"
                icon={TrendingUp}
                color="emerald"
                trend="Indexed"
              />
            </section>

            {/* 2 Visual Distribution Charts / Breakdown Panes */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Detection Classification Breakdown */}
              <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white">Detection Classification Volumes</h2>
                    <p className="text-xs text-slate-400">Distribution by recognized entity type</p>
                  </div>
                  <span className="rounded-lg bg-teal-500/10 px-2 py-1 text-[11px] font-bold text-teal-300 border border-teal-500/20">
                    YOLOv11
                  </span>
                </div>

                <div className="space-y-4 pt-2">
                  {detectionStats.length > 0 ? (
                    detectionStats.map((item) => {
                      const percent = Math.round(((item.total || 0) / totalDetections) * 100);
                      const isIntrusion = item.detection_type?.toLowerCase() === "intrusion";
                      const isPerson = item.detection_type?.toLowerCase() === "person";

                      return (
                        <div key={item.detection_type} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="capitalize text-slate-300 flex items-center gap-2">
                              {isIntrusion ? (
                                <ShieldAlert className="h-4 w-4 text-rose-400" />
                              ) : isPerson ? (
                                <User className="h-4 w-4 text-amber-400" />
                              ) : (
                                <Car className="h-4 w-4 text-cyan-400" />
                              )}
                              <span>{item.detection_type}</span>
                            </span>
                            <span className="font-mono text-slate-200">
                              {item.total} logs ({percent}%)
                            </span>
                          </div>

                          <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                            <div
                              style={{ width: `${Math.max(percent, 4)}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${
                                isIntrusion
                                  ? "bg-gradient-to-r from-rose-500 to-red-400"
                                  : isPerson
                                  ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                                  : "bg-gradient-to-r from-teal-400 to-cyan-500"
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No classification data available yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Alert Severity Distribution */}
              <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white">Alert Severity Distribution</h2>
                    <p className="text-xs text-slate-400">Incident breakdown by threat level</p>
                  </div>
                  <span className="rounded-lg bg-rose-500/10 px-2 py-1 text-[11px] font-bold text-rose-300 border border-rose-500/20">
                    Threat Triage
                  </span>
                </div>

                <div className="space-y-4 pt-2">
                  {alertStats.length > 0 ? (
                    alertStats.map((item) => {
                      const percent = Math.round(((item.total || 0) / totalAlerts) * 100);
                      const isCritical = item.severity?.toLowerCase() === "critical";
                      const isHigh = item.severity?.toLowerCase() === "high";

                      return (
                        <div key={item.severity} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="capitalize text-slate-300 flex items-center gap-2">
                              <AlertTriangle
                                className={`h-4 w-4 ${
                                  isCritical
                                    ? "text-rose-400"
                                    : isHigh
                                    ? "text-orange-400"
                                    : "text-amber-400"
                                }`}
                              />
                              <span>{item.severity}</span>
                            </span>
                            <span className="font-mono text-slate-200">
                              {item.total} incidents ({percent}%)
                            </span>
                          </div>

                          <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                            <div
                              style={{ width: `${Math.max(percent, 4)}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCritical
                                  ? "bg-gradient-to-r from-rose-600 to-rose-400"
                                  : isHigh
                                  ? "bg-gradient-to-r from-orange-500 to-amber-400"
                                  : "bg-gradient-to-r from-amber-400 to-yellow-300"
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No alert severity data available yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent 20 Real-Time Telemetry Logs Table */}
            <section className="glass-panel rounded-3xl p-6 border border-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Full Detection Telemetry Audit</h2>
                  <p className="text-xs text-slate-400">
                    Latest entity classifications across all active border camera sensors.
                  </p>
                </div>
                <span className="text-xs font-mono text-teal-400 font-bold">
                  {recentDetections.length} Telemetry Events
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-sans">
                      <th className="pb-3 pl-2">Event ID</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Camera Sector</th>
                      <th className="pb-3">Confidence</th>
                      <th className="pb-3">Tracker ID</th>
                      <th className="pb-3 pr-2 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentDetections.length > 0 ? (
                      recentDetections.map((det) => (
                        <tr key={det.id} className="hover:bg-slate-900/40 transition">
                          <td className="py-3 pl-2 text-slate-400">#{det.id}</td>
                          <td className="py-3 font-sans">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                                det.detection_type === "intrusion"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : det.detection_type === "person"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                              }`}
                            >
                              {det.detection_type}
                            </span>
                          </td>
                          <td className="py-3 text-slate-200 font-sans">
                            {det.camera_name || `Cam #${det.camera_id}`}
                            {det.camera_code && (
                              <span className="text-slate-500 ml-1 font-mono text-[11px]">
                                ({det.camera_code})
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-teal-400 font-bold">
                            {Math.round((det.confidence || 0.85) * 100)}%
                          </td>
                          <td className="py-3 text-slate-400">
                            {det.tracking_id ? `TRK-${det.tracking_id}` : "--"}
                          </td>
                          <td className="py-3 pr-2 text-right text-slate-400 text-[11px] font-sans">
                            {det.detected_at
                              ? new Date(det.detected_at).toLocaleString()
                              : "Live Stream"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                          No detection telemetry records available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
