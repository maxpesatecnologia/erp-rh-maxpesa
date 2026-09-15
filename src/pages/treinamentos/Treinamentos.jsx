import { useMemo, useState } from "react";
import { Bell, Plus, Trash2 } from "lucide-react";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import NovoTreinamentoModal from "./NovoTreinamentoModal";
import { TREINAMENTOS } from "../../data/mock/treinamentos";
import { formatDate, diasAte } from "../../utils/format";

const FILTROS_STATUS = ["Todos", "Válido", "Vencendo", "Vencido", "Concluído"];

function statusDoTreinamento(validade) {
  if (!validade) return "Concluído";
  const dias = diasAte(validade);
  if (dias < 0) return "Vencido";
  if (dias <= 60) return "Vencendo";
  return "Válido";
}

let proximoId = TREINAMENTOS.length + 1;

export default function Treinamentos() {
  const [treinamentos, setTreinamentos] = useState(TREINAMENTOS);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [novoAberto, setNovoAberto] = useState(false);
  const [paraExcluir, setParaExcluir] = useState(null);

  const linhas = useMemo(
    () => treinamentos.map((t) => ({ ...t, status: statusDoTreinamento(t.validade) })),
    [treinamentos]
  );

  const linhasFiltradas =
    filtroStatus === "Todos" ? linhas : linhas.filter((t) => t.status === filtroStatus);

  const alertas = linhas.filter((t) => t.status === "Vencendo" || t.status === "Vencido").length;

  function handleRegistrar(dados) {
    setTreinamentos((atual) => [...atual, { id: proximoId++, ...dados }]);
    setNovoAberto(false);
  }

  function confirmarExclusao() {
    setTreinamentos((atual) => atual.filter((t) => t.id !== paraExcluir.id));
    setParaExcluir(null);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Treinamentos</h1>
          <div className="page-subtitle">Cursos, certificados, reciclagens de NR e controle de validade</div>
        </div>
        <button
          className="btn btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={() => setNovoAberto(true)}
        >
          <Plus size={16} /> Novo treinamento
        </button>
      </div>

      <div className="card card-pad">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Treinamentos e certificações</div>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} style={{ width: "auto" }}>
            {FILTROS_STATUS.map((s) => (
              <option key={s} value={s}>
                {s === "Todos" ? "Todos os status" : s}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          columns={[
            { key: "colaborador", label: "Colaborador" },
            { key: "curso", label: "Curso" },
            { key: "tipo", label: "Tipo" },
            { key: "cargaHoraria", label: "Carga horária (h)" },
            { key: "conclusao", label: "Conclusão", render: (r) => formatDate(r.conclusao) },
            { key: "validade", label: "Validade", render: (r) => (r.validade ? formatDate(r.validade) : "—") },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            {
              key: "acao",
              label: "",
              render: (r) => (
                <button
                  className="icon-btn"
                  aria-label="Excluir treinamento"
                  onClick={() => setParaExcluir(r)}
                >
                  <Trash2 size={15} />
                </button>
              ),
            },
          ]}
          rows={linhasFiltradas}
        />
      </div>

      <div className="card card-pad" style={{ marginTop: 18, fontSize: 12.5, color: "var(--color-text-muted)", display: "flex", alignItems: "flex-start", gap: 8 }}>
        <Bell size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          {alertas > 0 ? (
            <>
              <strong>{alertas}</strong> {alertas === 1 ? "colaborador está" : "colaboradores estão"} com treinamento
              "Vencendo" ou "Vencido" — sinalizados aqui para acompanhamento do RH.{" "}
            </>
          ) : null}
          Alertas automáticos: colaboradores com treinamentos "Vencendo" ou "Vencido" são notificados
          e sinalizados no módulo de Gestão de Equipes para bloqueio operacional.
        </span>
      </div>

      {novoAberto && (
        <NovoTreinamentoModal onFechar={() => setNovoAberto(false)} onConfirmar={handleRegistrar} />
      )}

      {paraExcluir && (
        <ConfirmDeleteModal
          titulo="Excluir treinamento"
          mensagem={`Tem certeza que deseja excluir o registro de "${paraExcluir.curso}" de ${paraExcluir.colaborador}? Essa ação não pode ser desfeita.`}
          onConfirmar={confirmarExclusao}
          onCancelar={() => setParaExcluir(null)}
        />
      )}
    </div>
  );
}
