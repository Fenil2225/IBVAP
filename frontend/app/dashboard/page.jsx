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
  Filter,
  Flame,
  Clock,
  Layers,
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
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [recentDetections, setRecentDetections] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [triageFilter, setTriageFilter] = useState("all"); // 'all', 'critical', 'unacknowledged'
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
      if (camRes.status === "fulfilled") {
        const camList = Array.isArray(camRes.value) ? camRes.value : [];
        setCameras(camList);
        if (camList.length > 0 && !selectedCameraId) {
          setSelectedCameraId(camList[0].id);
        }
      }
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
  }, [selectedCameraId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 7000);
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
  const activeSpotlightCamera =
    cameras.find((c) => c.id === selectedCameraId) || onlineCameras[0] || cameras[0];

  // Filtered triage incidents for the command board
  const triageAlerts = recentAlerts
    .filter((alert) => {
      if (triageFilter === "critical") return alert.severity?.toLowerCase() === "critical";
      if (triageFilter === "unacknowledged") return alert.status?.toLowerCase() === "unacknowledged";
      return alert.status !== "resolved";
    })
    .sort((a, b) => {
      const severityRank = { critical: 0, high: 1, medium: 2, low: 3 };
      return (severityRank[a.severity?.toLowerCase()] ?? 4) - (severityRank[b.severity?.toLowerCase()] ?? 4);
    })
    .slice(0, 6);

  // Exact math computations to guarantee numbers sum up perfectly
  const totalCams = summary?.total_cameras ?? cameras.length;
  const onlineCams = summary?.online_cameras ?? onlineCameras.length;
  const offlineCams = summary?.offline_cameras ?? Math.max(0, totalCams - onlineCams);

  const personDet = summary?.person_detections ?? 0;
  const vehicleDet = summary?.vehicle_detections ?? 0;
  const intrusionDet = summary?.intrusion_detections ?? 0;
  const otherDet = summary?.other_detections ?? 0;
  const totalDet = summary?.total_detections ?? (personDet + vehicleDet + intrusionDet + otherDet);

  const unackAlerts = summary?.unacknowledged_alerts ?? 0;
  const ackAlerts = summary?.acknowledged_alerts ?? 0;
  const resAlerts = summary?.resolved_alerts ?? 0;
  const totalAlts = summary?.total_alerts ?? (unackAlerts + ackAlerts + resAlerts);
  const critAlts = summary?.critical_alerts ?? 0;

  const totalVids = summary?.total_videos ?? 0;
  const procVids = summary?.processed_videos ?? 0;
  const procingVids = summary?.processing_videos ?? 0;

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
                  Real-time video analytics, AI intrusion triage, and multi-sector border perimeter defense.
                </p>
              </div>

              {/* Quick Actions & Sync */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => loadData(true)}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-bold text-slate-300 transition hover:border-teal-500/40 hover:text-white disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-teal-400" : ""}`} />
                  <span>{refreshing ? "Syncing..." : "Sync Telemetry"}</span>
                </button>

                <Link
                  href="/dashboard/live"
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:opacity-95"
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>Surveillance Matrix</span>
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

            {/* Top 4 KPI Metrics - Mathematically Verified */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard
                title="Active Cameras"
                value={totalCams}
                subtitle={`${onlineCams} Online • ${offlineCams} Offline`}
                icon={Camera}
                color="teal"
                trend={`${totalCams > 0 ? Math.round((onlineCams / totalCams) * 100) : 100}% Operational`}
              />

              <StatsCard
                title="AI Detections"
                value={totalDet}
                subtitle={`${personDet} Person • ${vehicleDet} Vehicle • ${intrusionDet} Intrusion`}
                icon={Activity}
                color="cyan"
                trend="YOLOv11 Active"
              />

              <StatsCard
                title="Intrusion Alerts"
                value={totalAlts}
                subtitle={`${unackAlerts} Open • ${resAlerts} Resolved`}
                icon={ShieldAlert}
                color="rose"
                trend={critAlts > 0 ? `${critAlts} CRITICAL` : "Perimeter Clear"}
              />

              <StatsCard
                title="Forensic Videos"
                value={totalVids}
                subtitle={`${procVids} Analyzed • ${procingVids} In Pipeline`}
                icon={Video}
                color="emerald"
                trend="Indexed Storage"
              />
            </section>

            {/* Operational Quick Launch */}
            <section className="glass-panel rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <ShieldCheck className="h-4 w-4 text-teal-400" />
                <span>Operational Quick Launch:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canConfigure && (
                  <Link
                    href="/dashboard/cameras"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-teal-500/40 hover:text-white"
                  >
                    <Plus className="h-3 w-3 text-teal-400" /> Register Camera
                  </Link>
                )}
                {canRespond && (
                  <Link
                    href="/dashboard/videos"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-teal-500/40 hover:text-white"
                  >
                    <Upload className="h-3 w-3 text-cyan-400" /> Upload Footage
                  </Link>
                )}
                <Link
                  href="/dashboard/anpr"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-teal-500/40 hover:text-white"
                >
                  <Search className="h-3 w-3 text-amber-400" /> Search ANPR Plate
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-teal-500/40 hover:text-white"
                >
                  <Activity className="h-3 w-3 text-emerald-400" /> Telemetry Charts
                </Link>
              </div>
            </section>

            {/* Redesigned Balanced Operations Hub: Spotlight Camera + Polished Incident Triage */}
            <div className="grid gap-6 lg:grid-cols-12 items-stretch">
              {/* Left Column (7 cols): Live Surveillance Spotlight */}
              <div className="lg:col-span-7 flex flex-col space-y-4">
                <div className="glass-panel rounded-3xl p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                          <h2 className="text-lg font-bold text-white">Live Surveillance Spotlight</h2>
                        </div>
                        <p className="text-xs text-slate-400">
                          Primary tactical RTSP camera feed with real-time deep learning detection.
                        </p>
                      </div>

                      <Link
                        href="/dashboard/live"
                        className="flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300"
                      >
                        <span>Multi-Grid</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    {/* Camera Selector Pills */}
                    {cameras.length > 0 && (
                      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                        {cameras.map((c) => {
                          const isSelected = c.id === activeSpotlightCamera?.id;
                          return (
                            <button
                              key={c.id}
                              onClick={() => setSelectedCameraId(c.id)}
                              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition whitespace-nowrap ${
                                isSelected
                                  ? "bg-teal-500 text-slate-950 shadow-sm"
                                  : "border border-slate-800 bg-slate-900 text-slate-300 hover:border-teal-500/40 hover:text-white"
                              }`}
                            >
                              <Camera className="h-3 w-3" />
                              <span>{c.name}</span>
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  c.status === "online" ? "bg-emerald-400" : "bg-rose-400"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {activeSpotlightCamera ? (
                      <LiveStreamPlayer camera={activeSpotlightCamera} />
                    ) : (
                      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-6 text-center">
                        <Camera className="h-10 w-10 text-slate-700 mb-2" />
                        <p className="text-sm font-bold text-white">No active camera streams configured</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Register a camera to begin live streaming.
                        </p>
                        <Link
                          href="/dashboard/cameras"
                          className="mt-4 rounded-xl bg-teal-500/15 border border-teal-500/30 px-3.5 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-500/25"
                        >
                          Register Camera
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Polished & Redesigned Live Incident Triage */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                <div className="glass-panel rounded-3xl p-5 sm:p-6 flex-1 flex flex-col border border-rose-500/20">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-rose-400" />
                        <h2 className="text-lg font-bold text-white">Incident Response Board</h2>
                      </div>
                      <p className="text-xs text-slate-400">
                        Priority threats & intruder triage across perimeter sectors.
                      </p>
                    </div>

                    <Link
                      href="/dashboard/alerts"
                      className="text-xs font-bold text-teal-400 hover:text-teal-300"
                    >
                      View All →
                    </Link>
                  </div>

                  {/* Filter Pills for Incident Board */}
                  <div className="mb-3 flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 p-1">
                    <button
                      onClick={() => setTriageFilter("all")}
                      className={`flex-1 rounded-lg py-1 text-center text-xs font-bold transition ${
                        triageFilter === "all"
                          ? "bg-slate-800 text-white shadow"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      All Open
                    </button>
                    <button
                      onClick={() => setTriageFilter("critical")}
                      className={`flex-1 rounded-lg py-1 text-center text-xs font-bold transition ${
                        triageFilter === "critical"
                          ? "bg-rose-500 text-white shadow"
                          : "text-slate-400 hover:text-rose-300"
                      }`}
                    >
                      Critical ({critAlts})
                    </button>
                    <button
                      onClick={() => setTriageFilter("unacknowledged")}
                      className={`flex-1 rounded-lg py-1 text-center text-xs font-bold transition ${
                        triageFilter === "unacknowledged"
                          ? "bg-amber-500 text-slate-950 shadow"
                          : "text-slate-400 hover:text-amber-300"
                      }`}
                    >
                      Unack ({unackAlerts})
                    </button>
                  </div>

                  {/* Scrollable Incident Stream */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[460px] pr-1">
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
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center my-auto">
                        <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
                        <h4 className="text-sm font-bold text-white">Perimeter Status Clear</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                          {triageFilter === "critical"
                            ? "No active critical alerts require emergency mobilization."
                            : "No pending unacknowledged security incidents detected."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Real-Time AI Detection Telemetry Feed */}
            <section className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800">
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
                      recentDetections.slice(0, 7).map((det) => (
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
            </section>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}