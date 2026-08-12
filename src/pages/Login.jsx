import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { DEMO_USERS } from "../data/demoUsers";

export default function Login() {
  const { signIn, isSupabaseConfigured } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  function fillDemo(user) {
    setEmail(user.email);
    setPassword(user.password);
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
          <h1>Maxpesa | ERP RH</h1>
          <p>Plataforma de Gestão Estratégica de Pessoas</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="email">E-mail corporativo</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.nome@maxpesa.com.br"
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>

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
