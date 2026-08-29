"use client";

export default function AlertCard({
  alert,
  onAcknowledge,
  onResolve,
}) {
  const severityClasses = {
    low: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    medium: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    high: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    critical: "border-red-500/30 bg-red-500/10 text-red-400",
  };

  const severityStyle =
    severityClasses[alert.severity] ||
    severityClasses.medium;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white">
            {alert.alert_type}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Camera ID: {alert.camera_id}
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${severityStyle}`}
        >
          {alert.severity}
        </span>
      </div>

      {alert.description && (
        <p className="mt-4 text-sm text-slate-300">
          {alert.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {alert.created_at
            ? new Date(alert.created_at).toLocaleString()
            : "Unknown time"}
        </span>

        <span className="text-xs capitalize text-slate-400">
          {alert.status}
        </span>
      </div>

      {alert.status !== "resolved" && (
        <div className="mt-5 flex gap-2">
          {alert.status === "unacknowledged" &&
            onAcknowledge && (
              <button
                onClick={() => onAcknowledge(alert.id)}
                className="flex-1 rounded-lg bg-yellow-600 px-3 py-2 text-sm font-medium text-white hover:bg-yellow-700"
              >
                Acknowledge
              </button>
            )}

          {onResolve && (
            <button
              onClick={() => onResolve(alert.id)}
              className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Resolve
            </button>
          )}
        </div>
      )}
    </div>
  );
}