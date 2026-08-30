"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ShieldAlert, Radio, UserCheck, LogOut, Menu } from "lucide-react";
import { getUser, logout } from "../lib/auth";
import { getRecentAlerts } from "../services/analyticsservice";

export default function Navbar({ onMobileMenuToggle }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [unackAlertCount, setUnackAlertCount] = useState(0);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setUser(getUser());

    // Clock
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);

    // Fetch alerts count
    getRecentAlerts()
      .then((res) => {
        if (res?.data) {
          const unack = res.data.filter((a) => a.status === "unacknowledged").length;
          setUnackAlertCount(unack);
        }
      })
      .catch(() => {});

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-800/80 bg-slate-950/70 px-4 backdrop-blur-2xl lg:px-8">
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500"></span>
            </span>
            <span className="text-[11px] font-bold tracking-[0.2em] text-teal-400 uppercase">
              Border Guard AI System
            </span>
          </div>
          <h1 className="mt-0.5 text-base font-bold text-white lg:text-lg">
            IBVAP Tactical Command
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-5">
        {/* System Time */}
        <div className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-1.5 font-mono text-xs text-slate-300 sm:flex">
          <Radio className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
          <span>{currentTime || "--:--:--"}</span>
        </div>

        {/* Quick Alert Bell */}
        <Link
          href="/dashboard/alerts"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 transition hover:border-teal-500/40 hover:text-teal-300"
          title="Incident Alerts"
        >
          <Bell className="h-4 w-4" />
          {unackAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-slate-950">
              {unackAlertCount > 9 ? "9+" : unackAlertCount}
            </span>
          )}
        </Link>

        {/* Operator Profile */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/70 py-1.5 pr-2 pl-3">
          <div className="hidden text-right sm:block">
            <div className="text-[10px] font-semibold tracking-wider text-teal-300 uppercase">
              {user?.role ? user.role.replace("_", " ") : "Operator"}
            </div>
            <div className="text-xs font-bold text-white">{user?.name || "Officer"}</div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 font-bold text-slate-950">
            {user?.name ? user.name.charAt(0).toUpperCase() : "O"}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 transition hover:bg-rose-500/20 hover:text-white"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}