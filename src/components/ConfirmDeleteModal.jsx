import { AlertTriangle } from "lucide-react";

export default function ConfirmDeleteModal({
  titulo = "Excluir registro",
  mensagem,
  confirmando = false,
  erro = "",
  textoConfirmar = "Excluir",
  textoConfirmando = "Excluindo…",
  onConfirmar,
  onCancelar,
}) {
  return (
    <div className="modal-backdrop" onClick={onCancelar}>
      <div className="modal-card modal-card-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon-circle danger">
          <AlertTriangle size={24} />
        </div>
        <h3>{titulo}</h3>
        <p>{mensagem}</p>
        {erro && <div className="inline-banner danger" style={{ textAlign: "left" }}>{erro}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onCancelar} disabled={confirmando}>
            Voltar
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirmar} disabled={confirmando}>
            {confirmando ? textoConfirmando : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
