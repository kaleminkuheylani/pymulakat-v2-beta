// hooks/useAuthGate.ts
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./useUser";

/**
 * Senin mevcut yapına uygun guest-mode guard.
 * - Sayfa yine de yüklenir (misafir de okuyabilir)
 * - handleRun, submitAttempt gibi aksiyonlar auth kontrolünden geçer
 *
 * Kullanım:
 *   const { user, loading, runIfAuth, submitIfAuth } = useAuthGate();
 *   ...
 *   <button onClick={() => runIfAuth(handleRun, "kod çalıştırma")}>
 */
export function useAuthGate() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [guestNotice, setGuestNotice] = useState<{
    feature: string;
    ts: number;
  } | null>(null);

  /**
   * Auth gerektiren aksiyonu sarmala.
   * Yetkisizse modal yerine inline notice göster + /login'e yönlendir.
   */
  const runIfAuth = useCallback(
    (action: () => void | Promise<void>, featureName: string) => {
      if (loading) {
        // Auth durumu henüz belli değil, kullanıcıya beklemesini söyle
        return;
      }
      if (!user) {
        const currentPath =
          typeof window !== "undefined" ? window.location.pathname : "/";
        const redirect = encodeURIComponent(currentPath);
        router.push(`/login?returnUrl=${redirect}&reason=guest_${encodeURIComponent(featureName)}`);
        return;
      }
      return action();
    },
    [user, loading, router]
  );

  /**
   * Misafir için banner göster (sayfa üstünde küçük notice).
   * runIfAuth başarısız olduğunda otomatik tetiklenir.
   */
  const showGuestNotice = useCallback((feature: string) => {
    setGuestNotice({ feature, ts: Date.now() });
    // 5 saniye sonra notice'i kapat
    setTimeout(() => setGuestNotice(null), 5000);
  }, []);

  return {
    user,
    loading,
    isAuth: !!user,
    runIfAuth,
    showGuestNotice,
    guestNotice,
  };
}