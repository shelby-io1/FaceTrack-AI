"use client";

import Link from "next/link";
import Sidebar from "./Sidebar";
import { useAuth } from "@/lib/auth-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col">
        <header className="h-16 border-b border-gray-100 bg-white flex items-center justify-end px-6 gap-4">
          <Link href="/profile" className="text-sm font-medium text-gray-900 hover:text-gray-600">{user?.name}</Link>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
          <button onClick={logout} className="text-sm text-red-500 hover:text-red-700">
            Logout
          </button>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
