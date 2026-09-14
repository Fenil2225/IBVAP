"use client";

import { useEffect, useState } from "react";
import {
  Edit3,
  MapPinned,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import { getCameras } from "../../../services/cameraservice";
import {
  createZone,
  deleteZone,
  getZones,
  updateZone,
} from "../../../services/zoneservice";

const emptyForm = {
  camera_id: "",
  zone_name: "",
  x1: 0,
  y1: 0,
  x2: 100,
  y2: 100,
  is_active: true,
};

export default function ZonesPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [zones, setZones] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [zoneData, cameraData] = await Promise.all([
        getZones(),
        getCameras(),
      ]);
      setZones(Array.isArray(zoneData) ? zoneData : []);
      setCameras(Array.isArray(cameraData) ? cameraData : []);
    } catch (error) {
      setMessage(error.message || "Unable to load restricted areas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadData(), 0);
    return () => clearTimeout(timer);
  }, []);

  const openCreate = (cameraId = cameras[0]?.id) => {
    setEditingId(null);
    setForm({ ...emptyForm, camera_id: cameraId ? String(cameraId) : "" });
    setMessage("");
    setShowForm(true);
  };

  const openEdit = (zone) => {
    setEditingId(zone.id);
    setForm({
      camera_id: String(zone.camera_id),
      zone_name: zone.zone_name,
      x1: zone.x1,
      y1: zone.y1,
      x2: zone.x2,
      y2: zone.y2,
      is_active: Boolean(zone.is_active),
    });
    setMessage("");
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const payload = {
      ...form,
      camera_id: Number(form.camera_id),
      x1: Number(form.x1),
      y1: Number(form.y1),
      x2: Number(form.x2),
      y2: Number(form.y2),
    };
    try {
      if (editingId) await updateZone(editingId, payload);
      else await createZone(payload);
      setShowForm(false);
      setMessage(
        editingId ? "Restricted area updated." : "Restricted area created.",
      );
      await loadData();
    } catch (error) {
      setMessage(error.message || "Unable to save restricted area");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zone) => {
    if (!window.confirm(`Delete ${zone.zone_name}? This cannot be undone.`))
      return;
    try {
      await deleteZone(zone.id);
      setMessage("Restricted area deleted.");
      await loadData();
    } catch (error) {
      setMessage(error.message || "Unable to delete restricted area");
    }
  };

  return (
    <ProtectedRoute>
      <div className="ibvap-shell min-h-screen text-slate-100">
        <Sidebar
          isMobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <div className="md:ml-72 flex min-h-screen flex-col">
          <Navbar onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
          <main className="grid-surface flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
            <header className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-linear-to-br from-teal-500/10 via-slate-900/70 to-slate-950/80 p-6 sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-teal-400/10 bg-teal-400/5 blur-2xl" />
              <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-teal-400">
                    <MapPinned className="h-4 w-4" /> Perimeter Policy
                  </div>
                  <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                    Restricted Areas
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    Set precise detection boundaries and control intrusion
                    monitoring for every camera.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={loadData}
                    className="icon-button border-slate-700 bg-slate-950/60"
                    title="Refresh restricted areas"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button onClick={openCreate} className="primary-button">
                    <Plus className="h-4 w-4" /> Add Restricted Area
                  </button>
                </div>
              </div>
            </header>

            {message && (
              <div className="status-banner flex items-center gap-2">
                <Shield className="h-4 w-4 text-teal-300" />
                {message}
              </div>
            )}
            <section className="glass-panel rounded-3xl border border-slate-800 p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">
                    Camera configuration
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-white">
                    Boundary management
                  </h2>
                  <p className="text-xs text-slate-400">
                    Manage each restricted area independently for every camera.
                  </p>
                </div>
                <span className="metric-chip self-start">
                  {zones.length} {zones.length === 1 ? "area" : "areas"}
                </span>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-20 animate-pulse rounded-2xl bg-slate-900/60"
                    />
                  ))}
                </div>
              ) : cameras.length === 0 ? (
                <div className="empty-state">
                  <Shield className="h-8 w-8 text-teal-400" />
                  <p className="font-semibold text-white">
                    No cameras available
                  </p>
                  <p className="text-xs text-slate-400">
                    Add a camera before configuring restricted areas.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {cameras.map((camera) => {
                    const cameraZones = zones.filter(
                      (zone) => Number(zone.camera_id) === Number(camera.id),
                    );
                    return (
                      <section
                        key={camera.id}
                        className="rounded-2xl border border-slate-800 bg-slate-900/35 p-4 sm:p-5"
                      >
                        <div className="mb-4 flex flex-col gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                              <MapPinned className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-white">
                                {camera.name}
                              </h3>
                              <p className="mt-1 text-xs text-slate-500">
                                {camera.camera_id || `Camera #${camera.id}`} ·{" "}
                                {cameraZones.length} configured{" "}
                                {cameraZones.length === 1 ? "area" : "areas"}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => openCreate(camera.id)}
                            className="secondary-button self-start"
                          >
                            <Plus className="h-4 w-4" /> Add Area
                          </button>
                        </div>
                        {cameraZones.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-800 px-4 py-6 text-center text-xs text-slate-500">
                            No restricted areas configured for this camera.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {cameraZones.map((zone) => (
                              <article
                                key={zone.id}
                                className="group flex flex-col gap-4 rounded-2xl border border-slate-800/90 bg-slate-950/35 p-4 transition hover:border-teal-500/30 hover:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="flex min-w-0 items-start gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-300">
                                    <MapPinned className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="truncate font-bold text-white">
                                      {zone.zone_name}
                                    </h4>
                                    <p className="mt-1 text-xs text-slate-500">
                                      Detection boundary
                                    </p>
                                    <p className="mt-2 font-mono text-[11px] text-teal-300">
                                      [{zone.x1}, {zone.y1}]{" "}
                                      <span className="text-slate-600">to</span>{" "}
                                      [{zone.x2}, {zone.y2}]
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-3 sm:justify-end">
                                  <span
                                    className={
                                      zone.is_active
                                        ? "state-active"
                                        : "state-inactive"
                                    }
                                  >
                                    {zone.is_active ? "Active" : "Paused"}
                                  </span>
                                  <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
                                    <button
                                      onClick={() => openEdit(zone)}
                                      className="icon-button-small"
                                      title="Edit restricted area"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(zone)}
                                      className="icon-button-small danger"
                                      title="Delete restricted area"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </section>
          </main>
        </div>

        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md"
            onClick={() => setShowForm(false)}
          >
            <form
              onSubmit={handleSubmit}
              onClick={(event) => event.stopPropagation()}
              className="my-8 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/50"
            >
              <div className="border-b border-slate-800 bg-linear-to-r from-teal-500/10 to-transparent p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-teal-400/20 bg-teal-400/10 text-teal-300">
                      <MapPinned className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-black text-white">
                      {editingId
                        ? "Update restricted area"
                        : "Add restricted area"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {editingId
                        ? "Adjust the boundary or monitoring state."
                        : "Create a detection boundary for a camera."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="icon-button"
                    title="Close form"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-6 p-6 sm:p-7">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-200 sm:col-span-2">
                    <span>Camera</span>
                    <select
                      required
                      value={form.camera_id}
                      onChange={(event) =>
                        setForm({ ...form, camera_id: event.target.value })
                      }
                      className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm font-normal text-slate-100 transition placeholder:text-slate-600 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                    >
                      <option value="">Select camera</option>
                      {cameras.map((camera) => (
                        <option key={camera.id} value={camera.id}>
                          {camera.name} ({camera.camera_id})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-200 sm:col-span-2">
                    <span>Area name</span>
                    <input
                      required
                      value={form.zone_name}
                      onChange={(event) =>
                        setForm({ ...form, zone_name: event.target.value })
                      }
                      className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm font-normal text-slate-100 transition placeholder:text-slate-600 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                      placeholder="North Gate Buffer"
                    />
                  </label>
                </div>
                <div>
                  <div className="mb-3">
                    <h3 className="text-sm font-bold text-white">
                      Boundary coordinates
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Define the top-left and bottom-right points in camera
                      pixels.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {["x1", "y1", "x2", "y2"].map((coordinate) => (
                      <label key={coordinate} className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <span>{coordinate}</span>
                        <input
                          required
                          type="number"
                          min="0"
                          value={form[coordinate]}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              [coordinate]: event.target.value,
                            })
                          }
                          className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 font-mono text-sm font-normal text-slate-100 transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      setForm({ ...form, is_active: event.target.checked })
                    }
                    className="accent-teal-400"
                  />{" "}
                  <span>
                    <span className="block text-sm text-white">
                      Enable intrusion monitoring
                    </span>
                    <span className="mt-1 block font-normal text-slate-500">
                      Apply this boundary during live and forensic analysis.
                    </span>
                  </span>
                </label>
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-800 bg-slate-950/30 p-6 sm:flex-row sm:justify-end sm:p-7">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="secondary-button"
                >
                  Cancel
                </button>
                <button disabled={saving} className="primary-button">
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Area"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
