"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getSupabaseBrowser } from "../../../hooks/useSupabaseBrowser";
import { notifyAuthChange } from "../../../hooks/useUser";

type CallbackType = "magiclink" | "signup" | "recovery" | "oauth" | "unknown";

function classifyCallback(searchParams: URLSearchParams): CallbackType {
  // Öncelik: ?type= explicit
  const explicit = searchParams.get("type");
  if (explicit === "recovery") return "recovery";
  if (explicit === "signup") return "signup";
  if (explicit === "magiclink") return "magiclink";

  // Supabase URL'inde token_hash varsa → email confirmation veya recovery
  if (searchParams.get("token_hash")) {
    // Supabase token_hash'i nonce ile birlikte kullanır; tip yoksa signup varsay
    return "signup";
  }

  // Hash fragment (#access_token=...) — eski legacy flow
  if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
    return "magiclink";
  }

  return "oauth";
}

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("İşlem gerçekleştiriliyor...");

  useEffect(() => {
    let redirected = false;

    const handleCallback = async () => {
      try {
        const supabase = getSupabaseBrowser();
        if (!supabase) {
          throw new Error("Supabase client yüklenemedi");
        }

        const callbackType = classifyCallback(searchParams);
        const returnUrl = searchParams.get("returnUrl") || "/interviews/python-basics";

        // ─── RECOVERY flow ─────────────────────────────────
        if (callbackType === "recovery") {
          setMessage("Şifre sıfırlama linki doğrulanıyor...");
          const { data, error } = await supabase.auth.getSession();

          if (error) throw error;

          if (data.session) {
            // Recovery session aktif → reset-password sayfasına yönlendir
            setStatus("success");
            toast.success("Şifre sıfırlama hazır 🔐");
            setTimeout(() => router.push("/auth/reset-password"), 400);
            return;
          }

          // Session yoksa: token_hash ile OTP verify gerekebilir
          const tokenHash = searchParams.get("token_hash");
          if (tokenHash) {
            const { error: verifyErr } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: "recovery",
            });
            if (verifyErr) throw verifyErr;
            setStatus("success");
            toast.success("Şifre sıfırlama hazır 🔐");
            setTimeout(() => router.push("/auth/reset-password"), 400);
            return;
          }

          throw new Error("Geçersiz veya süresi dolmuş sıfırlama linki");
        }

        // ─── SIGNUP (email confirmation) flow ────────────
        if (callbackType === "signup") {
          setMessage("E-posta adresin doğrulanıyor...");
          const tokenHash = searchParams.get("token_hash");
          if (!tokenHash) throw new Error("Doğrulama token'ı eksik");

          const { error: verifyErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "signup",
          });

          if (verifyErr) throw verifyErr;

          // Session oluştuysa backend tarafında is_verified=true yapılır mı?
          // Backend register'da email_confirm=False kullanıyor; doğrulama sonrası
          // profile.is_verified güncellenmeli. Burada sadece UI'ya bildiriyoruz.
          setStatus("success");
          toast.success("E-posta doğrulandı! 🎉");
          notifyAuthChange();

          redirected = true;
          setTimeout(() => router.push(returnUrl), 800);
          return;
        }

        // ─── MAGIC LINK flow ──────────────────────────────
        if (callbackType === "magiclink") {
          setMessage("Magic link doğrulanıyor...");
          // createBrowserClient + detectSessionInUrl=true bunu otomatik handle eder.
          // Yine de fallback:
          let attempts = 0;
          const trySession = async () => {
            attempts++;
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;

            if (data.session) {
              setStatus("success");
              toast.success("Giriş başarılı! 🎉");
              notifyAuthChange();
              redirected = true;
              setTimeout(() => router.push(returnUrl), 600);
              return;
            }
            if (attempts < 5) {
              setTimeout(trySession, 800);
            } else {
              throw new Error("Session oluşturulamadı — link süresi dolmuş olabilir");
            }
          };
          await trySession();
          return;
        }

        // ─── OAUTH (Google/GitHub/etc) flow ───────────────
        setMessage("OAuth girişi tamamlanıyor...");
        let attempts = 0;
        const trySession = async () => {
          attempts++;
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;

          if (data.session) {
            setStatus("success");
            toast.success("OAuth girişi başarılı! 🎉");
            notifyAuthChange();
            redirected = true;
            setTimeout(() => router.push(returnUrl), 600);
            return;
          }
          if (attempts < 5) {
            setTimeout(trySession, 800);
          } else {
            throw new Error("OAuth callback başarısız");
          }
        };
        await trySession();
      } catch (err: any) {
        if (redirected) return;
        console.error("Callback error:", err);
        setStatus("error");
        setMessage(err?.message || "Bilinmeyen hata");
        toast.error("İşlem başarısız", { description: err?.message });
        setTimeout(() => router.push("/login"), 2500);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {status === "loading" && (
          <>
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">{message}</p>
            <p className="text-white/50 text-sm mt-2">Lütfen bekleyin</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <p className="text-white text-lg">İşlem başarılı!</p>
            <p className="text-white/50 text-sm mt-2">Yönlendiriliyorsunuz...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <p className="text-red-400 text-lg">İşlem başarısız</p>
            <p className="text-white/50 text-sm mt-2">{message}</p>
            <p className="text-white/40 text-xs mt-3">Login sayfasına yönlendiriliyorsunuz...</p>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050816] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}