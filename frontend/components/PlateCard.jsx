"use client";

import { useState } from "react";
import { Car, Truck, Bus, Bike, Copy, Check, Clock, Camera, Sparkles, ZoomIn, X } from "lucide-react";
import { getFileUrl } from "../lib/api";

export default function PlateCard({ detection }) {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const vehicleIcons = {
    car: Car,
    truck: Truck,
    bus: Bus,
    motorcycle: Bike,
    bike: Bike,
  };

  const IconComp = vehicleIcons[detection.vehicle_type?.toLowerCase()] || Car;
  const imageUrl = getFileUrl(detection.image_path);
  const confidencePercent = Math.round((detection.confidence || 0.85) * 100);

  const copyPlate = () => {
    navigator.clipboard.writeText(detection.plate_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="glass-panel-interactive relative flex flex-col justify-between overflow-hidden rounded-2xl p-4">
        {/* Top: Plate Crop Image Preview or Fallback */}
        <div className="relative mb-3 h-36 w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-800">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Detected plate ${detection.plate_number}`}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900/80 text-slate-600">
              <Car className="h-10 w-10 text-slate-700" />
            </div>
          )}

          {/* Quick Zoom Button */}
          {imageUrl && (
            <button
              onClick={() => setShowModal(true)}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950/80 text-slate-300 backdrop-blur-md transition hover:bg-teal-500 hover:text-slate-950"
              title="Expand Image"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Confidence Badge */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-slate-950/85 px-2 py-0.5 text-[10px] font-bold text-teal-300 backdrop-blur-md border border-teal-500/30">
            <Sparkles className="h-2.5 w-2.5" />
            <span>{confidencePercent}% CONFIDENCE</span>
          </div>
        </div>

        {/* License Plate Banner */}
        <div className="flex items-center justify-between gap-2 py-1">
          <span className="license-plate-badge text-sm sm:text-base">
            {detection.plate_number}
          </span>

          <button
            onClick={copyPlate}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:border-teal-500/40 hover:text-teal-300"
            title="Copy Plate Number"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Vehicle Classification & Source */}
        <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400 capitalize">
              <IconComp className="h-3.5 w-3.5 text-teal-400" />
              {detection.vehicle_type || "Vehicle"}
            </span>

            {detection.camera_id && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Camera className="h-3 w-3 text-slate-500" /> Cam #{detection.camera_id}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {detection.detected_at
                ? new Date(detection.detected_at).toLocaleString()
                : "Real-time"}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Image Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel relative max-w-2xl w-full overflow-hidden rounded-3xl p-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="license-plate-badge text-lg">{detection.plate_number}</span>
                <p className="mt-1 text-xs text-slate-400 capitalize">
                  Detected {detection.vehicle_type || "Vehicle"} • {confidencePercent}% Match
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl bg-black border border-slate-800">
              <img
                src={imageUrl}
                alt={detection.plate_number}
                className="w-full max-h-[60vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
