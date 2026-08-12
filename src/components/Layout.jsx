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
          <div className="page-transition" key={location.pathname}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
