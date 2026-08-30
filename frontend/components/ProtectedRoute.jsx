"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../lib/auth";

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
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
        const userData = localStorage.getItem("user");

        if (userData) {
          const user = JSON.parse(userData);

          if (!allowedRoles.includes(user.role)) {
            router.replace("/dashboard");
            return;
          }
        }
      }

      if (isActive) {
        setChecking(false);
      }
    };

    const timeoutId = setTimeout(checkAccess, 0);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [router, allowedRoles]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading...
      </div>
    );
  }

  return children;
}