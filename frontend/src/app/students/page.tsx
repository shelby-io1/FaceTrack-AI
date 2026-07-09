"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import type { Student } from "./types";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["students", search],
    queryFn: () =>
      api.get("/students/", { params: search ? { search } : {} }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/students/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });

  return (
    <ProtectedRoute allowedRoles={["admin", "teacher"]}>
      <AppLayout>
        <div className="p-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            {isAdmin && (
              <Link
                href="/students/new"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Add Student
              </Link>
            )}
          </div>

          <input
            type="text"
            placeholder="Search by name, email, roll number, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-gray-900 mb-6"
          />

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : !students?.length ? (
            <div className="text-center py-12 text-gray-500">No students found</div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-600">
                    <th className="px-4 py-3 font-medium">Roll No</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Class</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    {isAdmin && <th className="px-4 py-3 font-medium text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{s.roll_number}</td>
                      <td className="px-4 py-3 text-gray-700">{s.name}</td>
                      <td className="px-4 py-3 text-gray-500">{s.email}</td>
                      <td className="px-4 py-3 text-gray-700">{s.department}</td>
                      <td className="px-4 py-3 text-gray-700">{s.class_name}</td>
                      <td className="px-4 py-3 text-gray-500">{s.phone || "—"}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/students/${s.id}/edit`}
                            className="text-gray-500 hover:text-gray-900 mr-3"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm("Delete this student?")) deleteMutation.mutate(s.id);
                            }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            Delete
                          </button>
                        </td>
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
