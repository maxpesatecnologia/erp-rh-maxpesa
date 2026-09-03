import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function TrocarSenhaModal({ onClose }) {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h3>Trocar senha</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <>
            <div className="inline-banner success">Senha atualizada com sucesso.</div>
            <button className="btn btn-outline btn-block" type="button" onClick={onClose}>
              Fechar
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}
            <div className="field-group">
              <label htmlFor="modal-new-password">Nova senha</label>
              <input
                id="modal-new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="modal-confirm-password">Confirmar nova senha</label>
              <input
                id="modal-confirm-password"
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
      </div>
    </div>
  );
}
