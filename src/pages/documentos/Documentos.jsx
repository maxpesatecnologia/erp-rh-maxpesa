import { useEffect, useMemo, useState } from "react";
import { Search, X, FolderOpen } from "lucide-react";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import Avatar from "../../components/Avatar";
import AnexarDocumentosModal from "../../components/AnexarDocumentosModal";
import { COLABORADORES } from "../../data/mock/colaboradores";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { listarColaboradores, atualizarDocumentosColaborador } from "../../lib/colaboradoresApi";
import { DOCUMENTOS_PESSOAIS_ADMISSAO, documentoEhMultiplo } from "../../lib/admissaoApi";
import { anexarDocumentoChecklist, removerDocumentoChecklist } from "../../lib/documentosChecklistApi";

// Mesma lista de documentos pessoais obrigatórios usada na Admissão Digital —
// um colaborador que já chegou com eles anexados por lá não precisa reanexar
// (ver "Cadastro oficial" em AdmissaoDigital.jsx). Não podem ser excluídos,
// só anexados/removidos — diferente dos documentos extras criados pelo RH.
const DOCUMENTOS_OBRIGATORIOS = DOCUMENTOS_PESSOAIS_ADMISSAO;

const DOCUMENTOS_PADRAO = { anexos: {}, extras: [] };

// Chave estável e legível pro documento extra (ex.: "Atestado médico" ->
// "extra-atestado-medico") — sufixo numérico só entra se colidir com um já
// existente daquele colaborador.
function gerarChaveDocumentoExtra(label, chavesExistentes) {
  const base =
    label
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-+|-+$)/g, "") || "documento";
  let chave = `extra-${base}`;
  let sufixo = 2;
  while (chavesExistentes.includes(chave)) {
    chave = `extra-${base}-${sufixo++}`;
  }
  return chave;
}

