"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Car,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Download,
  CheckCircle2,
  Clock,
  Camera,
  Layers,
  ShieldCheck,
} from "lucide-react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import PlateCard from "../../../components/PlateCard";
import StatsCard from "../../../components/StatsCard";
import { getANPRDetections, searchANPRPlate } from "../../../services/anprservice";

function ANPRPageContent() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [highConfidenceOnly, setHighConfidenceOnly] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const videoId = searchParams.get("video_id");

  const loadDetections = async (query = "", silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      let data;
      if (query && query.trim()) {
        data = await searchANPRPlate(query);
      } else {
        data = await getANPRDetections(videoId);
      }
      setDetections(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load ANPR detections");
      setDetections([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDetections();
  }, [videoId]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadDetections(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    loadDetections("");
  };

  // Filter local results by vehicle type & confidence
  const filteredDetections = detections.filter((det) => {
    const matchesVehicle =
      vehicleFilter === "all"
        ? true
        : det.vehicle_type?.toLowerCase() === vehicleFilter.toLowerCase();

    const matchesConfidence = highConfidenceOnly
      ? (det.confidence || 0.8) >= 0.85
      : true;

    return matchesVehicle && matchesConfidence;
  });

  const exportCSV = () => {
    if (detections.length === 0) return;
    const headers = ["ID", "Plate Number", "Vehicle Type", "Confidence", "Camera ID", "Detected At"];
    const rows = detections.map((d) => [
      d.id,
      `"${d.plate_number}"`,
      `"${d.vehicle_type || "Unknown"}"`,
      `${Math.round((d.confidence || 0.85) * 100)}%`,
      d.camera_id || "N/A",
      `"${d.detected_at || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `anpr_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute stats
  const uniquePlates = new Set(detections.map((d) => d.plate_number)).size;
  const avgConf =
    detections.length > 0
      ? Math.round(
          (detections.reduce((acc, d) => acc + (d.confidence || 0.85), 0) /
            detections.length) *
            100
        )
      : 88;

  return (
    <ProtectedRoute>
      <div className="ibvap-shell min-h-screen text-slate-100">
        <Sidebar isMobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

        <div className="md:ml-72 flex flex-col min-h-screen">
          <Navbar onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />

          <main className="grid-surface flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-teal-400" />
                  <p className="text-xs font-bold tracking-[0.28em] text-teal-400 uppercase">
                    Vehicle Intelligence
                  </p>
                </div>
                <h1 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  Automated Number Plate Recognition (ANPR)
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  Real-time OCR license plate capture, vehicle classification, and forensic search.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => loadDetections(searchQuery, true)}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:border-teal-500/40 hover:text-white"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-teal-400" : ""}`} />
                  <span>Sync ANPR</span>
                </button>

                <button
                  onClick={exportCSV}
                  disabled={detections.length === 0}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs font-bold text-teal-300 hover:border-teal-500/40 hover:text-white disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* ANPR Key Stats */}
            <section className="grid gap-4 sm:grid-cols-3">
              <StatsCard
                title="Total Plate Detections"
                value={detections.length}
                subtitle="Captured from live & forensic feeds"
                icon={Car}
                color="teal"
                trend="Logged in DB"
              />

              <StatsCard
                title="Unique Target Vehicles"
                value={uniquePlates}
                subtitle="Deduplicated plate records"
                icon={Sparkles}
                color="cyan"
                trend="Indexed"
              />

              <StatsCard
                title="Avg OCR Confidence"
                value={`${avgConf}%`}
                subtitle="Tesseract & YOLO accuracy"
                icon={ShieldCheck}
                color="emerald"
                trend="High Precision"
              />
            </section>

            {/* Search & Filter Toolbar */}
            <section className="glass-panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between border border-slate-800">
              {/* Search Form */}
              <form onSubmit={handleSearch} className="flex-1 flex gap-2 max-w-lg">
                <div className="relative flex-1">
                  <Search className="absolute top-3 left-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search plate number (e.g. DL, MH, UP02, 4567)..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pr-4 pl-10 text-xs text-white placeholder:text-slate-500 focus:border-teal-400 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400"
                >
                  Search
                </button>

                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </form>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-slate-500" />
                  <select
                    value={vehicleFilter}
                    onChange={(e) => setVehicleFilter(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-teal-400"
                  >
                    <option value="all">All Vehicles</option>
                    <option value="car">Cars Only</option>
                    <option value="truck">Trucks / Heavy</option>
                    <option value="bus">Buses</option>
                    <option value="motorcycle">Motorcycles / Bikes</option>
                  </select>
                </div>

                <button
                  onClick={() => setHighConfidenceOnly(!highConfidenceOnly)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    highConfidenceOnly
                      ? "border-teal-500/50 bg-teal-500/20 text-teal-300"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>≥ 85% Confidence</span>
                </button>
              </div>
            </section>

            {/* Results Grid */}
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="glass-panel h-64 rounded-2xl animate-pulse bg-slate-900/40 p-4"
                  />
                ))}
              </div>
            ) : filteredDetections.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredDetections.map((detection) => (
                  <PlateCard key={detection.id} detection={detection} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-950 p-12 text-center">
                <Car className="h-12 w-12 text-slate-700 mb-3" />
                <h3 className="text-base font-bold text-white">No ANPR detections found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  {searchQuery
                    ? `No plates matching '${searchQuery}' were located in the database.`
                    : "No license plate detections have been processed yet. Upload a video or activate camera ANPR."}
                </p>
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="mt-4 rounded-xl bg-teal-500/15 border border-teal-500/30 px-4 py-2 text-xs font-bold text-teal-300 hover:bg-teal-500/25"
                  >
                    View All Detections
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function ANPRPage() {
  return (
    <Suspense fallback={<div className="ibvap-shell min-h-screen p-8 text-slate-400">Loading ANPR results...</div>}>
      <ANPRPageContent />
    </Suspense>
  );
}
