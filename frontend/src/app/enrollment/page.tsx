"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/lib/auth-context";

interface CaptureResult {
  id: number;
  captured: number;
  required: number;
  quality: number;
  pose: string;
}

const POSES = ["front", "left", "right", "up", "down"];
const CAPTURES_PER_POSE = 4;
const TOTAL_REQUIRED = 20;

function getCurrentPose(captured: number): { pose: string; poseIndex: number; remaining: number } {
  const poseIndex = Math.min(Math.floor(captured / CAPTURES_PER_POSE), POSES.length - 1);
  const pose = POSES[poseIndex];
  const inPose = captured % CAPTURES_PER_POSE;
  const remaining = CAPTURES_PER_POSE - inPose;
  return { pose, poseIndex, remaining };
}

export default function EnrollmentPage() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [captured, setCaptured] = useState(0);
  const [results, setResults] = useState<CaptureResult[]>([]);
  const [error, setError] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | "self">("self");

  const { pose, remaining } = getCurrentPose(captured);

  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera API not supported in this browser");
        return;
      }

      if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
        setCameraError("Camera access requires HTTPS. This page is not served over a secure connection.");
        return;
      }

      const perm = await navigator.permissions.query({ name: "camera" as PermissionName }).catch(() => null);
      if (perm?.state === "denied") {
        setCameraError("Camera access was previously denied. Please allow camera access in your browser settings (click the lock/info icon in the address bar) and reload the page.");
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
          ? "Camera permission denied. Allow camera access in your browser settings (click the lock/info icon in the address bar) and reload the page."
          : err.name === "NotFoundError"
            ? "No camera found on this device. Connect a camera and try again."
            : err.name === "NotReadableError"
              ? "Camera is in use by another application. Close other apps using the camera and try again."
              : `Camera error: ${err.message}`
        : "Camera access denied or unavailable";
      setCameraError(msg);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const captureMutation = useMutation({
    mutationFn: async (image: string) => {
      const studentId = selectedStudentId === "self" ? user?.id : selectedStudentId;
      const res = await api.post<CaptureResult>("/enrollment/capture", {
        student_id: studentId,
        image,
        pose,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setCaptured(data.captured);
      setResults((prev) => [data, ...prev]);
      setError("");
    },
    onError: (err: unknown) => {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setError(axiosErr.response?.data?.detail || "Capture failed");
      } else {
        setError("Capture failed");
      }
    },
  });

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.95).split(",")[1];
    captureMutation.mutate(base64);
  };

  const handleStudentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedStudentId(val === "self" ? "self" : Number(val));
  };

  const complete = captured >= TOTAL_REQUIRED;

  return (
    <ProtectedRoute allowedRoles={["admin", "teacher"]}>
      <AppLayout>
        <div className="p-6 max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Face Enrollment</h1>
          <p className="text-sm text-gray-500 mb-6">
            Capture 20 images from different angles for accurate face recognition
          </p>

          {!cameraOn ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-12">
              {cameraError && (
                <p className="text-sm text-red-500 mb-4">{cameraError}</p>
              )}
              <button
                onClick={startCamera}
                className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
              >
                Start Camera
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative rounded-xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-[4/3] object-cover"
                />
                {complete && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-4xl mb-2">✓</div>
                      <p className="text-lg font-semibold">Enrollment Complete</p>
                      <p className="text-sm text-gray-300">All 20 images captured</p>
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Progress: {captured} / {TOTAL_REQUIRED}
                  </span>
                  {!complete && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      Current pose: {pose} ({remaining} more)
                    </span>
                  )}
                </div>

                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gray-900 transition-all"
                      style={{ width: `${(captured / TOTAL_REQUIRED) * 100}%` }}
                    />
                  </div>

                <div className="flex gap-2">
                  {POSES.map((p) => {
                    const count = results.filter((r) => r.pose === p).length;
                    return (
                      <div
                        key={p}
                        className={`flex-1 text-center rounded-lg py-2 text-xs font-medium ${
                          count >= CAPTURES_PER_POSE
                            ? "bg-gray-900 text-white"
                            : pose === p
                              ? "bg-gray-100 text-gray-900"
                              : "bg-gray-50 text-gray-400"
                        }`}
                      >
                        {p}
                        <div className="text-lg font-bold">{count}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-4">
                  <select
                    value={selectedStudentId === "self" ? "self" : String(selectedStudentId)}
                    onChange={handleStudentSelect}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                  >
                    <option value="self">Self (logged-in user)</option>
                  </select>

                  {!complete && (
                    <button
                      onClick={capture}
                      disabled={captureMutation.isPending}
                      className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      {captureMutation.isPending ? "Processing..." : "Capture"}
                    </button>
                  )}
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                {complete && (
                  <button
                    onClick={stopCamera}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Done — Stop Camera
                  </button>
                )}
              </div>

              {results.length > 0 && (
                <div className="rounded-xl border bg-white">
                  <div className="px-4 py-3 border-b">
                    <h3 className="text-sm font-medium text-gray-700">Recent Captures</h3>
                  </div>
                  <div className="divide-y max-h-60 overflow-y-auto">
                    {results.slice(0, 20).map((r) => (
                      <div key={r.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                        <span className="text-gray-600 capitalize">{r.pose}</span>
                        <span className="text-gray-500">quality: {r.quality}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
