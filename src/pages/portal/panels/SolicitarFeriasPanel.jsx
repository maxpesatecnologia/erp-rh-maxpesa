import { useState } from "react";
import { Send } from "lucide-react";
import DataTable from "../../../components/DataTable";
import { SALDO_FERIAS, MINHAS_SOLICITACOES_FERIAS } from "../../../data/mock/portal";
import { formatDate } from "../../../utils/format";

const STATUS_BADGE = {
  Aprovada: "badge-success",
  Pendente: "badge-warning",
  Recusada: "badge-danger",
};

function diasEntre(inicio, fim) {
  if (!inicio || !fim) return 0;
  const diff = (new Date(fim) - new Date(inicio)) / (1000 * 60 * 60 * 24);
  return diff > 0 ? diff + 1 : 0;
}

export default function SolicitarFeriasPanel() {
  const [solicitacoes, setSolicitacoes] = useState(MINHAS_SOLICITACOES_FERIAS);
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState("");

  const dias = diasEntre(inicio, fim);

  function enviar(e) {
    e.preventDefault();
    if (!inicio || !fim || dias <= 0) {
      setErro("Informe um período de férias válido.");
      return;
    }
    if (dias > SALDO_FERIAS.diasDisponiveis) {
      setErro(`Saldo insuficiente: você tem ${SALDO_FERIAS.diasDisponiveis} dias disponíveis.`);
      return;
    }
    setErro("");
    const novo = {
      id: `FER-${100 + solicitacoes.length + 20}`,
      periodo: `${formatDate(inicio)} a ${formatDate(fim)}`,
      dias,
      status: "Pendente",
      solicitadoEm: new Date().toISOString().slice(0, 10),
    };
    setSolicitacoes([novo, ...solicitacoes]);
    setInicio("");
    setFim("");
    setObservacao("");
  }

  return (
    <div>
      <div className="section-title">Solicitar férias</div>
      <div className="section-hint" style={{ marginBottom: 14 }}>
        Saldo disponível: <strong>{SALDO_FERIAS.diasDisponiveis} dias</strong> · período aquisitivo {SALDO_FERIAS.periodoAquisitivo}
      </div>

      <form onSubmit={enviar}>
        <div className="form-grid">
          <div className="field-group">
            <label>Data de início</label>
            <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
          </div>
          <div className="field-group">
            <label>Data de término</label>
            <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} required />
          </div>
          <div className="field-group">
            <label>Dias corridos</label>
            <div className="field-static">{dias > 0 ? `${dias} dias` : "—"}</div>
          </div>
        </div>
        <div className="field-group">
          <label>Observação (opcional)</label>
          <input value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex.: viagem em família, preferência de retorno..." />
        </div>

        {erro && <div className="inline-banner danger">{erro}</div>}

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
            { key: "periodo", label: "Período" },
            { key: "dias", label: "Dias" },
            { key: "solicitadoEm", label: "Solicitado em", render: (row) => formatDate(row.solicitadoEm) },
            { key: "status", label: "Status", render: (row) => <span className={`badge ${STATUS_BADGE[row.status]}`}>{row.status}</span> },
          ]}
          rows={solicitacoes}
          rowKey="id"
        />
      </div>
    </div>
  );
}
