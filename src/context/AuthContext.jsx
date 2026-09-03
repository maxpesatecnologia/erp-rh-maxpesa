import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { DEMO_USERS } from "../data/demoUsers";

const AuthContext = createContext(null);
const DEMO_SESSION_KEY = "maxpesa_demo_session";
const PASSWORD_RECOVERY_PATH = "/redefinir-senha";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, email, nome, role, filial }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured) {
      // O link de "esqueci minha senha" abre uma sessão temporária de
      // recuperação só pra trocar a senha ali. Se deixarmos o fluxo normal
      // rodar, ele checa "tem linha em rh_profiles?" e, sem achar, desloga
      // automaticamente — derrubando a sessão bem no meio da troca de senha.
      // Por isso /redefinir-senha cuida da própria sessão sozinha (ver
      // RedefinirSenha.jsx) e o AuthContext não mexe em nada aqui.
      if (window.location.pathname === PASSWORD_RECOVERY_PATH) {
        setLoading(false);
        return;
      }

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

  // Só entra quem tem uma linha em "rh_profiles": é essa tabela que funciona
  // como a lista de e-mails pré-liberados. Sem linha lá (usuário nunca
  // provisionado pelo RH/admin), a sessão é encerrada na hora, mesmo com
  // login/senha válidos.
  //
  // Prefixo "rh_": o Supabase é compartilhado entre vários sistemas da
  // Maxpesa. Toda tabela deste app usa esse prefixo para não colidir com as
  // de outro sistema no mesmo banco.
  async function hydrateFromSupabase(authUser) {
    // Espera uma tabela "rh_profiles" (id uuid FK -> auth.users.id) com as
    // colunas: nome, role, filial. Ver README para o schema + RLS.
    const { data: profile, error } = await supabase
      .from("rh_profiles")
      .select("nome, role, filial")
      .eq("id", authUser.id)
      .single();

    if (error || !profile) {
      await supabase.auth.signOut();
      setUser(null);
      return false;
    }

    setUser({
      id: authUser.id,
      email: authUser.email,
      nome: profile.nome,
      role: profile.role,
      filial: profile.filial ?? "—",
    });
    return true;
  }

  async function signIn(email, password) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      const authorized = await hydrateFromSupabase(data.user);
      if (!authorized) {
        throw new Error("Este e-mail ainda não foi liberado para acessar o sistema. Fale com o RH ou administrador.");
      }
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

  // Só faz sentido com Supabase real: em modo demo não há senha de verdade
  // por usuário, todo mundo usa "demo123".
  async function updatePassword(newPassword) {
    if (!isSupabaseConfigured) {
      throw new Error("Troca de senha só está disponível com o Supabase configurado.");
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  async function requestPasswordReset(email) {
    if (!isSupabaseConfigured) {
      throw new Error("Recuperação de senha só está disponível com o Supabase configurado.");
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) throw new Error(error.message);
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
    <AuthContext.Provider
      value={{ user, loading, signIn, signOut, updatePassword, requestPasswordReset, isSupabaseConfigured }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
