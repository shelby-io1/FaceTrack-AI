"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: "",
    age: "",
    address: "",
    cnic: "",
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch("/auth/me", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      setEditing(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      if (v !== "") payload[k] = k === "age" ? Number(v) : v;
    }
    updateMutation.mutate(payload);
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "teacher", "student"]}>
      <AppLayout>
        <div className="p-6 max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-sm text-gray-400 mb-6">Manage your personal information</p>

          <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <div className="font-semibold text-gray-900">{user?.name}</div>
                <div className="text-sm text-gray-400">{user?.email}</div>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
            </div>

            {!editing ? (
              <>
                {([
                  ["Phone", user?.phone],
                  ["Age", user?.age?.toString()],
                  ["Address", user?.address],
                  ["CNIC", user?.cnic],
                ] as const).map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-gray-900">{value || "---"}</span>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setForm({
                      name: user?.name ?? "",
                      phone: user?.phone ?? "",
                      age: user?.age?.toString() ?? "",
                      address: user?.address ?? "",
                      cnic: user?.cnic ?? "",
                    });
                    setEditing(true);
                  }}
                  className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 mt-4"
                >
                  Edit Profile
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {(["name", "phone", "age", "address", "cnic"] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
                    <input
                      type={field === "age" ? "number" : "text"}
                      value={form[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                    />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
