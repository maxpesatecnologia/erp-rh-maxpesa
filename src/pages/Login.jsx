import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { DEMO_USERS } from "../data/demoUsers";

export default function Login() {
  const { signIn, requestPasswordReset, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login"); // "login" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
      const redirectTo = location.state?.from?.pathname ?? "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Sempre mostra a mesma mensagem de sucesso, exista ou não o e-mail — não é
  // pra dar pra descobrir por aqui quais e-mails têm conta no sistema.
  async function handleForgotSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
    } catch {
      // ignorado de propósito
    } finally {
      setSubmitting(false);
      setResetSent(true);
    }
  }

  function toggleMode() {
    setMode((m) => (m === "login" ? "forgot" : "login"));
    setError("");
    setResetSent(false);
  }

  function fillDemo(user) {
    setEmail(user.email);
    setPassword(user.password);
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-corner login-corner-tl" aria-hidden="true" />
        <div className="login-corner login-corner-br" aria-hidden="true" />
        <img className="login-watermark" src="/logo_png_maxpesa_fav.png" alt="" aria-hidden="true" />
        <div className="login-brand">
          <img
            className="login-brand-mark"
            src="/maxpesa_logo_png.png"
            alt="Grupo Maxpesa"
          />
          <h1>Maxpesa | ERP RH</h1>
          <p>Plataforma de Gestão Estratégica de Pessoas</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        {mode === "login" ? (
          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="email">E-mail corporativo</label>
              <div className="field-input">
                <Mail size={16} className="field-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.nome@maxpesa.com.br"
                  required
                />
              </div>
            </div>
            <div className="field-group">
              <label htmlFor="password">Senha</label>
              <div className="field-input">
                <Lock size={16} className="field-icon" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="field-icon-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
              {submitting ? "Entrando…" : (
                <>
                  Entrar <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit}>
            {resetSent ? (
              <div className="inline-banner success">
                Se esse e-mail tiver uma conta no sistema, um link para redefinir a senha foi enviado para ele.
              </div>
            ) : (
              <>
                <div className="field-group">
                  <label htmlFor="reset-email">E-mail corporativo</label>
                  <div className="field-input">
                    <Mail size={16} className="field-icon" />
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.nome@maxpesa.com.br"
                      required
                    />
                  </div>
                </div>
                <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
                  {submitting ? "Enviando…" : "Enviar link de recuperação"}
                </button>
              </>
            )}
          </form>
        )}

        {isSupabaseConfigured && (
          <button type="button" className="link-button" onClick={toggleMode}>
            {mode === "login" ? "Esqueci minha senha" : "Voltar para o login"}
          </button>
        )}

        {!isSupabaseConfigured && (
          <div className="login-hint">
            Modo demonstração (Supabase ainda não configurado — veja o README).
            <br />
            Clique em um perfil para preencher o login:
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: 11, padding: "6px 10px" }}
                  onClick={() => fillDemo(u)}
                >
                  {u.role}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
