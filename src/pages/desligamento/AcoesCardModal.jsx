import { X, Paperclip, ListChecks, History, Undo2 } from "lucide-react";
import UltimaEdicaoBadge from "../../components/UltimaEdicaoBadge";

export default function AcoesCardModal({
  colaborador,
  desligamento,
  temDocumento,
  isConcluido,
  onAnexarDocumento,
  onEnviarChecklist,
  onVerHistorico,
  onCancelar,
  onFechar,
}) {
  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <h3 style={{ margin: 0 }}>Ações — {colaborador?.nome ?? "Colaborador não encontrado"}</h3>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onFechar}>
            <X size={18} />
          </button>
        </div>

        <div style={{ marginBottom: 18 }}>
          <UltimaEdicaoBadge
            nome={desligamento.atualizadoPor}
            data={desligamento.atualizadoEm}
            tabela="rh_desligamentos"
            registroId={desligamento.id}
            titulo={colaborador?.nome}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {temDocumento && (
            <button type="button" className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }} onClick={onAnexarDocumento}>
              <Paperclip size={14} /> Anexar documento
            </button>
          )}
          {isConcluido && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={desligamento.emChecklist}
              onClick={onEnviarChecklist}
            >
              <ListChecks size={14} /> {desligamento.emChecklist ? "Enviado ao checklist" : "Enviar para o checklist"}
            </button>
          )}
          <button type="button" className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }} onClick={onVerHistorico}>
            <History size={14} /> Ver histórico
          </button>
          <button type="button" className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }} onClick={onCancelar}>
            <Undo2 size={14} /> Cancelar desligamento
          </button>
        </div>
      </div>
    </div>
  );
}
