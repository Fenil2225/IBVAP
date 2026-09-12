"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Radio } from "lucide-react";
import { isAuthenticated, getUser } from "../lib/auth";

const EMPTY_ROLES = [];

export default function ProtectedRoute({ children, allowedRoles = EMPTY_ROLES }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isActive = true;

    const checkAccess = () => {
      const authenticated = isAuthenticated();

      if (!authenticated) {
        router.replace("/login");
        return;
      }

      if (allowedRoles.length > 0) {
        const user = getUser();
        if (user && !allowedRoles.includes(user.role)) {
          router.replace("/dashboard");
          return;
        }
      }

      if (isActive) {
        setChecking(false);
      }
    };

    const timeoutId = setTimeout(checkAccess, 10);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [router, allowedRoles]);

  if (checking) {
    return (
      <div className="ibvap-shell flex min-h-screen items-center justify-center p-4">
        <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-8 text-center max-w-sm w-full">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 shadow-lg shadow-teal-500/20">
            <Shield className="h-8 w-8 text-slate-950" />
            <div className="absolute inset-0 rounded-2xl border-2 border-teal-300 animate-ping opacity-30"></div>
          </div>
          <p className="mt-4 text-xs font-bold tracking-[0.25em] text-teal-400 uppercase">
            IBVAP Intelligence
          </p>
          <h3 className="mt-1 text-base font-bold text-white">Verifying Authorization...</h3>
          <p className="mt-1 text-xs text-slate-400">Securing communications stream</p>
        </div>
      </div>
    );
  }

  return children;
}