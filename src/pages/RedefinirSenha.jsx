import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

// Destino do link que o Supabase manda por e-mail (ver AuthContext.requestPasswordReset).
// O próprio supabase-js já lê o token da URL e abre uma sessão temporária de
// recuperação antes deste componente montar — só precisamos checar se ela existe.
export default function RedefinirSenha() {
  const { updatePassword } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data?.session));
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      await supabase.auth.signOut();
      setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <img
            className="login-brand-mark"
            src={theme === "dark" ? "/logo_branca.png" : "/maxpesa_logo_png.png"}
            alt="Grupo Maxpesa"
          />
          <h1>Definir nova senha</h1>
          <p>Maxpesa | ERP RH</p>
        </div>

        {checking && <p className="page-subtitle" style={{ textAlign: "center" }}>Verificando link…</p>}

        {!checking && !hasSession && (
          <>
            <div className="login-error">
              Este link é inválido ou já expirou. Solicite um novo em "Esqueci minha senha" na tela de login.
            </div>
            <button className="btn btn-outline btn-block" type="button" onClick={() => navigate("/login")}>
              Voltar para o login
            </button>
          </>
        )}

        {!checking && hasSession && !success && (
          <form onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}
            <div className="field-group">
              <label htmlFor="new-password">Nova senha</label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="confirm-password">Confirmar nova senha</label>
              <input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
              {submitting ? "Salvando…" : "Salvar nova senha"}
            </button>
          </form>
        )}

        {success && <div className="inline-banner success">Senha atualizada. Redirecionando para o login…</div>}
      </div>
    </div>
  );
}
