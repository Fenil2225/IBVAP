"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Radio,
  Grid,
  Maximize2,
  RefreshCw,
  Camera,
  Layers,
  Filter,
  Plus,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import ProtectedRoute from "../../../components/ProtectedRoute";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import LiveStreamPlayer from "../../../components/LiveStreamPlayer";
import { getCameras } from "../../../services/cameraservice";

function LiveMatrixInner() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [layout, setLayout] = useState("2x2"); // '1x1', '2x2', '3x3'
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const searchParams = useSearchParams();

  const loadCameras = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await getCameras();
      const list = Array.isArray(data) ? data : [];
      setCameras(list);

      // If camera param in URL, set focus
      const urlCamId = searchParams.get("camera");
      if (urlCamId) {
        setSelectedCameraId(parseInt(urlCamId, 10));
      } else if (list.length > 0 && !selectedCameraId) {
        setSelectedCameraId(list[0].id);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCameras();
  }, [searchParams]);

  const displayedCameras = cameras.filter((c) =>
    filterOnlineOnly ? c.status === "online" : true
  );

  const activeFocusCam =
    cameras.find((c) => c.id === selectedCameraId) || displayedCameras[0] || cameras[0];

  const getGridClass = () => {
    if (layout === "1x1") return "grid-cols-1";
    if (layout === "2x2") return "grid-cols-1 md:grid-cols-2";
    if (layout === "3x3") return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    return "grid-cols-1 md:grid-cols-2";
  };

  return (
    <div className="ibvap-shell min-h-screen text-slate-100">
      <Sidebar isMobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="md:ml-72 flex flex-col min-h-screen">
        <Navbar onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />

        <main className="grid-surface flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                <p className="text-xs font-bold tracking-[0.28em] text-teal-400 uppercase">
                  Tactical Feeds
                </p>
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                Multi-Camera Surveillance Matrix
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Synchronized live RTSP video feeds across border sectors.
              </p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Layout Switcher */}
              <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/90 p-1">
                <button
                  onClick={() => setLayout("1x1")}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    layout === "1x1"
                      ? "bg-teal-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  1x1 Single
                </button>
                <button
                  onClick={() => setLayout("2x2")}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    layout === "2x2"
                      ? "bg-teal-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  2x2 Quad
                </button>
                <button
                  onClick={() => setLayout("3x3")}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    layout === "3x3"
                      ? "bg-teal-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  3x3 Matrix
                </button>
              </div>

              {/* Filter Online Toggle */}
              <button
                onClick={() => setFilterOnlineOnly(!filterOnlineOnly)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  filterOnlineOnly
                    ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                <span>Online Only ({cameras.filter((c) => c.status === "online").length})</span>
              </button>

              {/* Reload Button */}
              <button
                onClick={() => loadCameras(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:border-teal-500/40 hover:text-white"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-teal-400" : ""}`} />
                <span>Sync Feeds</span>
              </button>

              <Link
                href="/dashboard/cameras"
                className="flex items-center gap-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 px-3.5 py-2 text-xs font-bold text-teal-300 hover:bg-teal-500/25"
              >
                <Plus className="h-3.5 w-3.5" /> Add Camera
              </Link>
            </div>
          </div>

          {/* Video Streams Container */}
          {layout === "1x1" && activeFocusCam ? (
            <div className="space-y-4">
              <LiveStreamPlayer camera={activeFocusCam} />

              {/* Camera Selector Strip */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {cameras.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCameraId(c.id)}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                      c.id === activeFocusCam.id
                        ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20"
                        : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-teal-500/40"
                    }`}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>{c.name}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${c.status === "online" ? "bg-emerald-400" : "bg-rose-400"}`} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={`grid gap-4 ${getGridClass()}`}>
              {displayedCameras.length > 0 ? (
                displayedCameras.map((camera) => (
                  <div key={camera.id} className="space-y-2">
                    <LiveStreamPlayer camera={camera} isSmall={layout === "3x3"} />
                  </div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-950 p-12 text-center">
                  <Camera className="h-12 w-12 text-slate-700 mb-3" />
                  <h3 className="text-base font-bold text-white">No active camera streams available</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    {filterOnlineOnly
                      ? "There are currently no cameras in 'online' state."
                      : "No cameras have been registered yet. Add a new camera to start streaming."}
                  </p>
                  <Link
                    href="/dashboard/cameras"
                    className="mt-4 rounded-xl bg-teal-500/15 border border-teal-500/30 px-4 py-2 text-xs font-bold text-teal-300 hover:bg-teal-500/25"
                  >
                    Go to Camera Network
                  </Link>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function LiveMatrixPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="ibvap-shell min-h-screen p-8 text-slate-400">Loading Live Matrix...</div>}>
        <LiveMatrixInner />
      </Suspense>
    </ProtectedRoute>
  );
}
