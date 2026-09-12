"use client";

import { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Camera,
  CheckCheck,
  Eye,
} from "lucide-react";

export default function AlertCard({ alert, onAcknowledge, onResolve }) {
  const [loadingAction, setLoadingAction] = useState(null);

  const severityConfigs = {
    critical: {
      color: "border-rose-500/40 bg-rose-500/10 text-rose-300",
      badge: "bg-rose-500 text-white",
      icon: ShieldAlert,
      pulse: "pulse-danger",
    },
    high: {
      color: "border-orange-500/40 bg-orange-500/10 text-orange-300",
      badge: "bg-orange-500 text-white",
      icon: AlertTriangle,
      pulse: "",
    },
    medium: {
      color: "border-amber-500/40 bg-amber-500/10 text-amber-300",
      badge: "bg-amber-500 text-slate-950",
      icon: AlertTriangle,
      pulse: "",
    },
    low: {
      color: "border-sky-500/40 bg-sky-500/10 text-sky-300",
      badge: "bg-sky-500 text-white",
      icon: Info,
      pulse: "",
    },
  };

  const config = severityConfigs[alert.severity?.toLowerCase()] || severityConfigs.medium;
  const IconComponent = config.icon;

  const handleAcknowledge = async () => {
    if (!onAcknowledge) return;
    setLoadingAction("ack");
    try {
      await onAcknowledge(alert.id);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResolve = async () => {
    if (!onResolve) return;
    setLoadingAction("resolve");
    try {
      await onResolve(alert.id);
    } finally {
      setLoadingAction(null);
    }
  };

  const isUnack = alert.status === "unacknowledged";
  const isAck = alert.status === "acknowledged";
  const isResolved = alert.status === "resolved";

  return (
    <div
      className={`glass-panel relative overflow-hidden rounded-2xl p-5 transition-all ${
        isUnack && alert.severity === "critical" ? "border-rose-500/50 pulse-danger" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${config.color}`}
          >
            <IconComponent className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white tracking-tight">
                {alert.alert_type || "Security Alert"}
              </h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${config.badge}`}>
                {alert.severity}
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
              <Camera className="h-3 w-3 text-teal-400" />
              <span>{alert.camera_name || `Camera #${alert.camera_id}`}</span>
              {alert.camera_code && (
                <span className="font-mono text-slate-500">({alert.camera_code})</span>
              )}
            </p>
          </div>
        </div>

        {/* Status Tag */}
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
            isResolved
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              : isAck
              ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
          }`}
        >
          {alert.status}
        </span>
      </div>

      {/* Description */}
      {alert.description && (
        <p className="mt-3 rounded-xl bg-slate-900/60 p-3 text-xs leading-relaxed text-slate-300 border border-slate-800/60">
          {alert.description}
        </p>
      )}

      {/* Meta Timestamps */}
      <div className="mt-4 grid gap-1 border-t border-slate-800/50 pt-3 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-slate-500" />
          {alert.created_at ? new Date(alert.created_at).toLocaleString() : "Real-time"}
        </span>

        {alert.resolved_at && (
          <span className="text-emerald-400">
            Resolved: {new Date(alert.resolved_at).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Triage Actions */}
      {!isResolved && (
        <div className="mt-4 flex items-center gap-2">
          {isUnack && onAcknowledge && (
            <button
              onClick={handleAcknowledge}
              disabled={loadingAction !== null}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2 px-3 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20"
            >
              <Eye className="h-3.5 w-3.5" />
              {loadingAction === "ack" ? "Acknowledging..." : "Acknowledge"}
            </button>
          )}

          {onResolve && (
            <button
              onClick={handleResolve}
              disabled={loadingAction !== null}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 px-3 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {loadingAction === "resolve" ? "Resolving..." : "Resolve Incident"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}