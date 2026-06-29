"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useUser } from "../../../../hooks/useUser";
import { usePyodide, TestRunResult } from "../../../../hooks/usePyodide";
import { CodeEditorMonaco as CodeEditor, CodeEditorRef } from "../../../../components/Monaco";
import { GuestBanner } from "../../../../components/GuestBanner";

import {
  questionsAPI,
  Question,
  QuestionTests,
} from "../../../../api/v2/questions";

// ─── Constants ────────────────────────────────────────────
const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  beginner: { label: "Başlangıç", color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.25)" },
  intermediate: { label: "Orta", color: "#facc15", bg: "rgba(250,204,21,0.08)", border: "rgba(250,204,21,0.25)" },
  advanced: { label: "İleri", color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)" },
  başlangıç: { label: "Başlangıç", color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.25)" },
  orta: { label: "Orta", color: "#facc15", bg: "rgba(250,204,21,0.08)", border: "rgba(250,204,21,0.25)" },
  ileri: { label: "İleri", color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)" },
};

const CATEGORY_LABELS: Record<string, string> = {
  "python-basics": "🐍 Python Temelleri",
  strings: "🔤 String İşlemleri",
  "list-dict": "📋 Liste & Sözlük",
  pandas: "🐼 Pandas",
  algorithms: "🧮 Algoritmalar",
};

interface Props {
  initialParams: { category: string; id: string };
}

interface TestCase {
  input: any[];
  expected: any;
  description?: string;
}

interface AttemptPayload {
  user_id?: string;
  question_id: number;
  user_code: string;
  passed_tests: number;
  total_tests: number;
  success: boolean;
  execution_time_ms: number;
  hints_used: number;
}

