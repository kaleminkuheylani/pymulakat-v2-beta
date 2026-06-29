"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import type { TestRunResult } from "../hooks/usePyodide";

interface TestCaseDrawerProps {
  open: boolean;
  onClose: () => void;
  results: TestRunResult[];
  /** Examples tabloyu da göster (true ise) */
  showExamples?: boolean;
  examples?: Array<{ input: any[]; expected: any; description?: string }>;
}

function formatValue(v: any): string {
  if (v === undefined) return "undefined";
  if (v === null) return "null";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export default function TestCaseDrawer({
  open,
  onClose,
  results,
  showExamples = true,
  examples = [],
}: TestCaseDrawerProps) {
  // ESC ile kapatma
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // body scroll lock
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const allPassed = total > 0 && passed === total;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer — desktop'ta sağdan, mobilde alttan */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-[#0a0e1a] border-l border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0a0e1a]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-amber-400 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-white">Test Sonuçları</h2>
                  {total > 0 && (
                    <p className={`text-xs font-mono ${allPassed ? "text-green-400" : "text-amber-400"}`}>
                      {passed}/{total} test geçti {allPassed && "🎉"}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white transition-colors p-2 flex-shrink-0"
                aria-label="Kapat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {results.length === 0 && examples.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-white/30 text-center py-12">
                  <span className="text-5xl mb-3">🧪</span>
                  <p className="text-sm">Henüz test çalıştırılmadı.</p>
                  <p className="text-xs mt-1">"Çalıştır" butonuna bas.</p>
                </div>
              )}

              {/* Examples */}
              {showExamples && examples.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold px-1">
                    Örnekler ({examples.length})
                  </div>
                  {examples.map((tc, idx) => (
                    <div
                      key={`ex-${idx}`}
                      className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                        <span className="text-xs font-semibold text-white/80">
                          Örnek #{idx + 1}
                        </span>
                      </div>
                      <div className="p-3 space-y-2">
                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-white/40 mb-1 font-bold">
                            📥 Input
                          </div>
                          <pre className="text-[11px] font-mono text-white/70 bg-black/30 p-2 rounded overflow-x-auto">
                            {formatValue(tc.input)}
                          </pre>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-white/40 mb-1 font-bold">
                            ✓ Expected
                          </div>
                          <pre className="text-[11px] font-mono text-green-400/80 bg-black/30 p-2 rounded overflow-x-auto">
                            {formatValue(tc.expected)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Test Results */}
              {results.length > 0 && (
                <div className="space-y-2">
                  {results.length > 0 && examples.length > 0 && (
                    <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold px-1 pt-2">
                      Senin Çıktıların ({results.length})
                    </div>
                  )}
                  {results.map((r, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border overflow-hidden ${
                        r.passed
                          ? "bg-green-500/5 border-green-500/30"
                          : "bg-red-500/5 border-red-500/30"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between px-3 py-2 border-b ${
                          r.passed ? "border-green-500/20" : "border-red-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              r.passed
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {r.passed ? "✓" : "✗"}
                          </span>
                          <span className="text-xs font-semibold">Test #{r.test_number}</span>
                        </div>
                        <span
                          className={`text-[9px] uppercase font-bold tracking-wider ${
                            r.passed ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {r.passed ? "Geçti" : "Başarısız"}
                        </span>
                      </div>
                      <div className="p-2.5 space-y-2">
                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-white/40 mb-0.5 font-bold">
                            📥 Input
                          </div>
                          <pre className="text-[11px] font-mono text-white/70 bg-black/30 p-1.5 rounded overflow-x-auto">
                            {formatValue(r.input)}
                          </pre>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-white/40 mb-0.5 font-bold">
                            ✓ Expected
                          </div>
                          <pre className="text-[11px] font-mono text-green-400/80 bg-black/30 p-1.5 rounded overflow-x-auto">
                            {formatValue(r.expected)}
                          </pre>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-white/40 mb-0.5 font-bold">
                            {r.passed ? "✓" : "✗"} Actual
                          </div>
                          <pre
                            className={`text-[11px] font-mono bg-black/30 p-1.5 rounded overflow-x-auto ${
                              r.error ? "text-red-300" : r.passed ? "text-green-400/80" : "text-amber-300"
                            }`}
                          >
                            {r.error || formatValue(r.output)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}