export default function Documentos() {
  const [colaboradores, setColaboradores] = useState(isSupabaseConfigured ? [] : COLABORADORES);
  const [carregando, setCarregando] = useState(isSupabaseConfigured);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [colaboradorDocumentosId, setColaboradorDocumentosId] = useState(null);

  const colaboradorDocumentos = colaboradores.find((c) => c.id === colaboradorDocumentosId) ?? null;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    listarColaboradores()
      .then(setColaboradores)
      .catch((e) => setErro(e.message || "Erro ao carregar colaboradores."))
      .finally(() => setCarregando(false));
  }, []);

  const colaboradoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return colaboradores;
    return colaboradores.filter((c) =>
      [c.nome, c.cargo, c.codigoDominio, c.id].some((campo) => String(campo || "").toLowerCase().includes(termo))
    );
  }, [colaboradores, busca]);

  function documentosDe(colaborador) {
    return { ...DOCUMENTOS_PADRAO, ...(colaborador.documentos || {}) };
  }

  // Lista completa exibida no modal: obrigatórios (fixos) + extras (criados
  // pelo RH para aquele colaborador específico, marcados como removíveis).
  function listaDocumentosDe(colaborador) {
    const extras = documentosDe(colaborador).extras.map((doc) => ({ ...doc, removivel: true }));
    return [...DOCUMENTOS_OBRIGATORIOS, ...extras];
  }

  async function persistirDocumentos(colaborador, documentos) {
    const documentosAnterior = documentosDe(colaborador);
    setColaboradores((atual) => atual.map((c) => (c.id === colaborador.id ? { ...c, documentos } : c)));
    if (!isSupabaseConfigured) return;
    try {
      await atualizarDocumentosColaborador(colaborador.id, documentos);
    } catch (e) {
      setColaboradores((atual) =>
        atual.map((c) => (c.id === colaborador.id ? { ...c, documentos: documentosAnterior } : c))
      );
      throw e;
    }
  }

  async function handleAnexar(colaborador, docChave, arquivo) {
    const atual = documentosDe(colaborador);
    const anexo = await anexarDocumentoChecklist(`colaboradores/${colaborador.id}`, arquivo);
    const anexoAnterior = atual.anexos[docChave];
    const novoValor = documentoEhMultiplo(docChave) ? [...(anexoAnterior || []), anexo] : anexo;
    const documentos = { ...atual, anexos: { ...atual.anexos, [docChave]: novoValor } };
    await persistirDocumentos(colaborador, documentos);
  }

  // `indice` só existe pra documentos `multiplo` (ex.: "dependente") — indica
  // qual arquivo da lista remover; nos demais, remove o anexo único.
  async function handleRemover(colaborador, docChave, indice) {
    const atual = documentosDe(colaborador);
    const anexoAtual = atual.anexos[docChave];
    const multiplo = documentoEhMultiplo(docChave);
    const anexoRemovido = multiplo ? anexoAtual?.[indice] : anexoAtual;
    const novoValor = multiplo ? (anexoAtual || []).filter((_, i) => i !== indice) : null;
    const documentos = { ...atual, anexos: { ...atual.anexos, [docChave]: novoValor } };
    await removerDocumentoChecklist(anexoRemovido?.path);
    await persistirDocumentos(colaborador, documentos);
  }

  async function handleCriarDocumento(colaborador, nome) {
    const atual = documentosDe(colaborador);
    const chave = gerarChaveDocumentoExtra(nome, atual.extras.map((doc) => doc.chave));
    const documentos = { ...atual, extras: [...atual.extras, { chave, label: nome }] };
    await persistirDocumentos(colaborador, documentos);
  }

  async function handleExcluirDocumento(colaborador, docChave) {
    const atual = documentosDe(colaborador);
    const anexoAtual = atual.anexos[docChave];
    const anexos = { ...atual.anexos };
    delete anexos[docChave];
    const documentos = { anexos, extras: atual.extras.filter((doc) => doc.chave !== docChave) };
    await removerDocumentoChecklist(anexoAtual?.path);
    await persistirDocumentos(colaborador, documentos);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Documentos</h1>
          <div className="page-subtitle">
            Repositório de documentos pessoais obrigatórios e extras por colaborador
          </div>
        </div>
      </div>

      {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

      <div className="card card-pad">
        <div className="section-title">Colaboradores</div>
        <div className="section-hint" style={{ marginTop: -6, marginBottom: 14 }}>
          Colaboradores admitidos pela Admissão Digital já chegam aqui com os documentos anexados por lá.
          Cadastros anteriores a essa integração começam sem anexos — use "Ver documentos" para atribuir ou
          criar um documento extra específico do colaborador.
        </div>
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, cargo, código ou matrícula…"
            aria-label="Buscar colaborador"
          />
          {busca && (
            <button type="button" className="search-clear" onClick={() => setBusca("")} aria-label="Limpar busca">
              <X size={14} />
            </button>
          )}
        </div>

        {carregando ? (
          <div className="section-hint">Carregando colaboradores…</div>
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
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
              {
                key: "documentos",
                label: "Documentos",
                render: (r) => {
                  const lista = listaDocumentosDe(r);
                  const anexos = documentosDe(r).anexos;
                  const anexados = lista.filter((doc) =>
                    doc.multiplo ? (anexos[doc.chave]?.length ?? 0) > 0 : anexos[doc.chave]
                  ).length;
                  const completo = anexados === lista.length;
                  return (
                    <span className={`badge ${completo ? "badge-success" : anexados > 0 ? "badge-info" : "badge-warning"}`}>
                      {anexados}/{lista.length} anexados
                    </span>
                  );
                },
              },
              {
                key: "acao",
                label: "",
                render: (r) => (
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: "5px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
                    onClick={() => setColaboradorDocumentosId(r.id)}
                  >
                    <FolderOpen size={14} /> Ver documentos
                  </button>
                ),
              },
            ]}
            rows={colaboradoresFiltrados}
          />
        )}
      </div>

      {colaboradorDocumentos && (
        <AnexarDocumentosModal
          titulo={`Documentos — ${colaboradorDocumentos.nome}`}
          subtitulo="Documentos do colaborador. Crie um documento extra abaixo se precisar anexar algo fora da lista."
          documentos={listaDocumentosDe(colaboradorDocumentos)}
          anexos={documentosDe(colaboradorDocumentos).anexos}
          onAnexar={(docChave, arquivo) => handleAnexar(colaboradorDocumentos, docChave, arquivo)}
          onRemover={(docChave, indice) => handleRemover(colaboradorDocumentos, docChave, indice)}
          onCriarDocumento={(nome) => handleCriarDocumento(colaboradorDocumentos, nome)}
          onExcluirDocumento={(docChave) => handleExcluirDocumento(colaboradorDocumentos, docChave)}
          onFechar={() => setColaboradorDocumentosId(null)}
        />
      )}
    </div>
  );
}
