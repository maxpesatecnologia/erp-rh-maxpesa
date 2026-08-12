import SourceTag from "../../components/SourceTag";
import { ADMISSOES } from "../../data/mock/admissao";

const CHECKLIST_LABELS = {
  dadosPessoais: "Dados pessoais",
  documentos: "Upload de documentos",
  exameAdmissional: "Exame admissional",
  assinaturaContrato: "Assinatura eletrônica do contrato",
  integracaoDominio: "Envio ao Domínio Sistemas",
};

export default function AdmissaoDigital() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admissão Digital</h1>
          <div className="page-subtitle">Checklist, upload de documentos, assinatura eletrônica e workflow de aprovação</div>
        </div>
        <SourceTag path="SharePoint / RH / Admissao_Digital / Checklist_Admissoes.xlsx → Domínio Sistemas" />
      </div>

      <div className="grid grid-2">
        {ADMISSOES.map((adm) => {
          const etapas = Object.entries(adm.checklist);
          const concluidas = etapas.filter(([, v]) => v).length;
          return (
            <div className="card card-pad" key={adm.id}>
              <div className="section-title">
                {adm.nome} <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>— {adm.cargo}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 12 }}>
                {adm.filial} · Admissão prevista: {adm.dataPrevista} · {concluidas}/{etapas.length} etapas concluídas
              </div>
              {etapas.map(([key, done]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 13 }}>
                  <span>{done ? "✅" : "⬜"}</span>
                  <span>{CHECKLIST_LABELS[key]}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
