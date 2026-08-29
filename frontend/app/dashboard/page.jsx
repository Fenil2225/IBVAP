"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-950">

        <Sidebar />

        <div className="flex flex-1 flex-col">

          <Navbar />

          <main className="p-6">

            <h1 className="text-3xl font-bold text-white">
              Security Dashboard
            </h1>

            <p className="mt-2 text-slate-400">
              Monitor cameras, videos, detections and security alerts.
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Cameras
                </p>
                <h2 className="mt-2 text-3xl font-bold text-white">
                  0
                </h2>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Videos
                </p>
                <h2 className="mt-2 text-3xl font-bold text-white">
                  0
                </h2>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Detections
                </p>
                <h2 className="mt-2 text-3xl font-bold text-white">
                  0
                </h2>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Active Alerts
                </p>
                <h2 className="mt-2 text-3xl font-bold text-white">
                  0
                </h2>
              </div>

            </div>

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}