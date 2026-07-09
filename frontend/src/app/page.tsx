"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppLayout from "@/components/AppLayout";

interface Student {
  id: number;
  name: string;
  roll_number: string;
}

interface AttendanceRecord {
  id: number;
  student_id: number;
  name: string;
  date: string;
  status: string;
  confidence: number | null;
  recognized_at: string;
}

export default function Home() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["health"],
    queryFn: () => api.get("/health").then((res) => res.data),
    refetchInterval: 30000,
    enabled: !authLoading,
  });

  const role = user?.role;

  const { data: students } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: () => api.get("/students/").then((r) => r.data),
    enabled: !!isAuthenticated && (role === "admin" || role === "teacher"),
  });

  const { data: todayRecords } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "today"],
    queryFn: () => api.get("/attendance/today").then((r) => r.data),
    enabled: !!isAuthenticated && (role === "admin" || role === "teacher"),
  });

  const { data: myRecords, error: myError } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "my"],
    queryFn: () => api.get("/attendance/my").then((r) => r.data),
    enabled: !!isAuthenticated && role === "student",
  });

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-semibold text-gray-900">FaceTrack AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">Sign In</Link>
            <Link href="/register" className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800">Register</Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center mb-6">
            <span className="text-white text-xl font-bold">F</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">FaceTrack AI</h1>
          <p className="text-lg text-gray-500 max-w-md mb-8">
            AI-Powered Smart Attendance Management System
          </p>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-100 mb-10">
            <div className={`h-2 w-2 rounded-full ${healthLoading ? "bg-gray-300" : !health ? "bg-gray-400" : "bg-gray-900"}`} />
            <span className="text-sm text-gray-500">
              {healthLoading ? "Connecting..." : !health ? "Unavailable" : `${health.service} --- DB: ${health.database}`}
            </span>
          </div>
        </main>
      </div>
    );
  }

  const todayPresent = todayRecords?.filter((r) => r.status === "present").length ?? 0;
  const todayAbsent = students ? students.length - (todayRecords?.length ?? 0) : 0;
  const absentStudents = students?.filter(
    (s) => !todayRecords?.some((r) => r.student_id === s.id)
  ) ?? [];

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mb-6">Welcome, {user?.name}</p>
        </div>

        <div className="flex-1">
        {role === "admin" || role === "teacher" ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <div className="text-2xl font-bold text-gray-900">{students?.length ?? "---"}</div>
                <div className="text-sm text-gray-400 mt-1">Total Students</div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <div className="text-2xl font-bold text-gray-900">{todayPresent}</div>
                <div className="text-sm text-gray-400 mt-1">Present Today</div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <div className="text-2xl font-bold text-gray-900">{todayAbsent}</div>
                <div className="text-sm text-gray-400 mt-1">Absent Today</div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <div className="text-2xl font-bold text-gray-900">
                  {students?.length ? `${Math.round((todayPresent / students.length) * 100)}%` : "---"}
                </div>
                <div className="text-sm text-gray-400 mt-1">Attendance Rate</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-gray-100 bg-white">
                <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-900 text-sm flex items-center justify-between">
                  <span>Recently Marked</span>
                  <span className="text-xs text-gray-400 font-normal">{todayRecords?.length ?? 0} total</span>
                </div>
                {todayRecords && todayRecords.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {todayRecords.slice(0, 6).map((r) => (
                      <div key={r.id} className="px-5 py-3 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-full bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-700">
                            {r.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-gray-900 font-medium">{r.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-xs">{new Date(r.recognized_at).toLocaleTimeString()}</span>
                          {r.confidence !== null && (
                            <span className="text-xs text-gray-400">{(r.confidence * 100).toFixed(0)}%</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-gray-400">No attendance marked today</div>
                )}
              </div>

              <div className="rounded-xl border border-gray-100 bg-white">
                <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-900 text-sm flex items-center justify-between">
                  <span>Absent Today</span>
                  <span className="text-xs text-gray-400 font-normal">{absentStudents.length} students</span>
                </div>
                {absentStudents.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {absentStudents.slice(0, 6).map((s) => (
                      <div key={s.id} className="px-5 py-3 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-full bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-700">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-gray-900 font-medium">{s.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">{s.roll_number}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-gray-400">
                    {students?.length ? "All students are present today" : "No students enrolled"}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {myError ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center mb-8">
                <p className="text-gray-400">You haven&apos;t been enrolled yet. Contact an administrator.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="rounded-xl border border-gray-100 bg-white p-5">
                    <div className="text-2xl font-bold text-gray-900">{myRecords?.length ?? "---"}</div>
                    <div className="text-sm text-gray-400 mt-1">Total Records</div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-5">
                    <div className="text-2xl font-bold text-gray-900">
                      {myRecords ? myRecords.filter((r) => r.status === "present").length : "---"}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">Present</div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-5">
                    <div className="text-2xl font-bold text-gray-900">
                      {myRecords?.length ? `${Math.round((myRecords.filter((r) => r.status === "present").length / myRecords.length) * 100)}%` : "---"}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">Attendance Rate</div>
                  </div>
                </div>

                {myRecords && myRecords.length > 0 && (
                  <div className="rounded-xl border border-gray-100 bg-white">
                    <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-900 text-sm">Recent Activity</div>
                    <div className="divide-y divide-gray-50">
                      {myRecords.slice(0, 5).map((r) => (
                        <div key={r.id} className="px-5 py-3 flex items-center justify-between text-sm">
                          <span className="text-gray-900 font-medium">{r.date}</span>
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        </div>

        <div className="mt-auto flex items-center gap-2 px-4 py-3 rounded-full bg-gray-50 border border-gray-100 text-sm w-fit">
          <div className={`h-2 w-2 rounded-full ${healthLoading ? "bg-gray-300" : !health ? "bg-gray-400" : "bg-gray-900"}`} />
          <span className="text-gray-500">
            {healthLoading ? "Connecting..." : !health ? "Unavailable" : `${health.service} --- DB: ${health.database}`}
          </span>
        </div>
      </div>
    </AppLayout>
  );
}
