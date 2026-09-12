"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Camera,
  Radio,
  Car,
  ShieldAlert,
  Video,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  Plus,
  Upload,
  Search,
} from "lucide-react";
import ProtectedRoute from "../../components/ProtectedRoute";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import StatsCard from "../../components/StatsCard";
import LiveStreamPlayer from "../../components/LiveStreamPlayer";
import AlertCard from "../../components/AlertCard";
import { getDashboardSummary, getRecentDetections, getRecentAlerts } from "../../services/analyticsservice";
import { getCameras } from "../../services/cameraservice";
import { acknowledgeAlert, resolveAlert } from "../../services/alertservice";
import { getUser } from "../../lib/auth";

export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const user = getUser();
  const canRespond = user?.role === "admin" || user?.role === "security_officer";
  const canConfigure = user?.role === "admin";

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [sumRes, camRes, detRes, altRes] = await Promise.allSettled([
        getDashboardSummary(),
        getCameras(),
        getRecentDetections(),
        getRecentAlerts(),
      ]);

      if (sumRes.status === "fulfilled") setSummary(sumRes.value);
      if (camRes.status === "fulfilled") setCameras(Array.isArray(camRes.value) ? camRes.value : []);
      if (detRes.status === "fulfilled" && detRes.value?.data) {
        setRecentDetections(Array.isArray(detRes.value.data) ? detRes.value.data : []);
      }
      if (altRes.status === "fulfilled" && altRes.value?.data) {
        setRecentAlerts(Array.isArray(altRes.value.data) ? altRes.value.data : []);
      }
      setError("");
    } catch (err) {
      setError(err.message || "Failed to sync operations telemetry");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 8000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleAcknowledge = async (id) => {
    await acknowledgeAlert(id);
    loadData(true);
  };

  const handleResolve = async (id) => {
    await resolveAlert(id);
    loadData(true);
  };

  const onlineCameras = cameras.filter((c) => c.status === "online");
  const triageAlerts = [...recentAlerts]
    .filter((alert) => alert.status !== "resolved")
    .sort((left, right) => {
      const severityRank = { critical: 0, high: 1, medium: 2, low: 3 };
      return (severityRank[left.severity] ?? 4) - (severityRank[right.severity] ?? 4);
    })
    .slice(0, 4);

  return (
    <ProtectedRoute>
      <div className="ibvap-shell min-h-screen text-slate-100">
        <Sidebar isMobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

        <div className="md:ml-72 flex flex-col min-h-screen">
          <Navbar onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />

          <main className="grid-surface flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping"></span>
                  <p className="text-xs font-bold tracking-[0.28em] text-teal-400 uppercase">
                    Border Command & Control
                  </p>
                </div>
                <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-white lg:text-4xl">
                  Surveillance Operations Center
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  Real-time video analytics, AI intrusion triage, and multi-sector border security.
                </p>
              </div>

              {/* Quick Actions & Status */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => loadData(true)}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-bold text-slate-300 transition hover:border-teal-500/40 hover:text-white disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-teal-400" : ""}`} />
                  <span>{refreshing ? "Syncing..." : "Sync Live Data"}</span>
                </button>

                <Link
                  href="/dashboard/live"
                  className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-teal-400 to-cyan-500 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:opacity-95"
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>Open Video Matrix</span>
                </Link>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs sm:text-sm text-rose-300 flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => loadData()} className="underline font-bold ml-2">
                  Retry Connection
                </button>
              </div>
            )}

            {/* Top 4 KPI Metrics */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard
                title="Active Cameras"
                value={summary?.total_cameras ?? cameras.length}
                subtitle={`${summary?.online_cameras ?? onlineCameras.length} Online • ${summary?.offline_cameras ?? 0} Standby`}
                icon={Camera}
                color="teal"
                trend="99.8% Uptime"
              />

              <StatsCard
                title="AI Detections"
                value={summary?.total_detections ?? "--"}
                subtitle={`${summary?.person_detections ?? 0} Persons • ${summary?.vehicle_detections ?? 0} Vehicles`}
                icon={Activity}
                color="cyan"
                trend="YOLOv11 Live"
              />

              <StatsCard
                title="Intrusion Alerts"
                value={summary?.total_alerts ?? recentAlerts.length}
                subtitle={`${summary?.unacknowledged_alerts ?? 0} Open • ${summary?.critical_alerts ?? 0} Critical`}
                icon={ShieldAlert}
                color="rose"
                trend={summary?.unacknowledged_alerts > 0 ? "ACTION REQ" : "Clear"}
              />

              <StatsCard
                title="Forensic Videos"
                value={summary?.total_videos ?? "--"}
                subtitle={`${summary?.processed_videos ?? 0} Processed • ${summary?.processing_videos ?? 0} In Queue`}
                icon={Video}
                color="emerald"
                trend="Automated"
              />
            </section>

            {/* Quick Launchpad Toolbar */}
            <section className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <ShieldCheck className="h-4 w-4 text-teal-400" />
                <span>Operational Quick Launch:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canConfigure && <Link
                  href="/dashboard/cameras"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-teal-500/40 hover:text-white"
                >
                  <Plus className="h-3 w-3 text-teal-400" /> Add Camera
                </Link>}
                {canRespond && <Link
                  href="/dashboard/videos"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-teal-500/40 hover:text-white"
                >
                  <Upload className="h-3 w-3 text-cyan-400" /> Upload Video
                </Link>}
                <Link
                  href="/dashboard/anpr"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-teal-500/40 hover:text-white"
                >
                  <Search className="h-3 w-3 text-amber-400" /> Lookup ANPR Plate
                </Link>
              </div>
            </section>

            {/* Main Operational Split: Live Stream Spotlight + Alert Triage */}
            <div className="grid items-start gap-6 xl:grid-cols-12">
              {/* Left 2 Cols: Live Camera Stream View */}
              <div className="space-y-6 xl:col-span-8">
                <div className="glass-panel rounded-3xl p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                        <h2 className="text-lg font-bold text-white">Live Surveillance Spotlight</h2>
                      </div>
                      <p className="text-xs text-slate-400">
                        Primary tactical camera RTSP video feed with active AI overlay.
                      </p>
                    </div>

                    <Link
                      href="/dashboard/live"
                      className="flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300"
                    >
                      <span>View All Multi-Cameras</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {cameras.length > 0 ? (
                    <LiveStreamPlayer camera={onlineCameras[0] || cameras[0]} />
                  ) : (
                    <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-6 text-center">
                      <Camera className="h-10 w-10 text-slate-700 mb-2" />
                      <p className="text-sm font-bold text-slate-400">No cameras configured yet</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Register a border surveillance camera to begin live streaming.
                      </p>
                      <Link
                        href="/dashboard/cameras"
                        className="mt-4 rounded-xl bg-teal-500/10 border border-teal-500/30 px-3 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-500/20"
                      >
                        Register Camera
                      </Link>
                    </div>
                  )}
                </div>

                {/* Recent AI Detection Telemetry Feed */}
                <div className="glass-panel rounded-3xl p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white">Real-Time Threat Telemetry</h2>
                      <p className="text-xs text-slate-400">
                        Live detection logs parsed by YOLOv11 deep learning pipeline.
                      </p>
                    </div>

                    <Link
                      href="/dashboard/analytics"
                      className="flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300"
                    >
                      <span>Full Analytics</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                          <th className="pb-3 pl-2">Detection Type</th>
                          <th className="pb-3">Camera Sector</th>
                          <th className="pb-3">Confidence</th>
                          <th className="pb-3">Track ID</th>
                          <th className="pb-3 pr-2 text-right">Detected At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {recentDetections.length > 0 ? (
                          recentDetections.slice(0, 6).map((det) => (
                            <tr key={det.id} className="hover:bg-slate-900/40 transition">
                              <td className="py-3 pl-2 font-sans">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
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
                              <td className="py-3 text-slate-300 font-sans">
                                {det.camera_name || `Cam #${det.camera_id}`}
                              </td>
                              <td className="py-3 text-teal-400 font-bold">
                                {Math.round((det.confidence || 0.85) * 100)}%
                              </td>
                              <td className="py-3 text-slate-400">
                                {det.tracking_id ? `#${det.tracking_id}` : "--"}
                              </td>
                              <td className="py-3 pr-2 text-right text-slate-400 font-sans text-[11px]">
                                {det.detected_at
                                  ? new Date(det.detected_at).toLocaleTimeString()
                                  : "Live"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-500 font-sans">
                              No recent detection records found in database.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right 1 Col: Incident & Threat Response Stream */}
              <div className="space-y-6 xl:col-span-4 xl:sticky xl:top-24">
                <div className="glass-panel rounded-3xl border border-rose-500/20 p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-rose-400" />
                        <h2 className="text-lg font-bold text-white">Live Incident Triage</h2>
                      </div>
                      <p className="text-xs text-slate-400">
                        High-priority security breaches requiring operator response.
                      </p>
                    </div>

                    <Link
                      href="/dashboard/alerts"
                      className="text-xs font-bold text-teal-400 hover:text-teal-300"
                    >
                      View All
                    </Link>
                  </div>

                  <div className="space-y-3 max-h-[calc(100vh-13rem)] overflow-y-auto pr-1">
                    {triageAlerts.length > 0 ? (
                      triageAlerts.map((alert) => (
                          <AlertCard
                            key={alert.id}
                            alert={alert}
                            onAcknowledge={canRespond ? handleAcknowledge : undefined}
                            onResolve={canRespond ? handleResolve : undefined}
                          />
                      ))
                    ) : (
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-white">All Clear</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          No unresolved high-severity perimeter threats at this time.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}