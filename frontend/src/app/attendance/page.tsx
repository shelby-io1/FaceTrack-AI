"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";

interface RecognizeResult {
  student_id: number | null;
  name: string | null;
  roll_number: string | null;
  confidence: number | null;
  recognized: boolean;
}

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

export default function AttendancePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [result, setResult] = useState<RecognizeResult | null>(null);
  const [error, setError] = useState("");
  const [autoMode, setAutoMode] = useState(false);
  const [markedIds, setMarkedIds] = useState<Set<number>>(new Set());

  const { data: todayRecords, refetch: refetchToday } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "today"],
    queryFn: () => api.get("/attendance/today").then((r) => r.data),
    enabled: cameraOn,
    refetchInterval: 10000,
  });

  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera API not supported in this browser");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setCameraOn(true);
    } catch (err) {
      const msg = err instanceof DOMException
        ? err.name === "NotAllowedError"
          ? "Camera permission denied. Allow camera access and try again."
          : err.name === "NotFoundError"
            ? "No camera found on this device"
            : err.name === "NotReadableError"
              ? "Camera is in use by another application"
              : `Camera error: ${err.message}`
        : "Camera access denied or unavailable";
      setCameraError(msg);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
    setAutoMode(false);
    setResult(null);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const recognizeMutation = useMutation({
    mutationFn: async (image: string) => {
      const res = await api.post<RecognizeResult>("/recognition/recognize", { image });
      return res.data;
    },
  });

  const markMutation = useMutation({
    mutationFn: async (data: { student_id: number; confidence: number | null }) => {
      await api.post("/attendance/mark", data);
    },
    onSuccess: () => {
      refetchToday();
    },
  });

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.9).split(",")[1];
    recognizeMutation.mutate(base64, {
      onSuccess: (data) => {
        setResult(data);
        setError("");
        if (data.recognized && data.student_id && !markedIds.has(data.student_id)) {
          markMutation.mutate(
            { student_id: data.student_id, confidence: data.confidence },
            {
              onSuccess: () => {
                setMarkedIds((prev) => new Set(prev).add(data.student_id!));
              },
              onError: (err: unknown) => {
                if (err && typeof err === "object" && "response" in err) {
                  const axiosErr = err as { response?: { data?: { detail?: string } } };
                  if (axiosErr.response?.data?.detail === "Attendance already marked for today") {
                    setMarkedIds((prev) => new Set(prev).add(data.student_id!));
                  }
                }
              },
            }
          );
        }
      },
      onError: (err: unknown) => {
        if (err && typeof err === "object" && "response" in err) {
          const axiosErr = err as { response?: { data?: { detail?: string } } };
          setError(axiosErr.response?.data?.detail || "Recognition failed");
        } else {
          setError("Recognition failed");
        }
      },
    });
  }, [recognizeMutation, markMutation, markedIds]);

  const toggleAuto = () => {
    if (autoMode) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setAutoMode(false);
    } else {
      setAutoMode(true);
      capture();
      intervalRef.current = setInterval(capture, 3000);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "teacher"]}>
      <AppLayout>
        <div className="p-6 max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mark Attendance</h1>
          <p className="text-sm text-gray-400 mb-6">
            Point camera at student face to automatically mark attendance
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-4">
              {!cameraOn ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-16">
                  {cameraError && <p className="text-sm text-red-500 mb-4">{cameraError}</p>}
                  <button
                    onClick={startCamera}
                    className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Start Camera
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full aspect-[4/3] object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {result && (
                      <div
                        className={`absolute top-4 right-4 rounded-lg px-3 py-1.5 text-sm font-medium ${
                          result.recognized
                            ? "bg-gray-900 text-white"
                            : "bg-white text-gray-500"
                        }`}
                      >
                        {result.recognized
                          ? `${result.confidence}%`
                          : "No match"}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={capture}
                      disabled={recognizeMutation.isPending}
                      className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      {recognizeMutation.isPending ? "Processing..." : "Capture"}
                    </button>
                    <button
                      onClick={toggleAuto}
                      className={`rounded-lg px-5 py-2 text-sm font-medium border ${
                        autoMode
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {autoMode ? "Auto: ON" : "Auto: OFF"}
                    </button>
                    <button
                      onClick={stopCamera}
                      className="text-sm text-gray-400 hover:text-gray-600 ml-auto"
                    >
                      Stop Camera
                    </button>
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  {result && (
                    <div className="rounded-xl border border-gray-100 bg-white p-5">
                      {result.recognized ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{result.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{result.roll_number}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400">Confidence</span>
                            <p className="text-sm font-medium text-gray-900">
                              {(result.confidence! * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 text-center">No face recognized</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <div className="rounded-xl border border-gray-100 bg-white">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Today&apos;s Attendance</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {todayRecords?.length ?? 0} students marked
                  </p>
                </div>
                <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                  {todayRecords?.length ? (
                    todayRecords.map((r) => (
                      <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{r.name}</p>
                          <p className="text-xs text-gray-400">{r.roll_number}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400">
                            {r.confidence ? `${(r.confidence * 100).toFixed(1)}%` : "—"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-gray-300">
                      No attendance marked yet today
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
