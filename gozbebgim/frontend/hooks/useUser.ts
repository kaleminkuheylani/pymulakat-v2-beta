// hooks/useUser.ts — Inline user (solution_average_time dahil)

import { useState, useEffect, useCallback } from "react";

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
  solution_average_time?: number;        // ✅ saniye cinsinden
  solution_average_time_ms?: number;     // ✅ ms cinsinden
}

export function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
}

// ═══════════════════════════════════════════════════════════════
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchMe(): Promise<UserResponse | null> {
  if (typeof window === "undefined") return null;

  let token: string | null = null;
  try {
    const supabaseAuth = JSON.parse(
      localStorage.getItem("sb-gozbegim-auth-token") ||
        sessionStorage.getItem("sb-gozbegim-auth-token") ||
        "{}"
    );
    token = supabaseAuth?.access_token;
  } catch {}

  if (!token) {
    token = localStorage.getItem("token");
  }
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
        localStorage.removeItem("sb-gozbegim-auth-token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refresh_token");
      }
      return null;
    }

    const data = await res.json();

    // ✅ Default değerler — boş user'da undefined patlaması önler
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

    const onStorage = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "logout") {
        fetchUser();
      }
    };
    const onAuthChange = () => fetchUser();

    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_EVENT, onAuthChange);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_EVENT, onAuthChange);
    };
  }, [fetchUser]);

  const refresh = useCallback(() => fetchUser(), [fetchUser]);

  const logout = useCallback(() => {
    localStorage.removeItem("sb-gozbegim-auth-token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refresh_token");
    setUser(null);
    notifyAuthChange();
  }, []);

  return { user, loading, error, refresh, logout };
}
