import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Em desenvolvimento, se o .env ainda não tiver sido preenchido com um projeto
// Supabase real, criamos um client "vazio" para não quebrar a aplicação — o
// AuthContext usa `isSupabaseConfigured` para cair no modo demo (login mock).
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
