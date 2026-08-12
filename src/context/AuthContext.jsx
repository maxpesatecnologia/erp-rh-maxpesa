import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { DEMO_USERS } from "../data/demoUsers";

const AuthContext = createContext(null);
const DEMO_SESSION_KEY = "maxpesa_demo_session";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, email, nome, role, filial }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(async ({ data }) => {
        if (data?.session?.user) {
          await hydrateFromSupabase(data.session.user);
        }
        setLoading(false);
      });

      const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          await hydrateFromSupabase(session.user);
        } else {
          setUser(null);
        }
      });

      return () => sub.subscription.unsubscribe();
    }

    // Modo demo (sem Supabase configurado)
    const stored = localStorage.getItem(DEMO_SESSION_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(DEMO_SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  async function hydrateFromSupabase(authUser) {
    // Espera uma tabela "profiles" (id uuid FK -> auth.users.id) com as
    // colunas: nome, role, filial. Ver README para o schema + RLS.
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("nome, role, filial")
      .eq("id", authUser.id)
      .single();

    if (error) {
      console.warn("Não foi possível carregar o perfil do usuário:", error.message);
    }

    setUser({
      id: authUser.id,
      email: authUser.email,
      nome: profile?.nome ?? authUser.email,
      role: profile?.role ?? "colaborador",
      filial: profile?.filial ?? "—",
    });
  }

  async function signIn(email, password) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      await hydrateFromSupabase(data.user);
      return;
    }

    // Modo demo
    const match = DEMO_USERS.find((u) => u.email === email && u.password === password);
    if (!match) {
      throw new Error("Credenciais inválidas. Use um dos usuários de demonstração listados abaixo.");
    }
    const sessionUser = {
      id: `demo-${match.role}`,
      email: match.email,
      nome: match.nome,
      role: match.role,
      filial: match.filial,
    };
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
  }

  async function signOut() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(DEMO_SESSION_KEY);
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isSupabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
