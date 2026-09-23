import { useState } from "react";
import { FileCheck2, PenLine } from "lucide-react";
import { DOCUMENTOS_PARA_ASSINAR } from "../../../data/mock/portal";
import { formatDate } from "../../../utils/format";

export default function AssinarDocumentosPanel() {
  const [pendentes, setPendentes] = useState(DOCUMENTOS_PARA_ASSINAR);
  const [assinados, setAssinados] = useState([]);

  function assinar(doc) {
    setPendentes((prev) => prev.filter((d) => d.id !== doc.id));
    setAssinados((prev) => [{ ...doc, assinadoEm: new Date().toISOString().slice(0, 10) }, ...prev]);
  }

  return (
    <div>
      <div className="section-title">Assinar documentos</div>
      <div className="section-hint" style={{ marginBottom: 14 }}>Documentos pendentes de assinatura eletrônica.</div>

      {pendentes.length === 0 && (
        <div className="empty-state">
          <FileCheck2 size={22} />
          Nenhum documento pendente de assinatura.
        </div>
      )}

      <div className="doc-list">
        {pendentes.map((doc) => (
          <div className="doc-row" key={doc.id}>
            <div className="doc-row-icon">
              <PenLine size={16} />
            </div>
            <div className="doc-row-info">
              <div className="doc-row-title" title={doc.nome}>{doc.nome}</div>
              <div className="doc-row-meta">{doc.tipo} · enviado em {formatDate(doc.enviadoEm)}</div>
            </div>
            <button className="btn btn-primary" onClick={() => assinar(doc)}>
              Assinar
            </button>
          </div>
        ))}
      </div>

      {assinados.length > 0 && (
        <div className="panel-fieldset">
          <div className="panel-fieldset-title">Assinados agora</div>
          <div className="doc-list">
            {assinados.map((doc) => (
              <div className="doc-row" key={doc.id}>
                <div className="doc-row-icon done">
                  <FileCheck2 size={16} />
                </div>
                <div className="doc-row-info">
                  <div className="doc-row-title" title={doc.nome}>{doc.nome}</div>
                  <div className="doc-row-meta">{doc.tipo} · assinado em {formatDate(doc.assinadoEm)}</div>
                </div>
                <span className="badge badge-success">Assinado</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
