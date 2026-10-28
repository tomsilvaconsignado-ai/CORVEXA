import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** true quando as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY foram definidas */
export const isSupabaseConfigured = Boolean(url && anonKey);

const REMEMBER_KEY = 'corvexa_remember_me';

function safeGet(storage: Storage, key: string): string | null {
  try { return storage.getItem(key); } catch { return null; }
}

/**
 * Armazena a sessão no localStorage ("manter conectado") ou no sessionStorage
 * (sessão encerra ao fechar o navegador), conforme a escolha no login.
 */
const sessionStore = {
  getItem: (key: string) => safeGet(localStorage, key) ?? safeGet(sessionStorage, key),
  setItem: (key: string, value: string) => {
    try {
      const remember = safeGet(localStorage, REMEMBER_KEY) !== 'false';
      (remember ? localStorage : sessionStorage).setItem(key, value);
      (remember ? sessionStorage : localStorage).removeItem(key);
    } catch { /* armazenamento indisponível */ }
  },
  removeItem: (key: string) => {
    try { localStorage.removeItem(key); sessionStorage.removeItem(key); } catch { /* ignore */ }
  }
};

export function setRememberMe(remember: boolean) {
  try { localStorage.setItem(REMEMBER_KEY, String(remember)); } catch { /* ignore */ }
}

export const supabase: SupabaseClient = createClient(
  url || 'https://configure-o-supabase.invalid',
  anonKey || 'missing-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: sessionStore
    }
  }
);
