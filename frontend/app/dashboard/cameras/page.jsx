"use client";

import { useEffect, useState } from "react";
import {
  Camera,
  Plus,
  Search,
  Filter,
  RefreshCw,
  X,
  Radio,
  CheckCircle2,
  AlertCircle,
  Cpu,
} from "lucide-react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import CameraCard from "../../../components/CameraCard";
import { getCameras, createCamera, updateCameraStatus } from "../../../services/cameraservice";

export default function CamerasPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [form, setForm] = useState({
    camera_id: "",
    name: "",
    location: "",
    rtsp_url: "",
    ai_enabled: true,
    fps: 30,
  });

  const loadCameras = async () => {
    setLoading(true);
    try {
      const data = await getCameras();
      setCameras(Array.isArray(data) ? data : []);
    } catch {
      setCameras([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCameras();
  }, []);

  const handleStatusChange = async (cameraId, newStatus) => {
    try {
      await updateCameraStatus(cameraId, newStatus);
      setCameras((prev) =>
        prev.map((cam) => (cam.id === cameraId ? { ...cam, status: newStatus } : cam))
      );
    } catch (err) {
      alert(err.message || "Failed to update camera status");
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateCamera = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);

    try {
      const payload = {
        camera_id: form.camera_id.trim().toUpperCase(),
        name: form.name.trim(),
        location: form.location.trim(),
        rtsp_url: form.rtsp_url.trim() || null,
        ai_enabled: Boolean(form.ai_enabled),
        fps: parseInt(form.fps, 10) || 30,
      };

      await createCamera(payload);
      setFormSuccess("Camera registered successfully!");
      setForm({
        camera_id: "",
        name: "",
        location: "",
        rtsp_url: "",
        ai_enabled: true,
        fps: 30,
      });
      loadCameras();
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess("");
      }, 1200);
    } catch (err) {
      setFormError(err.message || "Failed to register camera");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCameras = cameras.filter((cam) => {
    const matchesSearch =
      cam.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.camera_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ? true : cam.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
                  <Camera className="h-4 w-4 text-teal-400" />
                  <p className="text-xs font-bold tracking-[0.28em] text-teal-400 uppercase">
                    Hardware Infrastructure
                  </p>
                </div>
                <h1 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  Border Camera Registry
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  Manage fixed CCTV, PTZ perimeter sensors, and RTSP stream endpoints.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={loadCameras}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:border-teal-500/40 hover:text-white"
                  title="Reload"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:opacity-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Register New Camera</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="glass-panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between border border-slate-800">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute top-3 left-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by camera name, code, or location..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pr-4 pl-10 text-xs text-white placeholder:text-slate-500 focus:border-teal-400"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-bold text-slate-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-teal-400"
                >
                  <option value="all">All Cameras ({cameras.length})</option>
                  <option value="online">
                    Online Only ({cameras.filter((c) => c.status === "online").length})
                  </option>
                  <option value="offline">
                    Offline Only ({cameras.filter((c) => c.status === "offline").length})
                  </option>
                </select>
              </div>
            </div>

            {/* Camera Cards Grid */}
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="glass-panel h-56 rounded-2xl animate-pulse bg-slate-900/40 p-5"
                  />
                ))}
              </div>
            ) : filteredCameras.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCameras.map((camera) => (
                  <CameraCard
                    key={camera.id}
                    camera={camera}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-950 p-12 text-center">
                <Camera className="h-12 w-12 text-slate-700 mb-3" />
                <h3 className="text-base font-bold text-white">No cameras match your criteria</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Try adjusting your search query or status filter, or add a new camera.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 rounded-xl bg-teal-500/15 border border-teal-500/30 px-4 py-2 text-xs font-bold text-teal-300 hover:bg-teal-500/25"
                >
                  Add New Camera
                </button>
              </div>
            )}
          </main>
        </div>

        {/* Add Camera Modal */}
        {showAddModal && (
          <div
            onClick={() => setShowAddModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="glass-panel relative w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white">Register Perimeter Camera</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect an IP/RTSP camera to the IBVAP surveillance network.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {formSuccess && (
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {formError && (
                <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateCamera} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">
                      Camera Code <span className="text-teal-400">*</span>
                    </label>
                    <input
                      name="camera_id"
                      value={form.camera_id}
                      onChange={handleFormChange}
                      required
                      placeholder="e.g. CAM_NORTH_01"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3 text-xs text-white placeholder:text-slate-600 focus:border-teal-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">
                      Target FPS
                    </label>
                    <input
                      name="fps"
                      type="number"
                      min="1"
                      max="60"
                      value={form.fps}
                      onChange={handleFormChange}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3 text-xs text-white focus:border-teal-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-300">
                    Camera Display Name <span className="text-teal-400">*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. North Gate Entry Post 4"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3 text-xs text-white placeholder:text-slate-600 focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-300">
                    Location / Sector Description
                  </label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                    placeholder="e.g. Indo-Pak Border Sector A, Fence 42"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3 text-xs text-white placeholder:text-slate-600 focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-300">
                    RTSP / Video Stream URL
                  </label>
                  <input
                    name="rtsp_url"
                    value={form.rtsp_url}
                    onChange={handleFormChange}
                    placeholder="rtsp://admin:pass@192.168.1.100:554/stream or 0 for local"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3 text-xs text-white placeholder:text-slate-600 focus:border-teal-400 font-mono"
                  />
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <input
                    type="checkbox"
                    id="ai_enabled"
                    name="ai_enabled"
                    checked={form.ai_enabled}
                    onChange={handleFormChange}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-teal-400"
                  />
                  <label htmlFor="ai_enabled" className="text-xs font-bold text-slate-200">
                    Enable Real-Time YOLO Intrusion & ANPR Analysis
                  </label>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 rounded-xl border border-slate-800 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-900 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 py-2.5 text-xs font-extrabold text-slate-950 transition hover:opacity-95 disabled:opacity-60"
                  >
                    {submitting ? "Registering..." : "Add to Network"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
