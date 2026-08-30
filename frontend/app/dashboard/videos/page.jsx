"use client";

import { useEffect, useState } from "react";
import {
  Video,
  UploadCloud,
  Play,
  Cpu,
  RefreshCw,
  Clock,
  Camera,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
} from "lucide-react";
import Link from "next/link";
import ProtectedRoute from "../../../components/ProtectedRoute";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import StatsCard from "../../../components/StatsCard";
import { getVideos, uploadVideo, processVideo } from "../../../services/videoservice";
import { getCameras } from "../../../services/cameraservice";

export default function VideosPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [videos, setVideos] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [vData, cData] = await Promise.all([getVideos(), getCameras()]);
      setVideos(Array.isArray(vData) ? vData : []);
      const camList = Array.isArray(cData) ? cData : [];
      setCameras(camList);
      if (camList.length > 0 && !selectedCameraId) {
        setSelectedCameraId(camList[0].id);
      }
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll every 6 seconds for background video processing updates
    const interval = setInterval(() => loadData(true), 6000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError("");
      setUploadSuccess("");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select a video file to upload.");
      return;
    }
    if (!selectedCameraId) {
      setUploadError("Please select a camera to associate with this footage.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      await uploadVideo(selectedCameraId, selectedFile);
      setUploadSuccess(`Video '${selectedFile.name}' uploaded successfully!`);
      setSelectedFile(null);
      // Reset input
      const fileInput = document.getElementById("video-file-input");
      if (fileInput) fileInput.value = "";
      loadData(true);
    } catch (err) {
      setUploadError(err.message || "Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  const handleRunProcess = async (videoId) => {
    setProcessingId(videoId);
    try {
      await processVideo(videoId);
      setVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, status: "processing" } : v))
      );
      loadData(true);
    } catch (err) {
      alert(err.message || "Failed to trigger video processing");
    } finally {
      setProcessingId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

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
                  <Video className="h-4 w-4 text-teal-400" />
                  <p className="text-xs font-bold tracking-[0.28em] text-teal-400 uppercase">
                    Forensics & Storage
                  </p>
                </div>
                <h1 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  Surveillance Video Forensics Pipeline
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  Upload recorded border footage for offline YOLO intrusion tracking and ANPR license plate extraction.
                </p>
              </div>

              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:border-teal-500/40 hover:text-white"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-teal-400" : ""}`} />
                <span>Sync Videos</span>
              </button>
            </div>

            {/* Video Upload Dropzone & Form */}
            <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Upload Surveillance Footage</h2>
                  <p className="text-xs text-slate-400">
                    Supported formats: MP4, AVI, MOV, MKV. Uploads are processed frame-by-frame.
                  </p>
                </div>
              </div>

              {uploadSuccess && (
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {uploadError && (
                <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{uploadError}</span>
                </div>
              )}

              <form onSubmit={handleUpload} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Associate Camera Sector <span className="text-teal-400">*</span>
                    </label>
                    <select
                      value={selectedCameraId}
                      onChange={(e) => setSelectedCameraId(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3 text-xs text-white focus:border-teal-400"
                    >
                      {cameras.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.camera_id}) - {c.location || "Sector"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Select Video File <span className="text-teal-400">*</span>
                    </label>
                    <input
                      id="video-file-input"
                      type="file"
                      accept=".mp4,.avi,.mov,.mkv"
                      onChange={handleFileChange}
                      required
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 px-3 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-500/20 file:px-3 file:py-1 file:text-xs file:font-bold file:text-teal-300 hover:file:bg-teal-500/30"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 px-6 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:opacity-95 disabled:opacity-50"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>{uploading ? "Uploading Surveillance Video..." : "Upload Footage"}</span>
                  </button>
                </div>
              </form>
            </section>

            {/* Video Forensics Archive Table */}
            <section className="glass-panel rounded-3xl p-6 border border-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Footage Archive & AI Queue</h2>
                  <p className="text-xs text-slate-400">
                    Run background analysis or review detection logs.
                  </p>
                </div>

                <span className="text-xs font-bold text-teal-400">
                  {videos.length} Videos Stored
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="pb-3 pl-2">Footage File</th>
                      <th className="pb-3">Camera Source</th>
                      <th className="pb-3">Size</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Uploaded At</th>
                      <th className="pb-3 pr-2 text-right">AI Processing Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">
                          Loading surveillance video archive...
                        </td>
                      </tr>
                    ) : videos.length > 0 ? (
                      videos.map((vid) => {
                        const isProcessing =
                          vid.status === "processing" || processingId === vid.id;
                        const isProcessed = vid.status === "processed";

                        return (
                          <tr key={vid.id} className="hover:bg-slate-900/40 transition">
                            <td className="py-3 pl-2 font-mono font-semibold text-white">
                              <div className="flex items-center gap-2">
                                <FileVideo className="h-4 w-4 text-teal-400 shrink-0" />
                                <span className="truncate max-w-[200px]">{vid.file_name}</span>
                              </div>
                            </td>

                            <td className="py-3 text-slate-300">
                              <span className="flex items-center gap-1">
                                <Camera className="h-3 w-3 text-slate-500" />
                                <span>Camera #{vid.camera_id}</span>
                              </span>
                            </td>

                            <td className="py-3 font-mono text-slate-400">
                              {formatFileSize(vid.file_size)}
                            </td>

                            <td className="py-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  isProcessed
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : isProcessing
                                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse"
                                    : vid.status === "failed"
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    : "bg-slate-800 text-slate-300 border border-slate-700"
                                }`}
                              >
                                {isProcessing && <Cpu className="h-2.5 w-2.5 animate-spin" />}
                                {isProcessed && <CheckCircle2 className="h-2.5 w-2.5" />}
                                <span>{vid.status || "uploaded"}</span>
                              </span>
                            </td>

                            <td className="py-3 text-slate-400 text-[11px]">
                              {vid.uploaded_at
                                ? new Date(vid.uploaded_at).toLocaleString()
                                : "--"}
                            </td>

                            <td className="py-3 pr-2 text-right">
                              {isProcessed ? (
                                <Link
                                  href="/dashboard/anpr"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300"
                                >
                                  <span>View ANPR Results →</span>
                                </Link>
                              ) : (
                                <button
                                  onClick={() => handleRunProcess(vid.id)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/15 px-3 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-500/25 disabled:opacity-50"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  <span>
                                    {isProcessing ? "Analyzing..." : "Run AI Analysis"}
                                  </span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No surveillance videos uploaded yet. Use the upload box above.
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
