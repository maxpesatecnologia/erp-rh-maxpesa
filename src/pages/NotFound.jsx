import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="access-denied">
      <div className="icon-lock">🧭</div>
      <h2>Página não encontrada</h2>
      <p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 14 }}>
          Voltar ao Dashboard
        </Link>
      </p>
    </div>
  );
}
