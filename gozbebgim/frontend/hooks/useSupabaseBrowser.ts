// hooks/useSupabaseBrowser.ts
// Browser-side Supabase client — @supabase/ssr ile cookie + localStorage dual storage.
// Hem email verification, hem OAuth callback, hem password recovery akışlarını destekler.

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (typeof window === "undefined") return null;

  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil!"
    );
  }

  // createBrowserClient otomatik olarak:
  //  - PKCE flow için code verifier'ı cookie'de tutar
  //  - session'ı localStorage'da persist eder
  //  - tab'lar arası senkronizasyon yapar
  //  - hash fragment'teki access_token'ı (legacy) yakalar
  _client = createBrowserClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // email confirmation + magic link için şart
      flowType: "pkce",
      storageKey: "sb-gozbegim-auth-token", // mevcut backend ile uyumlu kalsın
    },
  });

  return _client;
}

/** Client'ı sıfırla (logout sonrası veya env değişikliği için). */
export function resetSupabaseBrowser() {
  _client = null;
}