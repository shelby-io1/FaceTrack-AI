"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordMutation = useMutation({
    mutationFn: async (data: { current_password: string; new_password: string }) => {
      const neonRes = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: data.current_password, newPassword: data.new_password }),
      });
      if (!neonRes.ok) {
        const neonErr = await neonRes.json();
        throw new Error(neonErr.error?.message || "Failed to update password");
      }
      await api.post("/auth/change-password", data);
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return;
    passwordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "---";

  return (
    <ProtectedRoute allowedRoles={["admin", "teacher", "student"]}>
      <AppLayout>
        <div className="p-6 max-w-lg mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
            <p className="text-sm text-gray-400">Manage your account and preferences</p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 text-sm">Account</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Email</span>
                <span className="text-gray-900">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Role</span>
                <span className="capitalize text-gray-900">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Member since</span>
                <span className="text-gray-900">{joinedDate}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="font-semibold text-gray-900 text-sm mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm outline-none focus:border-gray-900"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <EyeIcon open={showCurrent} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm outline-none focus:border-gray-900"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <EyeIcon open={showNew} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm outline-none focus:border-gray-900"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
              </div>
              {newPassword !== confirmPassword && confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              {passwordMutation.isError && (
                <p className="text-xs text-red-500">{(passwordMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to change password"}</p>
              )}
              {passwordMutation.isSuccess && (
                <p className="text-xs text-green-600">Password changed successfully</p>
              )}
              <button
                type="submit"
                disabled={passwordMutation.isPending || newPassword !== confirmPassword}
                className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {passwordMutation.isPending ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
