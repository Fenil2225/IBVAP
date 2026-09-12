"use client";

import { useState, useRef } from "react";
import {
  Radio,
  Camera,
  Maximize2,
  Minimize2,
  RefreshCw,
  AlertTriangle,
  Play,
  Pause,
  ShieldCheck,
  Download,
} from "lucide-react";
import { getLiveStreamUrl } from "../services/cameraservice";

export default function LiveStreamPlayer({
  camera,
  isSmall = false,
  showControls = true,
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0);
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  const hasConfiguredStream = Boolean(camera?.rtsp_url);

  const streamUrl = camera?.id && hasConfiguredStream
    ? getLiveStreamUrl(camera.id)
    : "";

  const handleReload = () => {
    setHasError(false);
    setKey((prev) => prev + 1);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const captureSnapshot = () => {
    if (!imgRef.current) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = imgRef.current.naturalWidth || 640;
      canvas.height = imgRef.current.naturalHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `snapshot_${camera?.camera_id || "cam"}_${Date.now()}.jpg`;
      a.click();
    } catch {
      // Cross-origin canvas fallback
      window.open(streamUrl, "_blank");
    }
  };

  return (
    <div
      ref={containerRef}
      className={`group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 font-sans ${
        isSmall ? "aspect-video" : "aspect-video w-full"
      } shadow-2xl`}
    >
      {/* Stream Video or Placeholder */}
      {hasConfiguredStream && isPlaying && !hasError && streamUrl ? (
        <img
          ref={imgRef}
          key={`${streamUrl}-${key}`}
          src={streamUrl}
          alt={`Live stream for ${camera?.name}`}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-500">
            {!hasConfiguredStream ? (
              <Radio className="h-6 w-6 text-slate-600" />
            ) : hasError ? (
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            ) : (
              <Pause className="h-6 w-6 text-slate-400" />
            )}
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-300">
            {!hasConfiguredStream
              ? "No RTSP stream configured"
              : hasError
              ? "Live Feed Disconnected / RTSP Inactive"
              : "Feed Paused"}
          </h4>
          <p className="mt-1 max-w-xs text-xs text-slate-500">
            {!hasConfiguredStream
              ? "Add an RTSP URL in Camera Network to start the live feed"
              : hasError
              ? "Waiting for camera RTSP video feed from backend..."
              : "Click resume to view live RTSP frames"}
          </p>
          {hasConfiguredStream && (
            <button
              onClick={handleReload}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300 transition hover:bg-teal-500/20"
            >
              <RefreshCw className="h-3 w-3" /> Reconnect Feed
            </button>
          )}
        </div>
      )}

      {/* Top Overlays: Camera Info & Live Tag */}
      <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="flex items-center gap-1.5 rounded-lg border border-slate-800/90 bg-slate-950/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
            <Camera className="h-3.5 w-3.5 text-teal-400" />
            <span>{camera?.name || "Camera Feed"}</span>
            <span className="font-mono text-[10px] text-teal-300">({camera?.camera_id || "--"})</span>
          </span>

          {camera?.location && (
            <span className="hidden rounded-lg bg-slate-900/80 px-2 py-1 text-[10px] text-slate-300 backdrop-blur-md sm:inline-block">
              {camera.location}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {camera?.ai_enabled && (
            <span className="flex items-center gap-1 rounded-lg border border-teal-500/30 bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300 backdrop-blur-md">
              <ShieldCheck className="h-3 w-3" /> AI ACTIVE
            </span>
          )}

          <span
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-[10px] font-extrabold backdrop-blur-md ${
              hasConfiguredStream && !hasError
                ? "bg-rose-500/90 text-white"
                : "bg-slate-800/90 text-slate-400"
            }`}
          >
            {hasConfiguredStream && !hasError && (
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping"></span>
            )}
            {hasConfiguredStream && !hasError ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      {showControls && (
        <div className="absolute right-0 bottom-0 left-0 flex items-center justify-between bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/80 text-slate-200 backdrop-blur-sm transition hover:bg-teal-500 hover:text-slate-950"
              title={isPlaying ? "Pause Stream" : "Play Stream"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>

            <button
              onClick={handleReload}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/80 text-slate-200 backdrop-blur-sm transition hover:bg-slate-800 hover:text-white"
              title="Refresh Stream"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            <span className="font-mono text-[11px] text-slate-400">
              {camera?.fps || 30} FPS
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={captureSnapshot}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/80 text-slate-200 backdrop-blur-sm transition hover:bg-slate-800 hover:text-white"
              title="Capture Snapshot"
            >
              <Download className="h-4 w-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/80 text-slate-200 backdrop-blur-sm transition hover:bg-slate-800 hover:text-white"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
