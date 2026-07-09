"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";

interface Teacher {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  age: number | null;
  address: string | null;
  cnic: string | null;
  is_active: boolean;
  created_at: string;
}

export default function TeachersPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Teacher>>({});

  const { data: teachers, isLoading } = useQuery<Teacher[]>({
    queryKey: ["teachers"],
    queryFn: () => api.get("/teachers/").then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.patch(`/teachers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setEditingId(null);
    },
  });

  const startEdit = (t: Teacher) => {
    setEditingId(t.id);
    setEditForm({ name: t.name, phone: t.phone, age: t.age, address: t.address, cnic: t.cnic });
  };

  const saveEdit = (id: number) => {
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(editForm)) {
      if (v !== undefined && v !== null && v !== "") payload[k] = k === "age" ? Number(v) : v;
    }
    updateMutation.mutate({ id, data: payload });
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppLayout>
        <div className="p-6 max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Teachers</h1>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : !teachers?.length ? (
            <div className="text-center py-12 text-gray-500">No teachers found</div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-600">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Age</th>
                    <th className="px-4 py-3 font-medium">Address</th>
                    <th className="px-4 py-3 font-medium">CNIC</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                      {editingId === t.id ? (
                        <>
                          <td className="px-4 py-3">
                            <input value={editForm.name ?? ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-gray-900" />
                          </td>
                          <td className="px-4 py-3 text-gray-500">{t.email}</td>
                          <td className="px-4 py-3">
                            <input value={editForm.phone ?? ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-gray-900" placeholder="—" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" value={editForm.age ?? ""} onChange={(e) => setEditForm({ ...editForm, age: e.target.value ? Number(e.target.value) : null })} className="w-20 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-gray-900" placeholder="—" />
                          </td>
                          <td className="px-4 py-3">
                            <input value={editForm.address ?? ""} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-gray-900" placeholder="—" />
                          </td>
                          <td className="px-4 py-3">
                            <input value={editForm.cnic ?? ""} onChange={(e) => setEditForm({ ...editForm, cnic: e.target.value })} className="w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-gray-900" placeholder="—" />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => saveEdit(t.id)} className="text-gray-900 hover:text-gray-700 mr-3 font-medium">Save</button>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                          <td className="px-4 py-3 text-gray-500">{t.email}</td>
                          <td className="px-4 py-3 text-gray-700">{t.phone || "—"}</td>
                          <td className="px-4 py-3 text-gray-700">{t.age?.toString() || "—"}</td>
                          <td className="px-4 py-3 text-gray-700">{t.address || "—"}</td>
                          <td className="px-4 py-3 text-gray-700">{t.cnic || "—"}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => startEdit(t)} className="text-gray-500 hover:text-gray-900">Edit</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
