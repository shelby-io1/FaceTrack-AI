"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

interface Props {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "teacher" | "student")[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
    if (!isLoading && isAuthenticated && allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="h-8 w-8 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
