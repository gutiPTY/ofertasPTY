"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ToastType = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<((message: string, type?: ToastType) => void) | null>(null);

const DURATION_MS = 3500;
let nextId = 0;

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-success">
      <path d="M4 10.5l3.5 3.5L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-critical">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6.5v4.2M10 13.2h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // `typeof document !== "undefined"` en el render es exactamente el
  // server/client branch que React marca como causa #1 de mismatch de
  // hidratación (Lighthouse: errors-in-console, React #418): en SSR
  // `document` no existe y no renderiza nada, en el cliente sí existe y
  // renderiza el portal — servidor y cliente producen HTML distinto en el
  // mismo pase. `mounted` en cambio arranca en `false` en los dos lados
  // (SSR y primera hidratación coinciden), y solo después de montar en el
  // cliente pasa a `true` y aparece el portal, ya fuera de la
  // reconciliación de hidratación.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                role="status"
                className={`flex w-full max-w-sm items-center gap-2.5 rounded-2xl border-l-4 bg-surface px-4 py-3 text-sm font-semibold text-ink shadow-lg ${
                  toast.type === "success" ? "border-success" : "border-critical"
                }`}
              >
                {toast.type === "success" ? <CheckIcon /> : <AlertIcon />}
                {toast.message}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return showToast;
}
