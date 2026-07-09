"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";

interface DailyStats {
  date: string;
  present: number;
  total: number;
}

interface AttendanceStats {
  total_students: number;
  total_records: number;
  today_present: number;
  today_absent: number;
  daily: DailyStats[];
}

export default function ReportsPage() {
  const { data: stats, isLoading } = useQuery<AttendanceStats>({
    queryKey: ["attendance", "stats"],
    queryFn: () => api.get("/attendance/stats").then((r) => r.data),
  });

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppLayout>
        <div className="p-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Reports</h1>
          <p className="text-sm text-gray-400 mb-6">Attendance overview and statistics</p>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="rounded-xl border border-gray-100 bg-white p-5">
                  <div className="text-2xl font-bold text-gray-900">{stats?.total_students ?? "---"}</div>
                  <div className="text-sm text-gray-400 mt-1">Total Students</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-5">
                  <div className="text-2xl font-bold text-gray-900">{stats?.total_records ?? "---"}</div>
                  <div className="text-sm text-gray-400 mt-1">Total Records</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-5">
                  <div className="text-2xl font-bold text-gray-900">{stats?.today_present ?? "---"}</div>
                  <div className="text-sm text-gray-400 mt-1">Present Today</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-5">
                  <div className="text-2xl font-bold text-gray-900">{stats?.today_absent ?? "---"}</div>
                  <div className="text-sm text-gray-400 mt-1">Absent Today</div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white">
                <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-900 text-sm">Last 30 Days</div>
                <div className="divide-y divide-gray-50">
                  {stats?.daily.filter((d) => d.present > 0).length ? (
                    [...stats.daily].reverse().map((d) => (
                      <div key={d.date} className="px-5 py-3 flex items-center justify-between text-sm">
                        <span className="text-gray-900 font-medium">{d.date}</span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-gray-900" />
                            <span className="text-gray-600">{d.present} present</span>
                          </div>
                          <span className="text-gray-400">
                            {d.total > 0 ? `${Math.round((d.present / d.total) * 100)}%` : "---"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-gray-400">No attendance records in the last 30 days</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
