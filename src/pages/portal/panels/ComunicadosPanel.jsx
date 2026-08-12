import { Cake } from "lucide-react";
import { COMUNICADOS, ANIVERSARIANTES } from "../../../data/mock/comunicacao";
import { formatDate } from "../../../utils/format";

export default function ComunicadosPanel() {
  return (
    <div>
      <div className="section-title">Comunicados</div>
      <div className="section-hint" style={{ marginBottom: 14 }}>Mural, notícias e avisos do RH.</div>

      <div className="form-grid" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }}>
        <div>
          {COMUNICADOS.map((c) => (
            <div className="mural-item" key={c.id}>
              <h3>{c.titulo}</h3>
              <div className="mural-meta">
                {c.autor} · {formatDate(c.data)}
              </div>
              <p>{c.conteudo}</p>
            </div>
          ))}
        </div>
        <div className="panel-fieldset" style={{ marginTop: 0 }}>
          <div className="panel-fieldset-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Cake size={15} /> Aniversariantes
          </div>
          {ANIVERSARIANTES.map((a) => (
            <div key={a.nome} style={{ fontSize: 13, padding: "6px 0" }}>
              {a.nome} — {formatDate(a.data)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
