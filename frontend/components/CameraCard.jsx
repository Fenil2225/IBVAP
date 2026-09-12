"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, MapPin, ShieldCheck, Power, Radio, Pencil } from "lucide-react";

export default function CameraCard({ camera, onStatusChange, onEdit }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isOnline = camera.status === "online";

  const handleToggleStatus = async () => {
    if (!onStatusChange || isUpdating) return;
    setIsUpdating(true);
    try {
      const nextStatus = isOnline ? "offline" : "online";
      await onStatusChange(camera.id, nextStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="glass-panel-interactive relative overflow-hidden rounded-2xl p-5">
      {/* Top Bar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              isOnline
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                : "bg-slate-800/80 text-slate-500 border border-slate-700/50"
            }`}
          >
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{camera.name}</h3>
            <p className="font-mono text-xs text-teal-400/80">{camera.camera_id}</p>
          </div>
        </div>

        {/* Status Indicator Badge */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
            isOnline
              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isOnline ? "bg-emerald-400 animate-ping" : "bg-rose-400"
            }`}
          />
          <span className="capitalize">{camera.status}</span>
        </span>
      </div>

      {/* Details Grid */}
      <div className="mt-5 space-y-2.5 text-xs">
        <div className="flex items-center justify-between rounded-xl bg-slate-900/60 px-3 py-2 border border-slate-800/60">
          <span className="flex items-center gap-1.5 text-slate-400">
            <MapPin className="h-3.5 w-3.5 text-slate-500" /> Location
          </span>
          <span className="font-semibold text-slate-200 truncate max-w-[160px]">
            {camera.location || "Perimeter Sector"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between rounded-xl bg-slate-900/60 px-3 py-2 border border-slate-800/60">
            <span className="text-slate-400">FPS Rate</span>
            <span className="font-mono font-bold text-teal-300">{camera.fps || 30} FPS</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-900/60 px-3 py-2 border border-slate-800/60">
            <span className="text-slate-400">AI YOLO</span>
            <span
              className={`font-semibold flex items-center gap-1 ${
                camera.ai_enabled ? "text-emerald-300" : "text-slate-500"
              }`}
            >
              {camera.ai_enabled ? (
                <>
                  <ShieldCheck className="h-3 w-3 text-emerald-400" /> Active
                </>
              ) : (
                "Disabled"
              )}
            </span>
          </div>
        </div>

        {camera.rtsp_url && (
          <div className="rounded-xl bg-slate-950/70 p-2 border border-slate-800/80 font-mono text-[11px] text-slate-400 truncate">
            <span className="text-teal-400/70 mr-1">RTSP:</span>
            {camera.rtsp_url}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex items-center gap-2 pt-3 border-t border-slate-800/60">
        {onEdit && (
          <button
            onClick={() => onEdit(camera)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:border-teal-500/40 hover:text-teal-300"
            title="Edit RTSP URL"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {onStatusChange && (
          <button
            onClick={handleToggleStatus}
            disabled={isUpdating}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all ${
              isOnline
                ? "border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            {isUpdating ? "Updating..." : isOnline ? "Turn Offline" : "Turn Online"}
          </button>
        )}

        <Link
          href={`/dashboard/live?camera=${camera.id}`}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3.5 py-2 text-xs font-bold text-teal-300 transition hover:bg-teal-500/20"
          title="Open in Multi-Camera Matrix"
        >
          <Radio className="h-3.5 w-3.5" />
          <span>Live Feed</span>
        </Link>
      </div>
    </div>
  );
}