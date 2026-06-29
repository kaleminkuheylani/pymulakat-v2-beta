"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getSupabaseBrowser } from "../../../hooks/useSupabaseBrowser";
import { useUser } from "../../../hooks/useUser";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const { refresh } = useUser(); // ✅ useUser hook'unu kullan

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = getSupabaseBrowser();
        if (!supabase) {
          throw new Error("Supabase client yüklenemedi");
        }

        // ✅ Session'ı al
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (data.session) {
          // ✅ Token'ları localStorage'a yaz
          localStorage.setItem("token", data.session.access_token);
          if (data.session.refresh_token) {
            localStorage.setItem("refresh_token", data.session.refresh_token);
          }

          setStatus("success");
          toast.success("Giriş başarılı! 🎉");

          // ✅ User state'ini hemen güncelle (önemli!)
          await refresh();

          const returnUrl =
            searchParams.get("returnUrl") || "/interviews/python-basics";

          // Biraz bekle ki user state propagate olsun
          setTimeout(() => router.push(returnUrl), 600);
        } else {
          // Session yoksa biraz bekle (bazen gecikir)
          let attempts = 0;
          const tryGetSession = async () => {
            attempts++;
            const { data: retryData } = await supabase.auth.getSession();

            if (retryData.session) {
              localStorage.setItem("token", retryData.session.access_token);
              if (retryData.session.refresh_token) {
                localStorage.setItem(
                  "refresh_token",
                  retryData.session.refresh_token
                );
              }

              setStatus("success");
              toast.success("Giriş başarılı! 🎉");
              await refresh();

              const returnUrl =
                searchParams.get("returnUrl") || "/interviews/python-basics";
              setTimeout(() => router.push(returnUrl), 600);
            } else if (attempts < 5) {
              setTimeout(tryGetSession, 800);
            } else {
              setStatus("error");
              toast.error("Session oluşturulamadı", {
                description: "Link süresi dolmuş olabilir",
              });
              setTimeout(() => router.push("/login"), 2000);
            }
          };

          tryGetSession();
        }
      } catch (err: any) {
        console.error("Callback error:", err);
        setStatus("error");
        toast.error("Giriş başarısız", { description: err.message });
        setTimeout(() => router.push("/login"), 2000);
      }
    };

    handleCallback();
  }, [router, searchParams, refresh]);

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center">
      <div className="text-center">
        {status === "loading" && (
          <>
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Giriş yapılıyor...</p>
            <p className="text-white/50 text-sm mt-2">
              Hesabınız doğrulanıyor
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <p className="text-white text-lg">Başarıyla giriş yaptınız!</p>
            <p className="text-white/50 text-sm mt-2">Yönlendiriliyorsunuz...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <p className="text-red-400 text-lg">Giriş başarısız</p>
            <p className="text-white/50 text-sm mt-2">
              Login sayfasına yönlendiriliyorsunuz...
            </p>
          </>
        )}
      </div>
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