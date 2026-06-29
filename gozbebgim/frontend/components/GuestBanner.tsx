// components/GuestBanner.tsx
// Misafir kullanıcıya gösterilecek üst banner.
// - Misafir kod editörünü görebilir, okuyabilir
// - "Çalıştır" / "Test Gönder" butonları tıklanırsa /login'e yönlendirir

"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface GuestBannerProps {
  feature?: string; // Hangi feature için auth istendi (misafir tıkladığında)
}

export function GuestBanner({ feature }: GuestBannerProps) {
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "";
  const returnUrl = encodeURIComponent(currentPath);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-amber-400/20 bg-gradient-to-r from-amber-500/5 via-amber-400/10 to-amber-500/5 px-4 py-2.5 flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="text-amber-400">🎮</span>
        <span className="text-amber-100/90">
          Misafir modunda soruyu{" "}
          <span className="font-bold text-amber-300">okuyabilir</span> ve kodu{" "}
          <span className="font-bold text-amber-300">inceleyebilirsin</span>.
        </span>
        {feature && (
          <span className="text-amber-200/70 ml-2 hidden md:inline">
            · "{feature}" için{" "}
            <Link
              href={`/login?returnUrl=${returnUrl}`}
              className="underline font-semibold text-amber-300 hover:text-amber-200"
            >
              giriş yap
            </Link>
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={`/login?returnUrl=${returnUrl}`}
          className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold transition-colors"
        >
          Giriş Yap
        </Link>
        <Link
          href={`/register?returnUrl=${returnUrl}`}
          className="text-xs px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#050816] font-bold transition-colors"
        >
          Kayıt Ol
        </Link>
      </div>
    </motion.div>
  );
}

/**
 * Toast/Mini notice — misafir "Çalıştır"a bastığında gösterilir.
 * (Misafirken tıklanırsa /login'e yönlendirildiği için genelde kısa süreli)
 */
export function GuestActionNotice({ feature }: { feature?: string }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-xl bg-amber-500/20 backdrop-blur border border-amber-400/40 text-amber-100 text-sm shadow-lg"
      >
        🔒 {feature || "Bu özellik"} için üye girişi gereklidir.
      </motion.div>
    </AnimatePresence>
  );
}