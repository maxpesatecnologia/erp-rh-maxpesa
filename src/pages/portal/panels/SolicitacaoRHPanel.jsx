import { useState } from "react";
import { Send } from "lucide-react";
import DataTable from "../../../components/DataTable";
import { MINHAS_SOLICITACOES_RH } from "../../../data/mock/portal";
import { formatDate } from "../../../utils/format";

const CATEGORIAS = ["Declaração", "Benefícios", "Alteração cadastral", "Dúvida administrativa", "Outro"];

const STATUS_BADGE = {
  Aberta: "badge-info",
  "Em atendimento": "badge-warning",
  Concluída: "badge-success",
};

export default function SolicitacaoRHPanel() {
  const [tickets, setTickets] = useState(MINHAS_SOLICITACOES_RH);
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");

  function enviar(e) {
    e.preventDefault();
    if (!assunto.trim()) return;
    const novo = {
      id: `RH-2026-${String(1000 + tickets.length).slice(-4)}`,
      categoria,
      assunto,
      status: "Aberta",
      abertoEm: new Date().toISOString().slice(0, 10),
    };
    setTickets([novo, ...tickets]);
    setAssunto("");
    setMensagem("");
  }

  return (
    <div>
      <div className="section-title">Abrir solicitação ao RH</div>
      <div className="section-hint" style={{ marginBottom: 14 }}>Dúvidas, declarações e pedidos administrativos.</div>

      <form onSubmit={enviar}>
        <div className="form-grid">
          <div className="field-group">
            <label>Categoria</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label>Assunto</label>
            <input value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder="Ex.: Declaração de vínculo empregatício" required />
          </div>
        </div>
        <div className="field-group">
          <label>Mensagem (opcional)</label>
          <input value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Detalhe sua solicitação..." />
        </div>
        <div className="panel-actions">
          <button className="btn btn-primary" type="submit">
            <Send size={14} /> Enviar solicitação
          </button>
        </div>
      </form>

      <div className="panel-fieldset">
        <div className="panel-fieldset-title">Minhas solicitações</div>
        <DataTable
          columns={[
            { key: "id", label: "Protocolo" },
            { key: "categoria", label: "Categoria" },
            { key: "assunto", label: "Assunto" },
            { key: "abertoEm", label: "Aberto em", render: (row) => formatDate(row.abertoEm) },
            { key: "status", label: "Status", render: (row) => <span className={`badge ${STATUS_BADGE[row.status]}`}>{row.status}</span> },
          ]}
          rows={tickets}
          rowKey="id"
        />
      </div>
    </div>
  );
}
