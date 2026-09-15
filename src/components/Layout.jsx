import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Sidebar open={menuAberto} onNavigate={() => setMenuAberto(false)} />
      <div className={`sidebar-backdrop ${menuAberto ? "open" : ""}`} onClick={() => setMenuAberto(false)} />
      <div className="app-main">
        <Topbar onMenuClick={() => setMenuAberto((v) => !v)} />
        <main className="app-content">
          <div className="page-deco" aria-hidden="true">
            <span className="page-deco-dots" />
            <span className="page-deco-bar" style={{ right: "34%" }} />
            <span className="page-deco-bar" style={{ right: "22%" }} />
            <span className="page-deco-line" style={{ right: "10%" }} />
          </div>
          <div className="page-transition" key={location.pathname}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
