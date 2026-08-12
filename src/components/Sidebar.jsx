import { NavLink } from "react-router-dom";
import { Lock } from "lucide-react";
import { NAV_SECTIONS } from "../config/modules";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Sidebar() {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img
          className="sidebar-brand-logo"
          src={theme === "dark" ? "/logo_branca.png" : "/maxpesa_logo_png.png"}
          alt="Grupo Maxpesa"
        />
        <div className="brand-tag">ERP · Recursos Humanos</div>
      </div>

      {NAV_SECTIONS.map((section) => (
        <div className="sidebar-section" key={section.title}>
          <div className="sidebar-section-title">{section.title}</div>
          {section.items.map((item) => {
            const allowed = user ? item.roles.includes(user.role) : false;
            const Icon = item.icon;
            if (!allowed) {
              return (
                <div className="sidebar-link sidebar-locked" key={item.path} title="Sem permissão para este perfil">
                  <span className="icon"><Icon size={16} /></span>
                  <span>{item.label}</span>
                  <Lock size={13} style={{ marginLeft: "auto" }} />
                </div>
              );
            }
            return (
              <NavLink
                to={item.path}
                key={item.path}
                className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
              >
                <span className="icon"><Icon size={16} /></span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
