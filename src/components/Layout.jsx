import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
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
