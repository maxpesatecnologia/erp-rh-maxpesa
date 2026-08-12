import { useLocation, useNavigate } from "react-router-dom";
import { ALL_MODULES, ROLE_LABELS } from "../config/modules";
import { useAuth } from "../context/AuthContext";

export default function Topbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const current = ALL_MODULES.find((m) => m.path === location.pathname);
  const title = current ? current.label : "Maxpesa | ERP RH";

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
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">
        {user && (
          <div className="user-chip">
            <div className="user-avatar">{initials}</div>
            <div className="user-meta">
              <div className="user-name">{user.nome}</div>
              <div className="user-role">{ROLE_LABELS[user.role] ?? user.role} · {user.filial}</div>
            </div>
          </div>
        )}
        <button className="btn-logout" onClick={handleLogout}>
          Sair
        </button>
      </div>
    </header>
  );
}
