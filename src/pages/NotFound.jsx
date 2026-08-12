import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="access-denied">
      <div className="icon-lock"><Compass size={32} /></div>
      <h2>Página não encontrada</h2>
      <p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 14 }}>
          Voltar ao Dashboard
        </Link>
      </p>
    </div>
  );
}
