import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, HeartPulse, AlertTriangle, CalendarClock, CheckCircle2, Paperclip, ExternalLink } from "lucide-react";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import StatTile from "../../components/StatTile";
import { listarAsosExternos, epiControleConfigured } from "../../lib/epiControleApi";
import { formatDate, formatDataHora, diasAte } from "../../utils/format";

const ABAS_STATUS = [
  { value: "todos", label: "Todos" },
  { value: "a-vencer", label: "A vencer" },
  { value: "vencidos", label: "Vencidos" },
];

function statusDoAso(aso) {
  if (aso.resultado === "Inapto") return "Inapto";
  if (!aso.vencimento) return "Válido";
  const dias = diasAte(aso.vencimento);
  if (dias < 0) return "Vencido";
  if (dias <= 30) return "Vencendo";
  return "Válido";
}

export default function MedicinaOcupacional() {
  const [asos, setAsos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [erro, setErro] = useState("");
  const [ultimaSincronizacao, setUltimaSincronizacao] = useState(null);
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState("todos");

  async function sincronizar() {
    setSincronizando(true);
    setErro("");
    try {
      const dados = await listarAsosExternos();
      setAsos(dados);
      setUltimaSincronizacao(new Date().toISOString());
    } catch (e) {
      setErro(e.message || "Não foi possível sincronizar com o EPI Controle.");
    } finally {
      setCarregando(false);
      setSincronizando(false);
    }
  }

  useEffect(() => {
    sincronizar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const asosComStatus = useMemo(() => asos.map((a) => ({ ...a, status: statusDoAso(a) })), [asos]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    let lista = asosComStatus;
    if (termo) {
      lista = lista.filter((a) =>
        [a.colaborador, a.empresa, a.setor, a.tipo, a.clinica].some((campo) =>
          String(campo || "").toLowerCase().includes(termo)
        )
      );
    }
    if (aba === "a-vencer") lista = lista.filter((a) => a.status === "Vencendo");
    if (aba === "vencidos") lista = lista.filter((a) => a.status === "Vencido");
    return lista;
  }, [asosComStatus, busca, aba]);

  const totais = useMemo(
    () => ({
      total: asosComStatus.length,
      vencidos: asosComStatus.filter((a) => a.status === "Vencido").length,
      venceEm30: asosComStatus.filter((a) => a.status === "Vencendo").length,
      emDia: asosComStatus.filter((a) => a.status === "Válido").length,
    }),
    [asosComStatus]
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Controle de ASO</h1>
          <div className="page-subtitle">
            Atestados de Saúde Ocupacional — {asosComStatus.length} registro(s)
            {!epiControleConfigured && " · dados de exemplo, aguardando integração com o EPI Controle"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <button
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={sincronizar}
            disabled={sincronizando}
          >
            <RefreshCw size={15} />
            {sincronizando ? "Atualizando…" : "Atualizar"}
          </button>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 }}>
            {ultimaSincronizacao ? `Última atualização: ${formatDataHora(ultimaSincronizacao)}` : "Ainda não sincronizado"}
          </div>
        </div>
      </div>

      {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        <StatTile icon={HeartPulse} label="Total de ASOs" value={totais.total} />
        <StatTile icon={AlertTriangle} label="Vencidos" value={totais.vencidos} />
        <StatTile icon={CalendarClock} label="Vencem em 30 dias" value={totais.venceEm30} />
        <StatTile icon={CheckCircle2} label="Em dia" value={totais.emDia} />
      </div>

      <div className="card card-pad">
        <div className="filter-row">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por colaborador, setor, empresa, tipo ou clínica…"
              aria-label="Buscar ASO"
            />
          </div>
          <div className="seg-toggle">
            {ABAS_STATUS.map((a) => (
              <button
                key={a.value}
                type="button"
                className={aba === a.value ? "active" : ""}
                onClick={() => setAba(a.value)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {carregando ? (
          <div className="section-hint">Carregando ASOs…</div>
        ) : (
          <DataTable
            columns={[
              { key: "colaborador", label: "Colaborador" },
              { key: "empresaSetor", label: "Empresa / Setor", render: (r) => `${r.empresa} • ${r.setor}` },
              { key: "tipo", label: "Tipo" },
              { key: "exame", label: "Exame", render: (r) => formatDate(r.exame) },
              { key: "vencimento", label: "Vencimento", render: (r) => (r.vencimento ? formatDate(r.vencimento) : "—") },
              { key: "resultado", label: "Resultado", render: (r) => <StatusBadge status={r.resultado} /> },
              { key: "clinica", label: "Clínica" },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
              {
                key: "anexo",
                label: "Anexo",
                render: (r) =>
                  r.anexoUrl ? (
                    <a
                      href={r.anexoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline"
                      style={{ padding: "5px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}
                    >
                      <Paperclip size={12} /> Abrir
                    </a>
                  ) : (
                    "—"
                  ),
              },
              {
                key: "acoes",
                label: "",
                render: () => (
                  <a
                    href="https://maxpesa-epi-controle.vercel.app/"
                    target="_blank"
                    rel="noreferrer"
                    className="icon-btn"
                    aria-label="Abrir no EPI Controle"
                    title="Abrir no EPI Controle"
                  >
                    <ExternalLink size={15} />
                  </a>
                ),
              },
            ]}
            rows={filtrados}
          />
        )}
      </div>
    </div>
  );
}
