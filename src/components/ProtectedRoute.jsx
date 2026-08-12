import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canAccess } from "../config/modules";
import Layout from "./Layout";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: 40 }}>Carregando…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const allowed = canAccess(location.pathname, user.role);

  return (
    <Layout>
      {allowed ? (
        children
      ) : (
        <div className="access-denied">
          <div className="icon-lock">🔒</div>
          <h2>Acesso restrito</h2>
          <p>
            Seu perfil ("{user.role}") não tem permissão para acessar este módulo.
            <br />
            Fale com o RH ou administrador do sistema se precisar de acesso.
          </p>
        </div>
      )}
    </Layout>
  );
}