export default function WorkspaceClient({ initialParams }: Props) {
  // ✅ Guard
  if (!initialParams || !initialParams.category || !initialParams.id) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const { category, id } = initialParams;
  const questionId = parseInt(id, 10);

  // ✅ Hooks (tek sefer, sabit sıra)
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { status: pyStatus, runTests } = usePyodide();
  const editorRef = useRef<CodeEditorRef>(null);

  // ✅ State
  const [interview, setInterview] = useState<Question | null>(null);
  const [testCases, setTestCases] = useState<QuestionTests | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [testResults, setTestResults] = useState<TestRunResult[]>([]);
  const [consoleOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"tests" | "examples" | "console">("examples");

  const [revealedHints, setRevealedHints] = useState(0);
  const [hintsList, setHintsList] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [attemptSubmitted, setAttemptSubmitted] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // ✅ Timer
  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // ❌ ESKİ: Auth redirect kaldırıldı — misafir de sayfayı görebilir
  // Sadece kullanıcı yüklenmesini bekliyoruz, zorla yönlendirme yok.
  // (Eski kod: if (!user) router.push('/login...'); → silindi)

  // ✅ v2 API fetch — misafir için de soru yüklensin (sadece test cases için auth gerekebilir)
  useEffect(() => {
    if (userLoading) return;
    // ❌ if (!user) return; — bu satır silindi, misafir de soruyu görebilir

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (!cancelled) setError("İstek zaman aşımına uğradı (15s)");
    }, 15000);

    (async () => {
      try {
        console.log("🔄 Loading question:", questionId);

        // ✅ v2 API — kategorisiz
        const q = await questionsAPI.getById(questionId, { includeStarter: true });
        if (cancelled) return;

        console.log("✅ Got question:", q);

        if (!q || !q.id) {
          setError("Soru bulunamadı");
          return;
        }

        setInterview(q);
        setCode(q.starter_code || "");

        // ✅ İpuçlarını parse et
        const hintList = extractHints(q.description);
        setHintsList(hintList);

        // ✅ Test cases — misafir için de yüklemeyi dene (auth zorunluysa API 401 döner, sessizce geç)
        try {
          const tc = await questionsAPI.getTests(questionId);
          if (!cancelled) setTestCases(tc);
        } catch (tcErr) {
          console.warn("⚠️ Test cases alınamadı (misafir olabilir):", tcErr);
          // Misafir için testCases null kalır — Çalıştır butonu auth kontrolünde /login'e atar
        }
      } catch (err: any) {
        console.error("❌ Load error:", err);
        if (!cancelled) {
          setError(err?.message || "Soru yüklenemedi");
          toast.error(err?.message || "Yükleme hatası");
        }
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [questionId, userLoading]); // ❌ 'user' dependency kaldırıldı

  // Editor sync
  useEffect(() => {
    if (interview && editorRef.current && interview.starter_code) {
      editorRef.current.setValue(interview.starter_code);
    }
  }, [interview]);

  // ✅ Run tests — auth gate eklendi (misafir ise /login'e yönlendir)
  const handleRun = useCallback(async () => {
    // 🆕 Auth gate: misafir ise /login'e yönlendir
    if (!user) {
      const redirect = encodeURIComponent(`/interviews/${category}/${id}`);
      router.push(`/login?returnUrl=${redirect}&reason=guest_run_code`);
      return;
    }

    if (!testCases || !interview || isRunning) return;
    if (pyStatus !== "ready") {
      toast.error("Python ortamı henüz hazır değil.");
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    setActiveTab("examples");

    try {
      const currentCode = editorRef.current?.getValue() || code;
      const { results } = await runTests(
        currentCode,
        testCases.function_name,
        testCases.test_cases
      );

      setTestResults(results);

      const passed = results.filter((r) => r.passed).length;
      const total = results.length;
      const allPassed = total > 0 && passed === total;
      const durationMs = results.reduce((sum, r) => sum + (r.duration_ms || 0), 0);

      // ✅ Attempt gönder (sadece auth varsa)
      if (!attemptSubmitted && total > 0 && user) {
        try {
          await submitAttempt({
            user_id: user.id,
            question_id: questionId,
            user_code: currentCode,
            passed_tests: passed,
            total_tests: total,
            success: allPassed,
            execution_time_ms: durationMs,
            hints_used: revealedHints,
          });

          if (allPassed) {
            setAttemptSubmitted(true);
            setShowSuccessModal(true);
            toast.success(`+${total * 10} puan kazandın! 🎉`);
          } else {
            toast.info(`${passed}/${total} test geçti. Tekrar dene!`);
          }
        } catch (err) {
          console.warn("⚠️ Attempt kaydedilemedi:", err);
        }
      } else if (allPassed) {
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      toast.error("Kod çalıştırılamadı.");
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  }, [testCases, interview, code, isRunning, runTests, questionId, revealedHints, attemptSubmitted, pyStatus, user, category, id, router]);

  const revealNextHint = () => {
    if (revealedHints < hintsList.length) {
      setRevealedHints((n) => n + 1);
    }
  };

  const handleNextQuestion = () => {
    if (questionId && !isNaN(questionId)) {
      router.push(`/interviews/${category || "python-basics"}/${questionId + 1}`);
    }
  };
  const handleBackToList = () => {
    if (category) {
      router.push(`/interviews/${category}`);
    } else {
      router.push("/interviews");
    }
  };

  // ✅ Render guards
  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-white/40 text-sm animate-pulse">Soru yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || "Soru bulunamadı."}</p>
          <button
            onClick={() => router.push(`/interviews/${category || "python-basics"}`)}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
          >
            Listeye Dön
          </button>
        </div>
      </div>
    );
  }

  // ✅ Normal render
  const levelCfg = LEVEL_CONFIG[(interview.level || "").toLowerCase()] || LEVEL_CONFIG.beginner;
  const passedCount = testResults.filter((r) => r.passed).length;
  const totalCount = testResults.length;
  const allPassed = totalCount > 0 && passedCount === totalCount;
  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  const formattedTime = `${mm}:${ss}`;
  const isGuest = !user && !userLoading;

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col">
      {/* 🆕 Misafir banner'ı — header'dan hemen önce */}
      {isGuest && <GuestBanner feature="kod çalıştırma" />}

      <header className="h-14 border-b border-white/5 bg-[#0a0e1a]/80 backdrop-blur-md flex items-center justify-between px-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={handleBackToList} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">{CATEGORY_LABELS[category] || category}</span>
          </button>
          <span className="text-white/20">/</span>
          <span className="text-white/40 text-sm font-mono">#{interview.id}</span>
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold border" style={{ background: levelCfg.bg, color: levelCfg.color, borderColor: levelCfg.border }}>
            {levelCfg.label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 font-mono text-sm">
            <svg className="w-3.5 h-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <polyline points="12 6 12 12 16 14" strokeWidth={2} />
            </svg>
            <span className={seconds > 1200 ? "text-red-400" : seconds > 600 ? "text-amber-400" : "text-white/70"}>
              {formattedTime}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
            <span className={`w-2 h-2 rounded-full ${pyStatus === "ready" ? "bg-green-400" :
                pyStatus === "loading" ? "bg-amber-400 animate-pulse" :
                  pyStatus === "running" ? "bg-indigo-400 animate-pulse" : "bg-red-400"
              }`} />
            <span className="text-white/60">
              {pyStatus === "ready" ? "Python Hazır" :
                pyStatus === "loading" ? "Yükleniyor..." :
                  pyStatus === "running" ? "Çalışıyor..." : "Hata"}
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold">
                {(user.username || "U")[0].toUpperCase()}
              </div>
              <span className="text-xs text-indigo-200 font-medium">{user.username}</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-[420px] border-r border-white/5 bg-[#0a0e1a] flex flex-col overflow-y-auto">
          <div className="p-6 space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{interview.title}</h1>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span>{CATEGORY_LABELS[category] || category}</span>
                <span>•</span>
                <span>{levelCfg.label} Seviye</span>
              </div>
            </div>

            <p className="text-white/70 leading-relaxed whitespace-pre-wrap">
              {interview.description}
            </p>

            {testCases && (
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
                  Beklenen Fonksiyon
                </div>
                <code className="text-amber-400 text-sm font-mono">
                  def {testCases.function_name}(...)
                </code>
              </div>
            )}

            {/* 🆕 Misafir bilgilendirme — test case yoksa bu görünür */}
            {!testCases && isGuest && (
              <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                <div className="text-[10px] uppercase tracking-wider text-indigo-300 mb-1.5">
                  🔒 Test Caseler
                </div>
                <p className="text-xs text-indigo-200/80">
                  Test caseleri görmek ve kodu çalıştırmak için{" "}
                  <a
                    href={`/login?returnUrl=${encodeURIComponent(`/interviews/${category}/${id}`)}`}
                    className="underline font-semibold text-indigo-300 hover:text-indigo-200"
                  >
                    giriş yap
                  </a>.
                </p>
              </div>
            )}

            {hintsList.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                    💡 İpuçları
                    <span className="text-xs text-white/40 font-normal">
                      ({revealedHints}/{hintsList.length})
                    </span>
                  </h3>
                  {revealedHints < hintsList.length && (
                    <button
                      onClick={revealNextHint}
                      className="text-xs px-3 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 transition-colors"
                    >
                      İpucu Göster
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {hintsList.slice(0, revealedHints).map((hint, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm text-amber-100/80 leading-relaxed"
                    >
                      <span className="text-amber-400 font-semibold mr-1.5">#{idx + 1}</span>
                      {hint.replace(/^💡\s*İpucu\s*\d+:\s*/i, "")}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            <CodeEditor ref={editorRef} value={code} onChange={setCode} height="100%" language="python" />
          </div>

          <div className="h-72 border-t border-white/5 bg-[#0a0e1a] flex flex-col flex-shrink-0">
            <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 flex-shrink-0">
              <div className="flex items-center gap-1">
                {(["examples", "tests", "console"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeTab === tab ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {tab === "tests" ? (
                      <span className="flex items-center gap-2">
                        Testler
                        {totalCount > 0 && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${allPassed ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                            {passedCount}/{totalCount}
                          </span>
                        )}
                      </span>
                    ) : tab === "examples" ? (
                      <span className="flex items-center gap-2">
                        Örnekler
                        {testCases && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                            {testCases.test_cases.length}
                          </span>
                        )}
                      </span>
                    ) : (
                      "Konsol"
                    )}
                  </button>
                ))}
              </div>

              {/* 🆕 Misafir ise Çalıştır butonu farklı görünür */}
              <button
                onClick={handleRun}
                disabled={isRunning || pyStatus !== "ready"}
                className={`px-5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                  isRunning || pyStatus !== "ready"
                    ? "bg-white/5 text-white/30 cursor-not-allowed"
                    : isGuest
                    ? "bg-amber-500/10 border border-amber-400/40 text-amber-400 hover:bg-amber-500/20"
                    : "bg-amber-500 hover:bg-amber-400 text-[#050816] hover:shadow-lg hover:shadow-amber-500/30"
                }`}
              >
                {isRunning ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white/70 rounded-full animate-spin" />
                    Çalışıyor...
                  </>
                ) : isGuest ? (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" />
                    </svg>
                    Çalıştırmak İçin Giriş Yap
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Çalıştır
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {activeTab === "examples" && (
                <div className="space-y-3">
                  {testCases && testCases.test_cases.length > 0 ? (
                    testCases.test_cases.map((tc: TestCase, idx: number) => {
                      const result = testResults[idx];
                      const hasRun = result !== undefined;
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border ${
                            hasRun
                              ? result.passed
                                ? "bg-green-500/5 border-green-500/20"
                                : "bg-red-500/5 border-red-500/20"
                              : "bg-white/5 border-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                              Örnek #{idx + 1}
                            </span>
                            {hasRun && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                result.passed ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                              }`}>
                                {result.passed ? "✓ Geçti" : "✗ Başarısız"}
                              </span>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Input</div>
                              <pre className="text-xs font-mono text-white/70 bg-black/20 p-2 rounded overflow-x-auto">
                                {JSON.stringify(tc.input, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Expected Output</div>
                              <pre className="text-xs font-mono text-green-400/80 bg-black/20 p-2 rounded overflow-x-auto">
                                {JSON.stringify(tc.expected, null, 2)}
                              </pre>
                            </div>
                            {hasRun && (
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Your Output</div>
                                <pre className={`text-xs font-mono bg-black/20 p-2 rounded overflow-x-auto ${
                                  result.passed ? "text-green-400/80" : "text-amber-300"
                                }`}>
                                  {result.error || JSON.stringify(result.output, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-white/30">
                      {isGuest ? (
                        <>
                          <p className="text-xs">🔒 Örnek test caseler üyelikle erişilebilir.</p>
                          <a
                            href={`/login?returnUrl=${encodeURIComponent(`/interviews/${category}/${id}`)}`}
                            className="text-xs px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors"
                          >
                            Giriş Yap →
                          </a>
                        </>
                      ) : (
                        <p className="text-xs">Bu soru için örnek test case bulunmuyor.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "tests" &&
                (totalCount === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-white/30">
                    <p className="text-xs">Testleri çalıştırmak için "Çalıştır" butonuna bas</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {testResults.map((r, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${
                          r.passed ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${r.passed ? "bg-green-500/20" : "bg-red-500/20"}`}>
                            {r.passed ? "✓" : "✗"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold mb-1 text-white/80">
                              Test #{r.test_number}
                            </div>
                            {r.error ? (
                              <pre className="text-xs text-red-300/80 font-mono whitespace-pre-wrap break-words">{r.error}</pre>
                            ) : (
                              <div className="space-y-1 text-xs font-mono">
                                <div><span className="text-white/40">Girdi: </span>{JSON.stringify(r.input)}</div>
                                <div><span className="text-white/40">Beklenen: </span>{JSON.stringify(r.expected)}</div>
                                {!r.passed && <div><span className="text-white/40">Alınan: </span><span className="text-amber-300">{JSON.stringify(r.output)}</span></div>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

              {activeTab === "console" && (
                <pre className="text-xs text-white/60 font-mono whitespace-pre-wrap leading-relaxed">
                  {consoleOutput || <span className="text-white/20">Konsol çıktısı yok</span>}
                </pre>
              )}
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0a0e1a] border border-green-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-green-500/10"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center text-4xl mb-5 animate-pulse">🏆</div>
                <h2 className="text-2xl font-bold text-white mb-2">Tebrikler!</h2>
                <p className="text-white/50 text-sm mb-6">Tüm testleri başarıyla geçtin.</p>
                <div className="grid grid-cols-3 gap-3 w-full mb-6">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-2xl font-bold text-amber-400">{formattedTime}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mt-1">Süre</div>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                    <div className="text-2xl font-bold text-green-400">+{totalCount * 10}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mt-1">Puan</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-2xl font-bold text-indigo-400">{revealedHints}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mt-1">İpucu</div>
                  </div>
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={handleBackToList} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-sm font-medium transition-colors">Listeye Dön</button>
                  <button onClick={handleNextQuestion} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg hover:shadow-green-500/30 text-white text-sm font-bold transition-all flex items-center justify-center gap-2">
                    Sonraki Soru →
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

async function submitAttempt(payload: AttemptPayload): Promise<void> {
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