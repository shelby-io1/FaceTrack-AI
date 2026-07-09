"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";

interface AttendanceRecord {
  id: number;
  student_id: number;
  name: string;
  roll_number: string;
  date: string;
  status: string;
  confidence: number | null;
  recognized_at: string;
}

export default function MyAttendancePage() {
  const { user } = useAuth();

  const { data: records, isLoading, error } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "my"],
    queryFn: () => api.get("/attendance/my").then((r) => r.data),
  });

  const isEnrolled = user?.role === "student";

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppLayout>
        <div className="p-6 max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Attendance</h1>
          <p className="text-sm text-gray-400 mb-6">Your attendance history</p>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-gray-200 bg-white">
              <p className="text-gray-400">You haven&apos;t been enrolled yet. Contact an administrator.</p>
            </div>
          ) : !records?.length ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-gray-200 bg-white">
              <p className="text-gray-400">No attendance records yet</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-600">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Confidence</th>
                    <th className="px-4 py-3 font-medium">Recognized At</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.date}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {r.confidence ? `${(r.confidence * 100).toFixed(1)}%` : "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(r.recognized_at).toLocaleString()}
                      </td>
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
