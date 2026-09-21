import { NavLink } from "react-router-dom";
import { Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { NAV_SECTIONS } from "../config/modules";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Sidebar({ open, onNavigate, collapsed, onToggleCollapsed }) {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <aside className={`sidebar ${open ? "open" : ""} ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-main">
          <img
            className="sidebar-brand-logo"
            src={theme === "dark" ? "/logo_branca.png" : "/maxpesa_logo_png.png"}
            alt="Grupo Maxpesa"
          />
          <div className="brand-tag">ERP · Recursos Humanos</div>
        </div>
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={onToggleCollapsed}
          title={collapsed ? "Expandir menu" : "Recuar menu"}
          aria-label={collapsed ? "Expandir menu" : "Recuar menu"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {NAV_SECTIONS.map((section) => {
        // Itens com `hiddenIfNoAccess` (ex.: Logs de Auditoria) não seguem o
        // padrão "aparece bloqueado com cadeado" dos demais módulos — somem
        // do menu por completo para quem não tem o perfil exigido, em vez de
        // só ficar visível-mas-cinza (é intencional, ver README).
        const itensVisiveis = section.items.filter(
          (item) => !item.hiddenIfNoAccess || (user && item.roles.includes(user.role))
        );
        if (itensVisiveis.length === 0) return null;
        return (
        <div className="sidebar-section" key={section.title}>
          <div className="sidebar-section-title">{section.title}</div>
          {itensVisiveis.map((item) => {
            const allowed = user ? item.roles.includes(user.role) : false;
            const Icon = item.icon;
            if (!allowed) {
              return (
                <div
                  className="sidebar-link sidebar-locked"
                  key={item.path}
                  title={collapsed ? item.label : "Sem permissão para este perfil"}
                >
                  <span className="icon"><Icon size={16} /></span>
                  <span>{item.label}</span>
                  <Lock size={13} className="sidebar-lock-icon" />
                </div>
              );
            }
            return (
              <NavLink
                to={item.path}
                key={item.path}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
              >
                <span className="icon"><Icon size={16} /></span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
        );
      })}
    </aside>
  );
}
