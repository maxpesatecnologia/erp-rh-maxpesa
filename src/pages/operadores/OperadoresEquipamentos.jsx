import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import Avatar from "../../components/Avatar";
import { COLABORADORES } from "../../data/mock/colaboradores";
import { listarColaboradores } from "../../lib/colaboradoresApi";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

// Remove acentos pra comparar "Operação", "Operacional", "Operações" etc. sem
// depender de como o RH digitou o departamento (campo é texto livre).
function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase();
}

export default function OperadoresEquipamentos() {
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

  const operadores = useMemo(() => {
    return colaboradores.filter(
      (c) => c.status !== "Desligado" && normalizar(c.departamento).includes("opera")
    );
  }, [colaboradores]);

  const operadoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return operadores;
    return operadores.filter((c) =>
      [c.nome, c.cargo, c.filial, ...(c.equipamentos || [])].some((campo) =>
        String(campo || "").toLowerCase().includes(termo)
      )
    );
  }, [operadores, busca]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Operadores de Equipamentos</h1>
          <div className="page-subtitle">
            Colaboradores da operação e os equipamentos que cada um está habilitado a operar
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="section-title">Operadores</div>
        <div style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 14 }}>
          Lista puxada do cadastro de colaboradores (departamento contendo "Operação"). Para
          incluir alguém aqui ou atualizar os equipamentos que opera, edite o colaborador em{" "}
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
            placeholder="Buscar por nome, cargo, filial ou equipamento…"
            aria-label="Buscar operador"
          />
          {busca && (
            <button type="button" className="search-clear" onClick={() => setBusca("")} aria-label="Limpar busca">
              <X size={14} />
            </button>
          )}
        </div>
        {erroCarregamento && <div className="login-error" style={{ marginBottom: 14 }}>{erroCarregamento}</div>}
        {carregando ? (
          <div className="section-hint">Carregando operadores…</div>
        ) : operadoresFiltrados.length === 0 ? (
          <div className="section-hint">Nenhum operador encontrado.</div>
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
              { key: "cnh", label: "CNH", render: (r) => (r.cnh ? `${r.cnh.categoria} (até ${r.cnh.validade})` : "—") },
              {
                key: "equipamentos",
                label: "Equipamentos que opera",
                render: (r) =>
                  r.equipamentos && r.equipamentos.length > 0 ? (
                    <div className="chip-row">
                      {r.equipamentos.map((eq) => (
                        <span className="equip-chip" key={eq}>
                          {eq}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "—"
                  ),
              },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={operadoresFiltrados}
          />
        )}
      </div>
    </div>
  );
}
