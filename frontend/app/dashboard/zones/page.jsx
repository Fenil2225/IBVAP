"use client";

import { useEffect, useState } from "react";
import { Edit3, MapPinned, Plus, RefreshCw, Shield, Trash2, X } from "lucide-react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import { getCameras } from "../../../services/cameraservice";
import { createZone, deleteZone, getZones, updateZone } from "../../../services/zoneservice";

const emptyForm = { camera_id: "", zone_name: "", x1: 0, y1: 0, x2: 100, y2: 100, is_active: true };

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
      const [zoneData, cameraData] = await Promise.all([getZones(), getCameras()]);
      setZones(Array.isArray(zoneData) ? zoneData : []);
      setCameras(Array.isArray(cameraData) ? cameraData : []);
    } catch (error) {
      setMessage(error.message || "Unable to load restricted areas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, camera_id: cameras[0]?.id ? String(cameras[0].id) : "" });
    setMessage("");
    setShowForm(true);
  };

  const openEdit = (zone) => {
    setEditingId(zone.id);
    setForm({
      camera_id: String(zone.camera_id), zone_name: zone.zone_name,
      x1: zone.x1, y1: zone.y1, x2: zone.x2, y2: zone.y2, is_active: Boolean(zone.is_active),
    });
    setMessage("");
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const payload = { ...form, camera_id: Number(form.camera_id), x1: Number(form.x1), y1: Number(form.y1), x2: Number(form.x2), y2: Number(form.y2) };
    try {
      if (editingId) await updateZone(editingId, payload);
      else await createZone(payload);
      setShowForm(false);
      setMessage(editingId ? "Restricted area updated." : "Restricted area created.");
      await loadData();
    } catch (error) {
      setMessage(error.message || "Unable to save restricted area");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zone) => {
    if (!window.confirm(`Delete ${zone.zone_name}? This cannot be undone.`)) return;
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
        <Sidebar isMobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        <div className="md:ml-72 flex min-h-screen flex-col">
          <Navbar onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
          <main className="grid-surface flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-teal-400"><MapPinned className="h-4 w-4" /> Perimeter Policy</div>
                <h1 className="mt-2 text-3xl font-black text-white">Restricted Areas</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-400">Define the rectangular sectors that trigger intrusion response for each border camera.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={loadData} className="icon-button" title="Refresh restricted areas"><RefreshCw className="h-4 w-4" /></button>
                <button onClick={openCreate} className="primary-button"><Plus className="h-4 w-4" /> Add Restricted Area</button>
              </div>
            </header>

            {message && <div className="status-banner">{message}</div>}
            <section className="glass-panel rounded-3xl border border-slate-800 p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4"><div><h2 className="font-bold text-white">Configured sectors</h2><p className="text-xs text-slate-400">Changes apply to the next live or forensic analysis cycle.</p></div><span className="metric-chip">{zones.length} areas</span></div>
              {loading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-900/60" />)}</div> : zones.length === 0 ? <div className="empty-state"><Shield className="h-8 w-8 text-teal-400" /><p className="font-semibold text-white">No restricted areas configured</p><p className="text-xs text-slate-400">Add a monitored rectangle to start intrusion policies.</p></div> : <div className="grid gap-3 lg:grid-cols-2">{zones.map((zone) => <article key={zone.id} className="zone-row"><div className="flex min-w-0 items-start gap-3"><div className="zone-icon"><MapPinned className="h-4 w-4" /></div><div className="min-w-0"><h3 className="truncate font-bold text-white">{zone.zone_name}</h3><p className="mt-1 text-xs text-slate-400">{zone.camera_name || `Camera #${zone.camera_id}`}</p><p className="mt-2 font-mono text-[11px] text-teal-300">[{zone.x1}, {zone.y1}] to [{zone.x2}, {zone.y2}]</p></div></div><div className="flex items-center gap-2"><span className={zone.is_active ? "state-active" : "state-inactive"}>{zone.is_active ? "Active" : "Paused"}</span><button onClick={() => openEdit(zone)} className="icon-button-small" title="Edit restricted area"><Edit3 className="h-3.5 w-3.5" /></button><button onClick={() => handleDelete(zone)} className="icon-button-small danger" title="Delete restricted area"><Trash2 className="h-3.5 w-3.5" /></button></div></article>)}</div>}
            </section>
          </main>
        </div>

        {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md" onClick={() => setShowForm(false)}><form onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()} className="glass-panel w-full max-w-xl rounded-3xl border border-slate-700 p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between border-b border-slate-800 pb-4"><div><h2 className="text-xl font-bold text-white">{editingId ? "Edit restricted area" : "Add restricted area"}</h2><p className="mt-1 text-xs text-slate-400">Use pixel coordinates from the camera frame.</p></div><button type="button" onClick={() => setShowForm(false)} className="icon-button"><X className="h-4 w-4" /></button></div><div className="grid gap-4 sm:grid-cols-2"><label className="field-label sm:col-span-2">Camera<select required value={form.camera_id} onChange={(event) => setForm({ ...form, camera_id: event.target.value })} className="field-input"><option value="">Select camera</option>{cameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.name} ({camera.camera_id})</option>)}</select></label><label className="field-label sm:col-span-2">Area name<input required value={form.zone_name} onChange={(event) => setForm({ ...form, zone_name: event.target.value })} className="field-input" placeholder="North Gate Buffer" /></label>{["x1", "y1", "x2", "y2"].map((coordinate) => <label key={coordinate} className="field-label">{coordinate.toUpperCase()}<input required type="number" min="0" value={form[coordinate]} onChange={(event) => setForm({ ...form, [coordinate]: event.target.value })} className="field-input font-mono" /></label>)}<label className="flex items-center gap-2 text-xs font-semibold text-slate-300 sm:col-span-2"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} className="accent-teal-400" /> Enable intrusion monitoring for this area</label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="secondary-button">Cancel</button><button disabled={saving} className="primary-button">{saving ? "Saving..." : editingId ? "Save Changes" : "Create Area"}</button></div></form></div>}
      </div>
    </ProtectedRoute>
  );
}
