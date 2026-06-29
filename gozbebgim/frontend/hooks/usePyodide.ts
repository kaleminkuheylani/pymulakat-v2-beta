// hooks/usePyodide.ts — FIXED VERSION (çoklu çalıştırma)
import { useState, useEffect, useRef, useCallback } from "react";

export type PyodideStatus = "idle" | "loading" | "ready" | "running" | "error";

export interface TestCase {
  input: any;
  expected: any;
}

export interface TestRunResult {
  test_number: number;
  passed: boolean;
  input?: any;
  expected?: any;
  output?: any;
  error?: string;
  duration_ms: number;
}

export interface PyodideRunResult {
  results: TestRunResult[];
  duration_ms: number;
  output: string;
}

export interface UsePyodideReturn {
  status: PyodideStatus;
  errorMsg: string | null;
  runTests: (
    userCode: string,
    functionName: string,
    testCases: TestCase[]
  ) => Promise<PyodideRunResult>;
}

const PYODIDE_VERSION = "v0.25.0";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;
const PYODIDE_SCRIPT_URL = `${PYODIDE_CDN}pyodide.js`;

declare global {
  interface Window {
    loadPyodide?: (config: any) => Promise<any>;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Document not available (SSR)"));
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing && typeof window.loadPyodide === "function") {
      resolve();
      return;
    }
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if (typeof window.loadPyodide === "function") resolve();
      else reject(new Error("loadPyodide bulunamadı"));
    };
    script.onerror = () => reject(new Error(`Script yüklenemedi: ${src}`));
    document.head.appendChild(script);
  });
}

// ─── Deep equality for test outputs ────────────────────────────
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════
export function usePyodide(): UsePyodideReturn {
  const [status, setStatus] = useState<PyodideStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pyodideRef = useRef<any>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null); // ✅ Single init

  // ─── Init Pyodide (sadece 1 kez) ──────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setStatus("loading");
      try {
        await loadScript(PYODIDE_SCRIPT_URL);
        if (cancelled) return;
        if (!window.loadPyodide) throw new Error("loadPyodide yok");
        const py = await window.loadPyodide({
          indexURL: PYODIDE_CDN,
          fullStdLib: false,
        });
        if (cancelled) return;
        pyodideRef.current = py;
        setStatus("ready");
      } catch (err: any) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(err.message);
        }
      }
    };

    initPromiseRef.current = init();
    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ FIX: useCallback dependency'sine setStatus eklemeden, ref kullan
  const runTests = useCallback(
    async (
      userCode: string,
      functionName: string,
      testCases: TestCase[]
    ): Promise<PyodideRunResult> => {
      // ✅ Init tamamlanmamışsa bekle
      if (initPromiseRef.current) {
        await initPromiseRef.current;
      }

      const py = pyodideRef.current;
      if (!py) throw new Error("Pyodide yüklenmedi");

      setStatus("running");
      setErrorMsg(null);

      const startTime = performance.now();
      const results: TestRunResult[] = [];
      let consoleOutput = "";

      try {
        // Her çalıştırmada temiz stdout
        py.setStdout({
          batched: (s: string) => {
            consoleOutput += s + "\n";
          },
        });
        py.setStderr({
          batched: (s: string) => {
            consoleOutput += s + "\n";
          },
        });

        // Önceki globals'ı temizle (kritik!)
        try {
          py.runPython(`
import sys
if '__test_input__' in dir(): del __test_input__
for _name in list(dir()):
    if not _name.startswith('_') and _name not in ('sys', 'builtins'):
        try:
            del globals()[_name]
        except: pass
          `);
        } catch {}

        // Kullanıcı kodunu çalıştır
        try {
          py.runPython(userCode);
        } catch (syntaxErr: any) {
          setStatus("ready");
          throw new Error(`Syntax hatası: ${syntaxErr.message}`);
        }

        // Her test case'i çalıştır
        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i];
          try {
            py.globals.set("__test_input__", py.toPy(tc.input));

            let callCode: string;
            const isDictObject =
              typeof tc.input === "object" &&
              tc.input !== null &&
              !Array.isArray(tc.input);

            if (isDictObject) {
              // ✅ Dict unpack: önce Python'a dict olarak okut
              const kwargsJson = JSON.stringify(tc.input);
              py.runPython(`__kwargs__ = ${kwargsJson.replace(/'/g, "\\'")}`);
              callCode = `${functionName}(**__kwargs__)`;
            } else if (Array.isArray(tc.input)) {
              const args = tc.input.map((v) => JSON.stringify(v)).join(", ");
              callCode = `${functionName}(${args})`;
            } else {
              const arg =
                typeof tc.input === "string"
                  ? JSON.stringify(tc.input)
                  : String(tc.input);
              callCode = `${functionName}(${arg})`;
            }

            const pyResult = py.runPython(callCode);

            let jsOutput: any;
            if (pyResult === undefined || pyResult === null) {
              jsOutput = null;
            } else if (typeof pyResult.toJs === "function") {
              jsOutput = pyResult.toJs({ dict_converter: Object.fromEntries });
              if (typeof pyResult.destroy === "function") pyResult.destroy();
            } else {
              jsOutput = pyResult;
            }

            // ✅ Pass kontrolü: deep equality
            const passed = deepEqual(jsOutput, tc.expected);

            const testStartMs = performance.now();
            results.push({
              test_number: i + 1,
              passed,
              input: tc.input,
              expected: tc.expected,
              output: jsOutput,
              duration_ms: Math.round(performance.now() - testStartMs),
            });
          } catch (err: any) {
            results.push({
              test_number: i + 1,
              passed: false,
              input: tc.input,
              expected: tc.expected,
              error: err.message || String(err),
              duration_ms: 0,
            });
          }
        }

        const duration_ms = Math.round(performance.now() - startTime);
        setStatus("ready"); // ✅ Ready'ye geri dön (kritik!)
        return { results, duration_ms, output: consoleOutput.trim() };
      } catch (err: any) {
        setStatus("ready"); // ✅ Hata olsa bile ready'ye dön
        setErrorMsg(err.message);
        const duration_ms = Math.round(performance.now() - startTime);
        return {
          results: [
            { test_number: 1, passed: false, error: err.message, duration_ms },
          ],
          duration_ms,
          output: consoleOutput.trim() || err.message,
        };
      }
    },
    [] // ✅ Boş dependency — ref kullanıyoruz
  );

  return { status, errorMsg, runTests };
}
