import { NavLink } from "react-router-dom";
import { NAV_SECTIONS } from "../config/modules";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">MP</div>
        <div className="sidebar-brand-text">
          <div className="brand-name">Maxpesa</div>
          <div className="brand-tag">ERP RH</div>
        </div>
      </div>

      {NAV_SECTIONS.map((section) => (
        <div className="sidebar-section" key={section.title}>
          <div className="sidebar-section-title">{section.title}</div>
          {section.items.map((item) => {
            const allowed = user ? item.roles.includes(user.role) : false;
            if (!allowed) {
              return (
                <div className="sidebar-link sidebar-locked" key={item.path} title="Sem permissão para este perfil">
                  <span className="icon">{item.icon}</span>
                  <span>{item.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11 }}>🔒</span>
                </div>
              );
            }
            return (
              <NavLink
                to={item.path}
                key={item.path}
                className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
              >
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
