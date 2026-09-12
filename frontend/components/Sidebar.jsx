"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUser } from "../lib/auth";
import {
  LayoutDashboard,
  Radio,
  Camera,
  Car,
  Video,
  ShieldAlert,
  BarChart3,
  Shield,
  X,
  Cpu,
  MapPinned,
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Command Overview",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    href: "/dashboard/live",
    label: "Live Surveillance Matrix",
    icon: Radio,
    badge: "LIVE",
    badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
  },
  {
    href: "/dashboard/cameras",
    label: "Camera Registry",
    icon: Camera,
    badge: null,
  },
  {
    href: "/dashboard/zones",
    label: "Restricted Areas",
    icon: MapPinned,
    badge: "ADMIN",
    badgeColor: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    adminOnly: true,
  },
  {
    href: "/dashboard/anpr",
    label: "ANPR Plate Intelligence",
    icon: Car,
    badge: "AI",
    badgeColor: "bg-teal-500/20 text-teal-300 border border-teal-500/30",
  },
  {
    href: "/dashboard/videos",
    label: "Video Forensics & Upload",
    icon: Video,
    badge: null,
  },
  {
    href: "/dashboard/alerts",
    label: "Incident & Alerts Hub",
    icon: ShieldAlert,
    badge: null,
  },
  {
    href: "/dashboard/analytics",
    label: "Threat Analytics",
    icon: BarChart3,
    badge: null,
  },
];

export default function Sidebar({ isMobileOpen, onCloseMobile }) {
  const pathname = usePathname();
  const role = getUser()?.role;
  const canManage = role === "admin" || role === "security_officer";
  const canConfigure = role === "admin";

  const visibleNavItems = navItems.filter(({ adminOnly }) => !adminOnly || canConfigure);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800/80 bg-slate-950/90 p-5 backdrop-blur-2xl transition-transform duration-300 md:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-tr from-teal-500 via-cyan-400 to-emerald-400 font-black text-slate-950 shadow-lg shadow-teal-500/20">
              <Shield className="h-6 w-6 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold tracking-[0.25em] text-teal-300 uppercase">
                  IBVAP
                </span>
                <span className="rounded bg-teal-500/20 px-1 text-[9px] font-bold text-teal-300">
                  v1.0
                </span>
              </div>
              <h2 className="text-sm font-bold tracking-tight text-white">
                Intelligent Border Platform
              </h2>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-white md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* SIH Hackathon Tag */}
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-teal-500/20 bg-linear-to-r from-teal-500/10 to-cyan-500/5 px-3 py-2 text-xs text-teal-200">
          <Cpu className="h-4 w-4 text-teal-400 shrink-0" />
          <div className="truncate">
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
              Smart India Hackathon
            </div>
            <div className="text-xs font-semibold text-slate-300">AI Surveillance Unit</div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {visibleNavItems.map(({ href, label, icon: Icon, badge, badgeColor }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onCloseMobile}
                className={`group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "border border-teal-500/40 bg-linear-to-r from-teal-500/20 to-teal-500/5 text-white shadow-lg shadow-teal-500/10"
                    : "border border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? "text-teal-300" : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  />
                  <span>{label}</span>
                </div>

                {badge && (
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${badgeColor}`}>
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mb-4 rounded-2xl border border-slate-800/90 bg-slate-900/50 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Access Profile</div>
          <div className="mt-1 text-xs font-bold capitalize text-teal-300">
            {role?.replace("_", " ") || "operator"}
          </div>
          <div className="mt-2 text-[11px] leading-relaxed text-slate-400">
            {canConfigure ? "Full system control" : canManage ? "Monitoring and incident response" : "Read-only intelligence"}
          </div>
        </div>

        {/* System Telemetry Footer */}
        <div className="mt-auto pt-4 border-t border-slate-800/80">
          <div className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">AI Engine</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                Active YOLOv11
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">OCR Engine</span>
              <span className="font-semibold text-teal-300">Tesseract OCR</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">Backend API</span>
              <span className="font-mono text-[11px] text-slate-400">FastAPI</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}