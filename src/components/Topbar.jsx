import { useNavigate } from "react-router-dom";
import { Moon, Sun, LogOut } from "lucide-react";
import { ROLE_LABELS } from "../config/modules";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Topbar() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
      <div className="topbar-title">Sistema de Gestão de RH</div>
      <div className="topbar-right">
        {user && (
          <div className="user-chip" title={`${user.nome} · ${ROLE_LABELS[user.role] ?? user.role} · ${user.filial}`}>
            <div className="user-meta">
              <div className="user-name">{user.nome}</div>
              <div className="user-role">{ROLE_LABELS[user.role] ?? user.role} · {user.filial}</div>
            </div>
            <div className="user-avatar">{initials}</div>
          </div>
        )}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
          aria-label="Alternar tema"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button className="icon-btn icon-btn-danger" onClick={handleLogout} title="Sair" aria-label="Sair">
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
