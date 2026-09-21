import { useState } from "react";
import { Clock } from "lucide-react";
import { formatDataHora } from "../utils/format";
import HistoricoAuditoriaModal from "./HistoricoAuditoriaModal";

// Badge "no cantinho" de cada registro (linha de tabela, card, cabeçalho de
// modal de edição) mostrando quem editou por último e quando. Clicável: abre
// o histórico completo daquele registro (HistoricoAuditoriaModal), com todos
// os campos que mudaram em cada alteração — não só a última.
export default function UltimaEdicaoBadge({ nome, data, tabela, registroId, titulo }) {
  const [historicoAberto, setHistoricoAberto] = useState(false);

  // maxWidth + minWidth: 0 no botão e o texto num span com ellipsis — sem isso,
  // um nome longo estoura a largura de cards estreitos (Kanban) em vez de
  // encolher, "quebrando" o layout do card. Trunca com "…"; o texto completo
  // continua no title (hover) e por inteiro no histórico que abre ao clicar.
  if (!nome && !data) {
    return (
      <span
        className="badge badge-neutral"
        style={{ maxWidth: "100%" }}
        title="Nenhuma edição registrada desde que este recurso foi ativado"
      >
        <Clock size={12} style={{ flexShrink: 0 }} /> Sem registro
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        className="badge badge-neutral"
        style={{ border: "none", cursor: "pointer", maxWidth: "100%", minWidth: 0 }}
        onClick={(e) => {
          e.stopPropagation();
          setHistoricoAberto(true);
        }}
        title={`Editado por ${nome || "—"} · ${formatDataHora(data)} — ver histórico completo`}
      >
        <Clock size={12} style={{ flexShrink: 0 }} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
          Editado por {nome || "—"} · {formatDataHora(data)}
        </span>
      </button>
      {historicoAberto && (
        <HistoricoAuditoriaModal
          titulo={titulo || "registro"}
          tabela={tabela}
          registroId={registroId}
          onFechar={() => setHistoricoAberto(false)}
        />
      )}
    </>
  );
}
