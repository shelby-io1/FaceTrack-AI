"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import DepartmentCombobox from "@/components/DepartmentCombobox";

export default function NewStudentPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roll_number: "",
    department: "",
    class_name: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const neonRes = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password, name: form.name }),
      });
      const neonData = await neonRes.json();
      if (!neonRes.ok) {
        const msg = neonData.error?.message || "";
        if (!msg.toLowerCase().includes("already")) {
          throw new Error(msg || "Neon Auth sign-up failed");
        }
      }

      await api.post("/students/", form);
      router.push("/students");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setError(axiosErr.response?.data?.detail || "Failed to create student");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create student");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppLayout>
        <div className="p-6 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Add Student</h1>
            <Link href="/students" className="text-sm text-gray-400 hover:text-gray-600">Cancel</Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(["name", "email", "password", "roll_number", "class_name", "phone"] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {field.replace("_", " ")}
                </label>
                <input
                  type={field === "password" ? "password" : field === "email" ? "email" : "text"}
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
              disabled={submitting}
              className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Student"}
            </button>
          </form>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
