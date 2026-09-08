import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    toast: {
        success: (msg: string) => void;
        error: (msg: string) => void;
        info: (msg: string) => void;
    };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, type, message }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const toast = {
        success: (msg: string) => addToast(msg, "success"),
        error: (msg: string) => addToast(msg, "error"),
        info: (msg: string) => addToast(msg, "info"),
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full max-w-md px-4">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto flex items-center justify-between gap-3 w-full px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold transition-all ${
                            t.type === "success"
                                ? "bg-emerald-900 text-emerald-50 border-emerald-700"
                                : t.type === "error"
                                ? "bg-rose-900 text-rose-50 border-rose-700"
                                : "bg-slate-900 text-white border-slate-700"
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                            {t.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                            {t.type === "info" && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
                            <span className="leading-snug">{t.message}</span>
                        </div>
                        <button onClick={() => removeToast(t.id)} className="p-1 hover:opacity-75 transition-opacity shrink-0 cursor-pointer">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

