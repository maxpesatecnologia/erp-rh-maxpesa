import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, LogOut, KeyRound, Menu } from "lucide-react";
import { ROLE_LABELS } from "../config/modules";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import TrocarSenhaModal from "./TrocarSenhaModal";
import { formatFilial } from "../utils/format";

export default function Topbar({ onMenuClick }) {
  const { user, signOut, isSupabaseConfigured } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const initials = user?.nome
    ? user.nome
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : "?";

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
        <button className="icon-btn menu-toggle" onClick={onMenuClick} aria-label="Abrir menu">
          <Menu size={16} />
        </button>
        <div className="topbar-title">Sistema de Gestão de RH</div>
      </div>
      <div className="topbar-right">
        {user && (
          <div className="user-chip" title={`${user.nome} · ${ROLE_LABELS[user.role] ?? user.role} · ${formatFilial(user.filial)}`}>
            <div className="user-meta">
              <div className="user-name">{user.nome}</div>
              <div className="user-role">{ROLE_LABELS[user.role] ?? user.role} · {formatFilial(user.filial)}</div>
            </div>
            <div className="user-avatar">{initials}</div>
          </div>
        )}
        {isSupabaseConfigured && (
          <button
            className="icon-btn"
            onClick={() => setShowPasswordModal(true)}
            title="Trocar senha"
            aria-label="Trocar senha"
          >
            <KeyRound size={15} />
          </button>
        )}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
          aria-label="Alternar tema"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button className="icon-btn icon-btn-danger" onClick={handleLogout} title="Sair" aria-label="Sair">
          <LogOut size={15} />
        </button>
      </div>

      {showPasswordModal && <TrocarSenhaModal onClose={() => setShowPasswordModal(false)} />}
    </header>
  );
}
