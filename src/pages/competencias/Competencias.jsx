import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import Avatar from "../../components/Avatar";
import { COLABORADORES } from "../../data/mock/colaboradores";
import { listarColaboradores } from "../../lib/colaboradoresApi";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

// Remove acentos pra comparar termos de busca sem depender de como foram digitados.
function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase();
}

// Junta NRs, certificações, equipamentos e CNH num único conjunto de
// "competências" do colaborador, cada uma com um tipo pra exibir na legenda.
function competenciasDoColaborador(colaborador) {
  const lista = [];
  (colaborador.nrs || []).forEach((valor) => lista.push({ tipo: "NR", valor }));
  (colaborador.certificacoes || []).forEach((valor) => lista.push({ tipo: "Certificação", valor }));
  (colaborador.equipamentos || []).forEach((valor) => lista.push({ tipo: "Equipamento", valor }));
  if (colaborador.cnh?.categoria) {
    lista.push({ tipo: "CNH", valor: `CNH ${colaborador.cnh.categoria}` });
  }
  return lista;
}

export default function Competencias() {
  const navigate = useNavigate();
  const [colaboradores, setColaboradores] = useState(isSupabaseConfigured ? [] : COLABORADORES);
  const [carregando, setCarregando] = useState(isSupabaseConfigured);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    listarColaboradores()
      .then(setColaboradores)
      .catch((erro) => setErroCarregamento(erro.message))
      .finally(() => setCarregando(false));
  }, []);

  const pessoas = useMemo(() => {
    return colaboradores
      .filter((c) => c.status !== "Desligado")
      .map((c) => ({ ...c, competencias: competenciasDoColaborador(c) }));
  }, [colaboradores]);

  const termo = normalizar(busca.trim());

  const pessoasFiltradas = useMemo(() => {
    if (!termo) return pessoas;
    return pessoas.filter(
      (c) =>
        normalizar(c.nome).includes(termo) ||
        normalizar(c.cargo).includes(termo) ||
        normalizar(c.filial).includes(termo) ||
        c.competencias.some((comp) => normalizar(comp.valor).includes(termo))
    );
  }, [pessoas, termo]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Competências</h1>
          <div className="page-subtitle">
            Todos os colaboradores e as competências registradas — NRs, certificações, equipamentos
            habilitados e CNH. Busque por uma competência para ver quem está habilitado.
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="section-title">Colaboradores</div>
        <div style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 14 }}>
          Lista puxada do cadastro de colaboradores. Para incluir ou atualizar as competências de
          alguém, edite o colaborador em{" "}
          <button
            type="button"
            onClick={() => navigate("/colaboradores")}
            style={{
              display: "inline",
              padding: 0,
              border: "none",
              background: "none",
              font: "inherit",
              color: "var(--color-accent)",
              cursor: "pointer",
            }}
          >
            Cadastro de Colaboradores
          </button>
          .
        </div>
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por competência (ex: NR-35, Munck) ou por nome, cargo, filial…"
            aria-label="Buscar competência ou colaborador"
          />
          {busca && (
            <button type="button" className="search-clear" onClick={() => setBusca("")} aria-label="Limpar busca">
              <X size={14} />
            </button>
          )}
        </div>
        {termo && (
          <div className="section-hint" style={{ marginBottom: 10 }}>
            {pessoasFiltradas.length} colaborador(es) encontrado(s) para "{busca.trim()}".
          </div>
        )}
        {erroCarregamento && <div className="login-error" style={{ marginBottom: 14 }}>{erroCarregamento}</div>}
        {carregando ? (
          <div className="section-hint">Carregando colaboradores…</div>
        ) : pessoasFiltradas.length === 0 ? (
          <div className="section-hint">Nenhum colaborador encontrado.</div>
        ) : (
          <DataTable
            columns={[
              { key: "id", label: "Matrícula" },
              {
                key: "nome",
                label: "Nome",
                render: (r) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar nome={r.nome} foto={r.foto} size={28} />
                    <span>{r.nome}</span>
                  </div>
                ),
              },
              { key: "cargo", label: "Cargo" },
              { key: "filial", label: "Filial" },
              {
                key: "competencias",
                label: "Competências",
                render: (r) =>
                  r.competencias.length > 0 ? (
                    <div className="chip-row">
                      {r.competencias.map((comp, i) => {
                        const combina = termo && normalizar(comp.valor).includes(termo);
                        return (
                          <span
                            className={`equip-chip competencia-chip-${comp.tipo.toLowerCase()}${combina ? " competencia-chip-match" : ""}`}
                            key={`${comp.tipo}-${comp.valor}-${i}`}
                            title={comp.tipo}
                          >
                            {comp.valor}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    "—"
                  ),
              },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={pessoasFiltradas}
          />
        )}
      </div>
    </div>
  );
}
