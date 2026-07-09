"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import DepartmentCombobox from "@/components/DepartmentCombobox";
import type { Student } from "../../types";

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    roll_number: "",
    department: "",
    semester: "",
    phone: "",
  });

  const { data: student } = useQuery<Student>({
    queryKey: ["student", id],
    queryFn: () => api.get(`/students/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name,
        roll_number: student.roll_number,
        department: student.department,
        semester: student.semester,
        phone: student.phone || "",
      });
    }
  }, [student]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => api.patch(`/students/${id}`, data),
    onSuccess: () => router.push("/students"),
    onError: (err: unknown) => {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setError(axiosErr.response?.data?.detail || "Update failed");
      } else {
        setError("Update failed");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    updateMutation.mutate(form);
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppLayout>
        <div className="p-6 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Edit Student</h1>
            <Link href="/students" className="text-sm text-gray-400 hover:text-gray-600">Cancel</Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(["name", "roll_number", "semester", "phone"] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {field.replace("_", " ")}
                </label>
                <input
                  type="text"
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                  required={field !== "phone"}
                />
              </div>
            ))}

            <DepartmentCombobox
              value={form.department}
              onChange={(v) => setForm({ ...form, department: v })}
              required
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Save Changes
            </button>
          </form>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
