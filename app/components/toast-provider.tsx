"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: "14px",
          background: "#111827",
          color: "#fff",
          boxShadow: "0 12px 30px rgba(17, 24, 39, 0.24)",
        },
        success: {
          style: {
            background: "#065f46",
          },
        },
        error: {
          style: {
            background: "#991b1b",
          },
        },
      }}
    />
  );
}