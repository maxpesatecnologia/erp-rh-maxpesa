import SourceTag from "../../components/SourceTag";
import { COMUNICADOS, ANIVERSARIANTES, ENQUETES } from "../../data/mock/comunicacao";

export default function ComunicacaoInterna() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Comunicação Interna</h1>
          <div className="page-subtitle">Mural, comunicados, notícias, enquetes, aniversariantes e calendário</div>
        </div>
        <SourceTag path="SharePoint / Comunicacao / Mural" />
      </div>

      <div className="grid grid-2">
        <div className="card card-pad">
          <div className="section-title">Mural de comunicados</div>
          {COMUNICADOS.map((c) => (
            <div className="mural-item" key={c.id}>
              <h3>{c.titulo}</h3>
              <div className="mural-meta">{c.autor} · {c.data}</div>
              <p>{c.conteudo}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="card card-pad" style={{ marginBottom: 18 }}>
            <div className="section-title">🎂 Aniversariantes</div>
            {ANIVERSARIANTES.map((a) => (
              <div key={a.nome} style={{ fontSize: 13, padding: "6px 0" }}>
                {a.nome} — {a.data}
              </div>
            ))}
          </div>

          <div className="card card-pad">
            <div className="section-title">📊 Enquete ativa</div>
            {ENQUETES.map((enq) => {
              const total = enq.opcoes.reduce((sum, o) => sum + o.votos, 0);
              return (
                <div key={enq.id}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{enq.pergunta}</div>
                  {enq.opcoes.map((op) => {
                    const pct = Math.round((op.votos / total) * 100);
                    return (
                      <div key={op.texto} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                          <span>{op.texto}</span>
                          <span>{pct}%</span>
                        </div>
                        <div style={{ background: "#eef1f4", borderRadius: 6, height: 8, marginTop: 4 }}>
                          <div style={{ background: "var(--color-accent)", width: `${pct}%`, height: 8, borderRadius: 6 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
