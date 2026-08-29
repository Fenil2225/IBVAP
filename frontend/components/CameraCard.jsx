"use client";

export default function CameraCard({ camera, onStatusChange }) {
  const isOnline = camera.status === "online";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {camera.name}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {camera.camera_id}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isOnline
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {camera.status}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <p className="text-xs text-slate-500">Location</p>
          <p className="text-sm text-slate-300">
            {camera.location}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500">FPS</p>
            <p className="text-sm text-slate-300">
              {camera.fps}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">AI Detection</p>
            <p className="text-sm text-slate-300">
              {camera.ai_enabled ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500">Last Seen</p>
          <p className="text-sm text-slate-300">
            {camera.last_seen
              ? new Date(camera.last_seen).toLocaleString()
              : "Never"}
          </p>
        </div>
      </div>

      {onStatusChange && (
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => onStatusChange(camera.id, "online")}
            className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Online
          </button>

          <button
            onClick={() => onStatusChange(camera.id, "offline")}
            className="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-600"
          >
            Offline
          </button>
        </div>
      )}
    </div>
  );
}