import { useState } from "react";
import { X } from "lucide-react";
import { DIAS_DIREITO_PERIODO } from "../../lib/feriasCalculo";

export default function AjustarSaldoFeriasModal({ colaborador, saldo, onFechar, onSalvar, salvando = false, erro = "" }) {
  const [ajusteDias, setAjusteDias] = useState(String(colaborador.feriasAjusteDias ?? 0));
  const [motivo, setMotivo] = useState(colaborador.feriasAjusteMotivo ?? "");
  const [historicoOk, setHistoricoOk] = useState(Boolean(colaborador.feriasHistoricoOk));

  const ajusteNumero = Number(ajusteDias) || 0;
  const diasUsadosAutomaticos = saldo.diasUsados - (saldo.ajusteDias ?? 0);
  const novoDiasUsados = diasUsadosAutomaticos + ajusteNumero;
  const novoSaldo = Math.max(0, DIAS_DIREITO_PERIODO - novoDiasUsados);

  function handleSubmit(e) {
    e.preventDefault();
    onSalvar(ajusteNumero, motivo.trim(), historicoOk);
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>Ajustar saldo — {colaborador.nome}</h3>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onFechar}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

          <div className="section-hint" style={{ marginBottom: 14 }}>
            Uso temporário, pra ajustar o saldo enquanto o histórico de férias (gente que já está de férias ou já
            tirou dias antes deste módulo existir) ainda não está todo lançado como solicitação. Some aos dias
            calculados automaticamente — pode zerar aqui depois que corrigir/lançar tudo.
          </div>

          <div className="form-grid">
            <div className="field-group">
              <label>Dias a somar aos usados</label>
              <input
                type="number"
                value={ajusteDias}
                onChange={(e) => setAjusteDias(e.target.value)}
                placeholder="Ex.: 15"
              />
            </div>
            <div className="field-group">
              <label>Saldo resultante</label>
              <div className="field-static">{novoSaldo} dias disponíveis ({novoDiasUsados} usados)</div>
            </div>
          </div>

          <div className="field-group">
            <label>Motivo do ajuste</label>
            <textarea
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: já está de férias desde 01/09, período lançado depois em uma solicitação retroativa"
            />
          </div>

          <div className="field-group">
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontWeight: 400 }}>
              <input
                type="checkbox"
                checked={historicoOk}
                onChange={(e) => setHistoricoOk(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>
                Sem pendência de férias de anos anteriores (histórico antes deste sistema já está regularizado) —
                some se ele aparecer com "férias vencidas" só por falta de solicitações antigas lançadas aqui.
              </span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onFechar} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar ajuste"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
