import { useState } from "react";
import { Clock } from "lucide-react";
import { formatDataHora } from "../utils/format";
import HistoricoAuditoriaModal from "./HistoricoAuditoriaModal";

// Badge "no cantinho" de cada registro (linha de tabela, card, cabeçalho de
// modal de edição) mostrando quem editou por último e quando. Clicável: abre
// o histórico completo daquele registro (HistoricoAuditoriaModal), com todos
// os campos que mudaram em cada alteração — não só a última.
//
// iconOnly: mesmo clique e mesmo modal, mas sem o texto "Editado por Fulano ·
// data" — só o ícone, do tamanho de um .icon-btn. Usado em cabeçalhos já
// lotados de outros ícones fixos (ex.: card de Admissão Digital), onde o
// texto não tem como encolher o suficiente e acaba quebrando o layout do card.
export default function UltimaEdicaoBadge({ nome, data, tabela, registroId, titulo, iconOnly = false }) {
  const [historicoAberto, setHistoricoAberto] = useState(false);

  if (!nome && !data) {
    return iconOnly ? null : (
      <span
        className="badge badge-neutral"
        style={{ maxWidth: "100%" }}
        title="Nenhuma edição registrada desde que este recurso foi ativado"
      >
        <Clock size={12} style={{ flexShrink: 0 }} /> Sem registro
      </span>
    );
  }

  const titleTexto = `Editado por ${nome || "—"} · ${formatDataHora(data)} — ver histórico completo`;

  return (
    <>
      {iconOnly ? (
        <button
          type="button"
          className="icon-btn"
          aria-label={titleTexto}
          title={titleTexto}
          onClick={(e) => {
            e.stopPropagation();
            setHistoricoAberto(true);
          }}
        >
          <Clock size={16} />
        </button>
      ) : (
        <button
          type="button"
          className="badge badge-neutral"
          style={{ border: "none", cursor: "pointer", maxWidth: "100%", minWidth: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            setHistoricoAberto(true);
          }}
          title={titleTexto}
        >
          <Clock size={12} style={{ flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
            Editado por {nome || "—"} · {formatDataHora(data)}
          </span>
        </button>
      )}
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
