"use client";

import { useEffect, useState, useRef, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../../../hooks/useUser";
import { GuestBanner } from "../../../../components/GuestBanner";
import {
  questionsAPI,
  Question,
  QuestionTests,
} from "../../../../api/v2/questions";
import { CodeEditor, CodeEditorRef } from "../../../../components/Editor";
import { usePyodide, TestRunResult } from "../../../../hooks/usePyodide";
import { toast, Toaster } from "sonner";

type Tab = "question" | "workspace" | "tests";

interface Props {
  initialParams?: { category: string; id: string };
}

// ─── Helpers ──────────────────────────────────────────────
function useTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return seconds;
}

const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

const formatValue = (v: any): string => {
  if (v === undefined) return "undefined";
  if (v === null) return "null";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

const TestCard = memo(function TestCard({ result, index }: { result: TestRunResult; index: number }) {
  const isPassed = result.passed;
  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isPassed ? "bg-green-500/5 border-green-500/30" : "bg-red-500/5 border-red-500/30"
      }`}
    >
      <div
        className={`flex items-center justify-between px-3 py-2 border-b ${
          isPassed ? "border-green-500/20" : "border-red-500/20"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isPassed ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            }`}
          >
            {isPassed ? "✓" : "✗"}
          </span>
          <span className="text-xs font-semibold">Test #{index + 1}</span>
        </div>
        <span
          className={`text-[9px] uppercase font-bold tracking-wider ${
            isPassed ? "text-green-400" : "text-red-400"
          }`}
        >
          {isPassed ? "Geçti" : "Başarısız"}
        </span>
      </div>

      <div className="p-2.5 space-y-2">
        <Row label="📥 Input" value={result.input} />
        <Row label="✓ Expected" value={result.expected} />
        <Row label={`${isPassed ? "✓" : "✗"} Actual`} value={result.error || result.output} />
      </div>
    </div>
  );
});

const Row = memo(function Row({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-white/40 mb-0.5 font-bold">
        {label}
      </div>
      <pre className="text-[11px] font-mono text-white/70 bg-black/30 p-1.5 rounded overflow-x-auto">
        {formatValue(value)}
      </pre>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
export default function WorkspaceMobileClient({ initialParams }: Props) {
  // ✅ Guard 1
  if (!initialParams || !initialParams.category || !initialParams.id) {
    return (
      <div className="h-screen bg-[#050816] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-white/40 text-xs">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const { category, id } = initialParams;
  const questionId = parseInt(id, 10);

  // ✅ Guard 2
  if (isNaN(questionId)) {
    return (
      <div className="h-screen bg-[#050816] flex items-center justify-center">
        <p className="text-red-400 text-sm">Geçersiz soru ID</p>
      </div>
    );
  }

  // ✅ Hooks (tek sefer, sabit sıra)
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { status: pyStatus, runTests } = usePyodide();
  const seconds = useTimer();

  // ✅ State
  const [interview, setInterview] = useState<Question | null>(null);
  const [testCases, setTestCases] = useState<QuestionTests | null>(null);
  const [code, setCode] = useState("");
  const [results, setResults] = useState<TestRunResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("question");
  const [running, setRunning] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [hintsList, setHintsList] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const editorRef = useRef<CodeEditorRef>(null);
  const submittedRef = useRef(false);

  // ❌ ESKİ: Auth redirect kaldırıldı — misafir de sayfayı görebilir
  // Sadece user loading durumunu bekliyoruz, zorla yönlendirme yok.

  // ✅ v2 API fetch — misafir için de çalışsın (test cases opsiyonel)
  useEffect(() => {
    if (userLoading) return;
    // ❌ if (!user) { router.push... return; } — silindi, misafir de görebilir

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (!cancelled) setError("İstek zaman aşımına uğradı (15s)");
    }, 15000);

    (async () => {
      try {
        console.log("🔄 Loading question:", questionId);

        const q = await questionsAPI.getById(questionId, { includeStarter: true });
        if (cancelled) return;

        console.log("✅ Got question:", q);

        if (!q || !q.id) {
          setError("Soru bulunamadı");
          return;
        }

        setInterview(q);
        setCode(q.starter_code || "");
        editorRef.current?.setValue(q.starter_code || "");

        const hintList = extractHints(q.description);
        setHintsList(hintList);

        // Test cases — auth gerekirse sessizce null kalır
        try {
          const tc = await questionsAPI.getTests(questionId);
          if (!cancelled) setTestCases(tc);
        } catch (tcErr) {
          console.warn("⚠️ Test cases alınamadı (misafir olabilir):", tcErr);
        }
      } catch (err: any) {
        console.error("❌ Load error:", err);
        if (!cancelled) {
          setError(err?.message || "Soru yüklenemedi");
          toast.error(err?.message || "Yükleme hatası");
        }
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) {
          setLoading(false);
          console.log("✓ Loading complete");
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [questionId, category, userLoading, router]); // ❌ 'user' dependency kaldırıldı

  const revealNextHint = () => {
    if (hintCount < hintsList.length) {
      setHintCount((c) => c + 1);
    }
  };

  const handleNextQuestion = useCallback(() => {
    if (category && questionId && !isNaN(questionId)) {
      router.push(`/interviews/${category}/${questionId + 1}`);
    }
  }, [router, category, questionId]);

  const handleBackToList = useCallback(() => {
    if (category) {
      router.push(`/interviews/${category}`);
    } else {
      router.push("/interviews");
    }
  }, [router, category]);

  // 🆕 Auth gate: misafir ise /login'e yönlendir
  const handleRun = useCallback(async () => {
    if (!user) {
      const redirect = encodeURIComponent(`/interviews/${category}/${id}`);
      router.push(`/login?returnUrl=${redirect}&reason=guest_run_code`);
      return;
    }

    if (!testCases || running || pyStatus !== "ready") return;

    setRunning(true);
    setResults([]);
    setTab("tests");

    try {
      const currentCode = editorRef.current?.getValue() || code;
      const { results: res, duration_ms } = await runTests(
        currentCode,
        testCases.function_name,
        testCases.test_cases
      );
      setResults(res);

      const passed = res.filter((r) => r.passed).length;
      const total = res.length;
      const allPassed = total > 0 && passed === total;

      if (!submittedRef.current && total > 0 && user) {
        submittedRef.current = true;
        try {
          await submitAttempt({
            user_id: user.id,
            question_id: questionId,
            user_code: currentCode,
            passed_tests: passed,
            total_tests: total,
            success: allPassed,
            execution_time_ms: duration_ms,
            hints_used: hintCount,
          });
          if (allPassed) setShowSuccess(true);
        } catch (subErr) {
          console.warn("⚠️ Attempt kaydedilemedi:", subErr);
        }
      } else if (allPassed) {
        setShowSuccess(true);
      }
    } catch (err: any) {
      toast.error(err?.message || "Çalıştırma hatası");
    } finally {
      setRunning(false);
    }
  }, [testCases, code, running, pyStatus, runTests, questionId, user, hintCount, category, id, router]);

  // ✅ Render guards
  if (loading || userLoading) {
    return (
      <div className="h-screen bg-[#050816] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-white/40 text-xs">Soru yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="h-screen bg-[#050816] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">
            {error || "Soru bulunamadı"}
          </p>
          <button
            onClick={() => router.push(`/interviews/${category}`)}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
          >
            Listeye Dön
          </button>
        </div>
      </div>
    );
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const allPassed = total > 0 && passed === total;
  const isGuest = !user && !userLoading;

  return (
    <div className="h-screen bg-[#050816] text-white flex flex-col overflow-hidden">
      <Toaster />

      {/* 🆕 Misafir banner'ı — header'dan hemen önce */}
      {isGuest && <GuestBanner feature="kod çalıştırma" />}

      <header className="h-12 border-b border-white/5 bg-[#0a0e1a]/90 backdrop-blur flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={handleBackToList}
            className="text-white/60 hover:text-white flex-shrink-0"
            aria-label="Geri"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs font-bold truncate">{interview.title}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-mono text-white/60">{formatTime(seconds)}</span>
          <span
            className={`w-2 h-2 rounded-full ${
              pyStatus === "ready" ? "bg-green-400" : "bg-amber-400 animate-pulse"
            }`}
          />
        </div>
      </header>

      <div className="flex border-b border-white/5 bg-[#0f0f11] flex-shrink-0">
        {([
          { k: "question" as const, i: "📄", l: "Soru" },
          { k: "workspace" as const, i: "💻", l: "Kod" },
          { k: "tests" as const, i: "🧪", l: `Tests ${total ? `${passed}/${total}` : ""}` },
        ]).map(({ k, i, l }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
              tab === k ? "text-white" : "text-white/40"
            }`}
          >
            <span className="sm:hidden">{i}</span>
            <span className="hidden sm:inline">{l}</span>
            {tab === k && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-500" />}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-hidden relative">
        {tab === "question" && (
          <div className="h-full overflow-auto p-4 space-y-3 pb-20">
            <h1 className="text-lg font-bold">{interview.title}</h1>
            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
              {interview.description}
            </p>

            {testCases && (
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-[11px]">
                <span className="text-white/40">Fonksiyon: </span>
                <code className="text-amber-400 font-mono">def {testCases.function_name}(...)</code>
              </div>
            )}

            {/* 🆕 Misafir için test case yok bilgilendirmesi */}
            {!testCases && isGuest && (
              <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                <p className="text-[11px] text-indigo-200/80">
                  🔒 Test caseleri görmek için{" "}
                  <a
                    href={`/login?returnUrl=${encodeURIComponent(`/interviews/${category}/${id}`)}`}
                    className="underline font-semibold text-indigo-300"
                  >
                    giriş yap
                  </a>.
                </p>
              </div>
            )}

            {hintsList.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">
                    💡 İpuçları ({hintCount}/{hintsList.length})
                  </span>
                  {hintCount < hintsList.length && (
                    <button
                      onClick={revealNextHint}
                      className="text-[10px] px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400"
                    >
                      Göster
                    </button>
                  )}
                </div>
                {hintsList.slice(0, hintCount).map((h, i) => (
                  <div
                    key={i}
                    className="p-2 rounded bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-100/80"
                  >
                    <span className="text-amber-400 font-semibold mr-1">#{i + 1}</span>
                    {String(h).replace(/^💡\s*İpucu\s*\d+:\s*/i, "")}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "workspace" && (
          <div className="h-full pb-20">
            <CodeEditor ref={editorRef} value={code} onChange={setCode} height="100%" language="python" />
          </div>
        )}

        {tab === "tests" && (
          <div className="h-full overflow-auto p-2.5 pb-20 space-y-2.5">
            {total === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-white/30">
                {isGuest ? (
                  <>
                    <p className="text-xs">🔒 Çalıştırmak için giriş yap</p>
                    <a
                      href={`/login?returnUrl=${encodeURIComponent(`/interviews/${category}/${id}`)}`}
                      className="text-[10px] px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400"
                    >
                      Giriş Yap
                    </a>
                  </>
                ) : (
                  <p className="text-xs">▶ butonuna bas</p>
                )}
              </div>
            ) : (
              <>
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    allPassed ? "bg-green-500/10 border-green-500/30" : "bg-amber-500/5 border-amber-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{allPassed ? "🎉" : "📊"}</span>
                    <div>
                      <div className="text-sm font-bold">
                        {passed}/{total} Geçti
                      </div>
                    </div>
                  </div>
                </div>
                {results.map((r, i) => (
                  <TestCard key={i} result={r} index={i} />
                ))}
              </>
            )}
          </div>
        )}
      </main>

      {/* 🆕 Misafir ise farklı görünüm (kilit ikonu) */}
      <button
        onClick={handleRun}
        disabled={running || pyStatus !== "ready"}
        className={`fixed bottom-4 right-4 z-30 w-14 h-14 rounded-full shadow-2xl transition-all flex items-center justify-center ${
          running || pyStatus !== "ready"
            ? "bg-white/10 text-white/30"
            : isGuest
            ? "bg-amber-500/10 border-2 border-amber-400/40 text-amber-400 active:scale-95"
            : "bg-gradient-to-br from-amber-400 to-amber-500 text-[#050816] active:scale-95"
        }`}
        aria-label={isGuest ? "Çalıştırmak için giriş yap" : "Çalıştır"}
      >
        {running ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : isGuest ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="5" y="11" width="14" height="10" rx="2" strokeWidth="2" />
            <path d="M8 11V7a4 4 0 018 0v4" strokeWidth="2" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="6 4 20 12 6 20 6 4" />
          </svg>
        )}
      </button>

      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end p-4">
          <div className="bg-[#0a0e1a] border border-green-500/30 rounded-2xl p-5 w-full max-w-sm">
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl mb-2">🏆</div>
              <h2 className="text-lg font-bold mb-1">Tebrikler!</h2>
              <p className="text-white/50 text-xs mb-4">Tüm testler geçti</p>
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleBackToList}
                  className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-medium"
                >
                  Liste
                </button>
                <button
                  onClick={handleNextQuestion}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold"
                >
                  Sonraki →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function extractHints(description: string): string[] {
  if (!description) return [];
  const matches = description.match(/💡\s*İpucu\s*\d+:.*?(?=💡|$)/g);
  return matches || [];
}

async function submitAttempt(payload: any): Promise<void> {
  const token = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("sb-gozbegim-auth-token") || "{}")?.access_token
    : null;

  if (!token) return;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v2/attempts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    throw new Error(`Attempt gönderilemedi: ${res.status}`);
  }
}