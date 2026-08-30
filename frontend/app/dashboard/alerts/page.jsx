"use client";

import { useEffect, useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Plus,
  RefreshCw,
  X,
  Camera,
  CheckCheck,
  Flame,
} from "lucide-react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import AlertCard from "../../../components/AlertCard";
import StatsCard from "../../../components/StatsCard";
import { getAlerts, createAlert, acknowledgeAlert, resolveAlert } from "../../../services/alertservice";
import { getCameras } from "../../../services/cameraservice";

export default function AlertsPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    camera_id: "",
    alert_type: "Perimeter Intrusion Breach",
    severity: "high",
    description: "",
  });

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [aData, cData] = await Promise.all([getAlerts(), getCameras()]);
      const alertList = Array.isArray(aData) ? aData : [];
      setAlerts(alertList);

      const camList = Array.isArray(cData) ? cData : [];
      setCameras(camList);
      if (camList.length > 0 && !form.camera_id) {
        setForm((prev) => ({ ...prev, camera_id: camList[0].id }));
      }
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (id) => {
    await acknowledgeAlert(id);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "acknowledged" } : a))
    );
  };

  const handleResolve = async (id) => {
    await resolveAlert(id);
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "resolved", resolved_at: new Date().toISOString() } : a
      )
    );
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAlert({
        camera_id: parseInt(form.camera_id, 10),
        alert_type: form.alert_type,
        severity: form.severity,
        description: form.description.trim() || undefined,
      });
      setShowAddModal(false);
      setForm({
        camera_id: cameras[0]?.id || "",
        alert_type: "Perimeter Intrusion Breach",
        severity: "high",
        description: "",
      });
      loadData(true);
    } catch (err) {
      alert(err.message || "Failed to dispatch alert");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter local alerts
  const filteredAlerts = alerts.filter((a) => {
    const matchesSeverity =
      severityFilter === "all"
        ? true
        : a.severity?.toLowerCase() === severityFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all"
        ? true
        : a.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSeverity && matchesStatus;
  });

  const criticalCount = alerts.filter(
    (a) => a.severity === "critical" && a.status !== "resolved"
  ).length;
  const unackCount = alerts.filter((a) => a.status === "unacknowledged").length;
  const resolvedCount = alerts.filter((a) => a.status === "resolved").length;

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
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  <p className="text-xs font-bold tracking-[0.28em] text-teal-400 uppercase">
                    Incident Management
                  </p>
                </div>
                <h1 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  Border Threat & Incident Triage
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  Real-time security breach response board and perimeter alert tracking.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => loadData(true)}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:border-teal-500/40 hover:text-white"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-teal-400" : ""}`} />
                  <span>Sync Alerts</span>
                </button>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-rose-500/20 transition hover:opacity-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Dispatch Incident</span>
                </button>
              </div>
            </div>

            {/* Alert Summary Stats */}
            <section className="grid gap-4 sm:grid-cols-3">
              <StatsCard
                title="Active Critical Threats"
                value={criticalCount}
                subtitle="Requires immediate border response"
                icon={Flame}
                color="rose"
                trend={criticalCount > 0 ? "URGENT" : "Clear"}
              />

              <StatsCard
                title="Open Unacknowledged"
                value={unackCount}
                subtitle="Pending operator review"
                icon={AlertTriangle}
                color="amber"
                trend="Action Needed"
              />

              <StatsCard
                title="Resolved Incidents"
                value={resolvedCount}
                subtitle="Successfully mitigated"
                icon={CheckCircle2}
                color="emerald"
                trend="Secured"
              />
            </section>

            {/* Filter Bar */}
            <section className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 border border-slate-800">
              {/* Severity Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {["all", "critical", "high", "medium", "low"].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition ${
                      severityFilter === sev
                        ? sev === "critical"
                          ? "bg-rose-500 text-white"
                          : sev === "high"
                          ? "bg-orange-500 text-white"
                          : sev === "medium"
                          ? "bg-amber-500 text-slate-950"
                          : "bg-teal-500 text-slate-950"
                        : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-bold text-slate-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-teal-400"
                >
                  <option value="all">All Statuses ({alerts.length})</option>
                  <option value="unacknowledged">Unacknowledged ({unackCount})</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="resolved">Resolved ({resolvedCount})</option>
                </select>
              </div>
            </section>

            {/* Alerts List */}
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="glass-panel h-48 rounded-2xl animate-pulse bg-slate-900/40 p-5"
                  />
                ))}
              </div>
            ) : filteredAlerts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={handleAcknowledge}
                    onResolve={handleResolve}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-950 p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
                <h3 className="text-base font-bold text-white">No alerts match active filters</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Perimeter sectors are currently calm or no incidents matched the selected severity/status.
                </p>
              </div>
            )}
          </main>
        </div>

        {/* Dispatch Incident Modal */}
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
                  <h2 className="text-xl font-bold text-white">Dispatch Security Incident</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Raise an operational alert to mobilize border security officers.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAlert} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-300">
                    Source Camera Sector <span className="text-teal-400">*</span>
                  </label>
                  <select
                    value={form.camera_id}
                    onChange={(e) => setForm({ ...form, camera_id: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3 text-xs text-white focus:border-teal-400"
                  >
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.camera_id}) - {c.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">
                      Alert Type <span className="text-teal-400">*</span>
                    </label>
                    <select
                      value={form.alert_type}
                      onChange={(e) => setForm({ ...form, alert_type: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3 text-xs text-white focus:border-teal-400"
                    >
                      <option value="Perimeter Intrusion Breach">Perimeter Intrusion Breach</option>
                      <option value="Suspicious Vehicle Detected">Suspicious Vehicle Detected</option>
                      <option value="Unidentified Person in Restricted Zone">Unidentified Person</option>
                      <option value="Loitering Warning">Loitering Warning</option>
                      <option value="Optical Sensor Obstruction">Optical Sensor Obstruction</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">
                      Severity Level <span className="text-teal-400">*</span>
                    </label>
                    <select
                      value={form.severity}
                      onChange={(e) => setForm({ ...form, severity: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-3 text-xs text-white focus:border-teal-400"
                    >
                      <option value="critical">Critical (Immediate Mobilization)</option>
                      <option value="high">High (Priority Warning)</option>
                      <option value="medium">Medium (Standard Advisory)</option>
                      <option value="low">Low (Informational)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-300">
                    Incident Description & Tactical Notes
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe suspicious movement, coordinates, vehicle color/make..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-white placeholder:text-slate-600 focus:border-teal-400"
                  />
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
                    className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 py-2.5 text-xs font-extrabold text-white transition hover:opacity-95 disabled:opacity-60"
                  >
                    {submitting ? "Dispatching..." : "Dispatch Alert"}
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
