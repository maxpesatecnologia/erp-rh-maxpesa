import { useRef, useState } from "react";
import { UploadCloud, FileText } from "lucide-react";
import { MEUS_DOCUMENTOS_ENVIADOS } from "../../../data/mock/portal";
import { formatDate } from "../../../utils/format";

const TIPOS = ["Atestado médico", "Comprovante de residência", "Certificado de treinamento", "Outro"];

const STATUS_BADGE = {
  Aprovado: "badge-success",
  "Em análise": "badge-warning",
  Recusado: "badge-danger",
};

export default function EnviarDocumentosPanel() {
  const [enviados, setEnviados] = useState(MEUS_DOCUMENTOS_ENVIADOS);
  const [arquivo, setArquivo] = useState(null);
  const [tipo, setTipo] = useState(TIPOS[0]);
  const inputRef = useRef(null);

  function enviar(e) {
    e.preventDefault();
    if (!arquivo) return;
    const novo = {
      id: `UP-${100 + enviados.length}`,
      nome: arquivo.name,
      tipo,
      enviadoEm: new Date().toISOString().slice(0, 10),
      status: "Em análise",
    };
    setEnviados([novo, ...enviados]);
    setArquivo(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <div className="section-title">Enviar documentos</div>
      <div className="section-hint" style={{ marginBottom: 14 }}>Upload de atestados, comprovantes e certificados para análise do RH.</div>

      <form onSubmit={enviar}>
        <div className="form-grid">
          <div className="field-group">
            <label>Tipo de documento</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="upload-drop" htmlFor="portal-upload-input">
          <UploadCloud size={22} />
          <span>{arquivo ? arquivo.name : "Clique para selecionar um arquivo (PDF, JPG ou PNG)"}</span>
          <input
            id="portal-upload-input"
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            style={{ display: "none" }}
          />
        </label>

        <div className="panel-actions">
          <button className="btn btn-primary" type="submit" disabled={!arquivo}>
            Enviar documento
          </button>
        </div>
      </form>

      <div className="panel-fieldset">
        <div className="panel-fieldset-title">Documentos enviados</div>
        <div className="doc-list">
          {enviados.map((doc) => (
            <div className="doc-row" key={doc.id}>
              <div className="doc-row-icon">
                <FileText size={16} />
              </div>
              <div className="doc-row-info">
                <div className="doc-row-title">{doc.nome}</div>
                <div className="doc-row-meta">{doc.tipo} · enviado em {formatDate(doc.enviadoEm)}</div>
              </div>
              <span className={`badge ${STATUS_BADGE[doc.status]}`}>{doc.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
