"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";

import { notifyAuthChange } from "../../hooks/useUser";
import { getSupabaseBrowser } from "../../hooks/useSupabaseBrowser";

// ═══════════════════════════════════════════════════════════════
// ─── Inline authAPI — ayrı dosya gerekmez ───────────────────
// ═══════════════════════════════════════════════════════════════

const API_BASE_URL =

  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user: { id: string; email: string };
}

const inlineAuthAPI = {
  async login(payload: { email: string; password: string }): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || "Giriş başarısız");
    }
    return res.json();
  },
};

// ─── Grid Background ─────────────────────────────────────────
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.08) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────
function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/5 backdrop-blur-md bg-[#050816]/80"
    >
      <Link href="/" className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-amber-400 flex items-center justify-center">
          <span className="text-white font-bold text-xs">PM</span>
        </div>
        <span className="text-white font-bold text-lg">PythonMulakat</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/register" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
          Kayıt Ol
        </Link>
        <Link href="/" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
          Ana Sayfa
        </Link>
      </div>
    </motion.nav>
  );
}

// ─── Types ────────────────────────────────────────────────────
interface LoginFormData {
  email: string;
  password: string;
}

// ─── Inner Form ──────────────────────────────────────────────
function LoginFormInner() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl =
    searchParams.get("returnUrl") || "/interviews";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ─── Password Login ───────────────────────────────────────
  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginData = await inlineAuthAPI.login({
        email: formData.email,
        password: formData.password,
      });

      if (loginData.access_token) {
        localStorage.setItem("token", loginData.access_token);
        if (loginData.refresh_token) {
          localStorage.setItem("refresh_token", loginData.refresh_token);
        }
        notifyAuthChange();
        toast.success("Giriş başarılı! Hoş geldiniz 👋");
        router.push(returnUrl);
      }
    } catch (error: any) {
      toast.error(error?.message || "Giriş başarısız.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Magic Link ───────────────────────────────────────────
  const handleMagicLink = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.email) {
      toast.error("Lütfen e-posta adresinizi girin");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        throw new Error("Supabase client yüklenemedi (browser-only)");
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(
            returnUrl
          )}`,
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setMagicLinkSent(true);
      toast.success("🔑 Magic link gönderildi!", {
        description: "E-postanı kontrol et, linke tıkla.",
        duration: 8000,
      });
    } catch (error: any) {
      toast.error("Magic link gönderilemedi", {
        description: error?.message || "Bilinmeyen hata",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Magic Link Sent UI ───────────────────────────────────
  if (magicLinkSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12"
      >
        <div className="relative w-full max-w-md border border-white/10 bg-[#0a0e1a]/90 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-amber-400 mb-6"
          >
            <span className="text-4xl">📧</span>
          </motion.div>

          <h2 className="text-2xl font-bold text-white mb-3">
            E-postanı Kontrol Et
          </h2>
          <p className="text-white/70 text-sm mb-6">
            <strong className="text-amber-400">{formData.email}</strong>{" "}
            adresine bir giriş linki gönderdik. Linke tıklayarak hesabına giriş
            yapabilirsin.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white/60 text-left space-y-2">
            <p>💡 <strong>İpucu:</strong> Link 1 saat geçerlidir.</p>
            <p>📁 Spam klasörünü kontrol etmeyi unutma.</p>
            <p>🔒 Şifre gerekmez — sadece linke tıkla.</p>
          </div>

          <button
            onClick={() => {
              setMagicLinkSent(false);
              setMode("password");
            }}
            className="mt-6 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
          >
            ← Farklı yöntem dene
          </button>

          <button
            onClick={() => handleMagicLink()}
            disabled={isLoading}
            className="mt-3 w-full text-white/50 hover:text-white text-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? "Gönderiliyor..." : "Linki tekrar gönder"}
          </button>
        </div>
      </motion.div>
    );
  }

  // ─── Login Form ───────────────────────────────────────────
  const inputClass =
    "w-full rounded-xl p-3.5 bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-amber-500/20 to-indigo-500/20 rounded-3xl blur-xl opacity-75" />

        <div className="relative border border-white/10 bg-[#0a0e1a]/90 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-amber-400 mb-4 shadow-lg shadow-amber-400/20"
            >
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold text-white mb-2"
            >
              Tekrar Hoş Geldiniz
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/50 text-sm"
            >
              {mode === "password"
                ? "Şifrenle giriş yap veya magic link kullan"
                : "E-postana gönderilecek linkle giriş yap"}
            </motion.p>
          </div>

          {/* Form */}
          <form
            onSubmit={
              mode === "password" ? handlePasswordLogin : handleMagicLink
            }
            className="space-y-5"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-white/70 text-sm font-medium mb-2">
                E-posta Adresi
              </label>
              <input
                type="email"
                name="email"
                placeholder="ornek@pythonmulakat.com"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </motion.div>

            {mode === "password" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Şifre
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClass}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </motion.div>
            )}

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              type="submit"
              disabled={isLoading}
              className={`w-full rounded-xl p-4 font-bold text-lg transition-all ${
                isLoading
                  ? "bg-amber-800 cursor-not-allowed text-white/50"
                  : "bg-gradient-to-r from-amber-400 to-amber-500 text-[#050816] hover:shadow-lg hover:shadow-amber-400/40"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {mode === "password" ? "Giriş Yapılıyor..." : "Link Gönderiliyor..."}
                </span>
              ) : (
                <span>
                  {mode === "password"
                    ? "Şifre ile Giriş Yap"
                    : "🔑 Magic Link Gönder"}
                </span>
              )}
            </motion.button>
          </form>

          {/* Mode Toggle */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0a0e1a] px-2 text-white/40">veya</span>
            </div>
          </div>

          <button
            onClick={() => setMode(mode === "password" ? "magic" : "password")}
            disabled={isLoading}
            type="button"
            className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {mode === "password" ? (
              <>
                <span className="text-lg">📧</span>
                Şifresiz Giriş (Magic Link)
              </>
            ) : (
              <>
                <span className="text-lg">🔒</span>
                Şifre ile Giriş
              </>
            )}
          </button>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center mt-6 text-white/50 text-sm"
          >
            Hesabınız yok mu?{" "}
            <Link
              href="/register"
              className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              Ücretsiz Kayıt Ol
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page Wrapper ────────────────────────────────────────────
export default function LoginPage() {
  return (
    <div className="relative bg-[#050816] min-h-screen w-full overflow-x-hidden">
      <GridBackground />
      <Navbar />
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white/50 mt-4 text-sm">Yükleniyor...</p>
          </div>
        }
      >
        <LoginFormInner />
      </Suspense>
    </div>
  );
}