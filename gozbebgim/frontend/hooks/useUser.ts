// hooks/useUser.ts — Supabase SSR tabanlı, çoklu kaynaklardan token çıkarımı + auto-refresh.

import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowser } from "./useSupabaseBrowser";

const AUTH_EVENT = "auth-state-changed";

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  is_verified?: boolean;
  points?: number;
  total_attempts?: number;
  success_count?: number;
  fail_count?: number;
  success_rate?: number;
  solution_average_time?: number;
  solution_average_time_ms?: number;
}

export function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
}

// ═══════════════════════════════════════════════════════════════
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Supabase'in kullandığı storage key'leri dahil tüm olası konumlardan access_token çıkar.
 * @supabase/ssr hem localStorage hem cookie kullanabilir; biz her iki kaynağı da tarıyoruz.
 */
function extractAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  // 1) Bilinen storage key'ler
  const knownKeys = [
    "sb-gozbegim-auth-token",
    "sb-gozbegim-auth-token-code-verifier", // PKCE
  ];
  for (const key of knownKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const token =
        parsed?.access_token ||
        parsed?.currentSession?.access_token ||
        parsed?.session?.access_token;
      if (token) return token;
    } catch {
      // ignore
    }
  }

  // 2) "-auth-token" ile biten tüm key'leri tara
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.endsWith("-auth-token") || knownKeys.includes(key)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const token =
        parsed?.access_token ||
        parsed?.currentSession?.access_token ||
        parsed?.session?.access_token;
      if (token) return token;
    } catch {
      // ignore
    }
  }

  // 3) Plain "token" key'i (backend'in eski login endpoint'i için fallback)
  const plain = localStorage.getItem("token");
  if (plain) return plain;

  // 4) Cookies (SSR tarayıcıya yazabilir)
  if (typeof document !== "undefined") {
    const cookies = document.cookie.split(";");
    for (const c of cookies) {
      const [k, v] = c.trim().split("=");
      if (k && v && (k.includes("auth-token") || k.includes("access-token"))) {
        try {
          const decoded = decodeURIComponent(v);
          // JWT formatı (header.payload.signature)
          if (decoded.startsWith("eyJ")) return decoded;
          const parsed = JSON.parse(decoded);
          if (parsed?.access_token) return parsed.access_token;
          if (parsed?.[0]?.access_token) return parsed[0].access_token;
        } catch {
          // raw jwt olabilir
          if (v.startsWith("eyJ")) return v;
        }
      }
    }
  }

  return null;
}

async function fetchMe(): Promise<UserResponse | null> {
  if (typeof window === "undefined") return null;

  const token = extractAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        // Token expired/invalid — Supabase client'ı temizle
        const supabase = getSupabaseBrowser();
        if (supabase) {
          try {
            await supabase.auth.signOut();
          } catch {
            // ignore
          }
        }
        localStorage.removeItem("sb-gozbegim-auth-token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refresh_token");
      }
      return null;
    }

    const data = await res.json();

    return {
      id: data.id || "",
      email: data.email || "",
      username: data.username || data.email?.split("@")[0] || "user",
      is_verified: data.is_verified ?? false,
      points: data.points ?? 0,
      total_attempts: data.total_attempts ?? 0,
      success_count: data.success_count ?? 0,
      fail_count: data.fail_count ?? 0,
      success_rate: data.success_rate ?? 0,
      solution_average_time: data.solution_average_time ?? 0,
      solution_average_time_ms: data.solution_average_time_ms ?? 0,
    };
  } catch (err) {
    console.error("fetchMe error:", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
export function useUser() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchMe();
      setUser(data);
      if (data) {
        localStorage.setItem("user", JSON.stringify(data));
      } else {
        localStorage.removeItem("user");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Bilinmeyen hata";
      console.error("useUser fetch error:", message);
      setError(message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // Supabase tab'lar arası session değişikliğini dinle
    const supabase = getSupabaseBrowser();
    let sub: { unsubscribe: () => void } | null = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.access_token) {
          localStorage.setItem("token", session.access_token);
          if (session.refresh_token) {
            localStorage.setItem("refresh_token", session.refresh_token);
          }
        }
        fetchUser();
      });
      sub = data.subscription;
    }

    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "token" ||
        e.key === "logout" ||
        e.key?.endsWith("-auth-token")
      ) {
        fetchUser();
      }
    };
    const onAuthChange = () => fetchUser();

    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_EVENT, onAuthChange);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_EVENT, onAuthChange);
      sub?.unsubscribe();
    };
  }, [fetchUser]);

  const refresh = useCallback(() => fetchUser(), [fetchUser]);

  const logout = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Supabase signOut error:", err);
      }
    }
    localStorage.removeItem("sb-gozbegim-auth-token");
    localStorage.removeItem("sb-gozbegim-auth-token-code-verifier");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refresh_token");
    setUser(null);
    notifyAuthChange();
  }, []);

  return { user, loading, error, refresh, logout };
}

export { extractAccessToken };