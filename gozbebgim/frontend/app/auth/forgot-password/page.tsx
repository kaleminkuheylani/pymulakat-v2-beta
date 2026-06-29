"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getSupabaseBrowser } from "../../../hooks/useSupabaseBrowser";

// ─── Grid Background (login ile aynı) ──────────────────────
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

// ─── Navbar (login ile aynı) ───────────────────────────────
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
        <Link href="/login" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
          Giriş Yap
        </Link>
        <Link href="/" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
          Ana Sayfa
        </Link>
      </div>
    </motion.nav>
  );
}

// ─── Inner Form ────────────────────────────────────────────
function ForgotPasswordInner() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Lütfen e-posta adresinizi girin");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        throw new Error("Supabase client yüklenemedi");
      }

      const redirectTo = `${window.location.origin}/auth/callback?type=recovery&returnUrl=${encodeURIComponent("/auth/reset-password")}`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;

      setSent(true);
      toast.success("📧 Şifre sıfırlama linki gönderildi", {
        description: "E-postanı kontrol et.",
        duration: 6000,
      });
    } catch (err: any) {
      // Güvenlik: Kullanıcı var/yok bilgisi sızmasın diye başarılıymış gibi göster
      // ama detaylı hata varsa yine de logla
      console.error("Reset email error:", err);

      // Supabase "Email rate limit exceeded" veya başka bir gerçek hata dönerse
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("rate")) {
        toast.error("Çok fazla istek", {
          description: "Lütfen birkaç dakika sonra tekrar dene",
        });
      } else {
        // Güvenlik için başarılı göster
        setSent(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl p-3.5 bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all";

  // ─── Sent state ──────────────────────────────────────────
  if (sent) {
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
            <span className="text-4xl">📬</span>
          </motion.div>

          <h2 className="text-2xl font-bold text-white mb-3">
            E-postanı Kontrol Et
          </h2>
          <p className="text-white/70 text-sm mb-6">
            <strong className="text-amber-400">{email}</strong> adresine bir
            şifre sıfırlama linki gönderdik. Linke tıklayarak yeni şifre
            belirleyebilirsin.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white/60 text-left space-y-2">
            <p>💡 <strong>İpucu:</strong> Link 1 saat geçerlidir.</p>
            <p>📁 Spam klasörünü kontrol etmeyi unutma.</p>
            <p>🔒 Link tek kullanımlıktır — sıfırlama sonrası geçersiz olur.</p>
          </div>

          <Link
            href="/login"
            className="mt-6 inline-block text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
          >
            ← Giriş sayfasına dön
          </Link>
        </div>
      </motion.div>
    );
  }

  // ─── Form state ──────────────────────────────────────────
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
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold text-white mb-2"
            >
              Şifremi Unuttum
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/50 text-sm"
            >
              E-postanı gir, sana bir sıfırlama linki gönderelim
            </motion.p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@pythonmulakat.com"
                className={inputClass}
                required
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
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
                  Gönderiliyor...
                </span>
              ) : (
                <span>📧 Sıfırlama Linki Gönder</span>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-6 text-white/50 text-sm"
          >
            Şifreni hatırladın mı?{" "}
            <Link
              href="/login"
              className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              Giriş Yap
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page Wrapper ──────────────────────────────────────────
export default function ForgotPasswordPage() {
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
        <ForgotPasswordInner />
      </Suspense>
    </div>
  );
}