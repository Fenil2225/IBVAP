"use client";

import CameraCard from "./CameraCard";

export default function CameraGrid({
  cameras = [],
  onStatusChange,
}) {
  if (cameras.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center">
        <p className="text-slate-400">
          No cameras found.
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Add a camera to start monitoring.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {cameras.map((camera) => (
        <CameraCard
          key={camera.id}
          camera={camera}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}