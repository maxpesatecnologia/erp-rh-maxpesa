import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Clock, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { formatDataHora } from "../utils/format";
import { listarAuditoria } from "../lib/auditoriaApi";

const ICONE_ACAO = { criacao: PlusCircle, edicao: Pencil, exclusao: Trash2 };
const LABEL_ACAO = { criacao: "Criação", edicao: "Edição", exclusao: "Exclusão" };

// Versão genérica de HistoricoEtapasModal.jsx: em vez de receber um array
// `historico` já pronto (padrão específico de Admissão/Desligamento), busca em
// rh_auditoria pelo par (tabela, registroId) — é o modal aberto pelo clique no
// UltimaEdicaoBadge de qualquer registro do sistema.
export default function HistoricoAuditoriaModal({ titulo, tabela, registroId, onFechar }) {
  const [entradas, setEntradas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listarAuditoria({ tabela, registroId })
      .then((dados) => {
        if (ativo) setEntradas(dados);
      })
      .catch((e) => {
        if (ativo) setErro(e.message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [tabela, registroId]);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, []);

  return createPortal(
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>Histórico de alterações — {titulo}</h3>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onFechar}>
            <X size={18} />
          </button>
        </div>

        {carregando ? (
          <div className="section-hint">Carregando histórico...</div>
        ) : erro ? (
          <div className="section-hint">Não foi possível carregar o histórico: {erro}</div>
        ) : entradas.length === 0 ? (
          <div className="section-hint">Nenhuma alteração registrada ainda para este registro.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 420, overflowY: "auto" }}>
            {entradas.map((item) => {
              const Icone = ICONE_ACAO[item.acao] || Pencil;
              const campos = Object.entries(item.alteracoes || {});
              return (
                <div key={item.id} className="card card-pad" style={{ boxShadow: "none", padding: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
                    <Icone size={14} /> {LABEL_ACAO[item.acao] || item.acao}
                  </div>
                  {campos.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                      {campos.map(([campo, { antes, depois }]) => (
                        <CampoDiff key={campo} chave={campo} antes={antes} depois={depois} />
                      ))}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-muted)",
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Clock size={12} /> {formatDataHora(item.criadoEm)} · por {item.usuarioNome}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Objetos aninhados (ex.: checklist.documentosAnexos, documentos.anexos) são
// comparados chave a chave em vez de virar um dump de JSON — recursivo porque
// um documento pode estar dois níveis abaixo do campo raiz (checklist →
// documentosAnexos → cin). Limitado a poucos níveis por segurança.
const PROFUNDIDADE_MAXIMA = 4;

function CampoDiff({ chave, antes, depois, nivel = 0 }) {
  // Checa "é arquivo" ANTES de "é objeto": um anexo ({nome, path, ...}) também
  // é um objeto, mas queremos tratá-lo como uma ponta só (Anexado/Removido),
  // não recursar pra dentro dele e listar nome/path como se fossem sub-campos.
  if (ehValorArquivo(antes) || ehValorArquivo(depois)) {
    const antesVazio = valorVazio(antes);
    const depoisVazio = valorVazio(depois);
    let texto;
    let tituloCompleto;
    if (antesVazio && !depoisVazio) {
      texto = `Anexado — ${resumoValor(depois)}`;
      tituloCompleto = `Anexado — ${resumoValor(depois, false)}`;
    } else if (!antesVazio && depoisVazio) {
      texto = `Removido — ${resumoValor(antes)}`;
      tituloCompleto = `Removido — ${resumoValor(antes, false)}`;
    } else {
      texto = `${resumoValor(antes)} → ${resumoValor(depois)}`;
      tituloCompleto = `${resumoValor(antes, false)} → ${resumoValor(depois, false)}`;
    }
    return (
      <div style={{ fontSize: 12, wordBreak: "break-word" }} title={tituloCompleto}>
        <strong>{chave}:</strong> {texto}
      </div>
    );
  }

  if ((isObj(antes) || isObj(depois)) && nivel < PROFUNDIDADE_MAXIMA) {
    const subChaves = diffSubcampos(antes, depois);
    return (
      <div style={{ fontSize: 12 }}>
        <strong>{chave}:</strong>
        <div style={{ marginTop: 2, marginLeft: 12, display: "flex", flexDirection: "column", gap: 2 }}>
          {subChaves.length === 0 ? (
            <span style={{ color: "var(--color-text-muted)" }}>—</span>
          ) : (
            subChaves.map((sub) => (
              <CampoDiff key={sub.chave} chave={sub.chave} antes={sub.antes} depois={sub.depois} nivel={nivel + 1} />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontSize: 12, wordBreak: "break-word" }}>
      <strong>{chave}:</strong>{" "}
      <span style={{ color: "var(--color-text-muted)" }}>{formatValor(antes)}</span>
      {" → "}
      <span>{formatValor(depois)}</span>
    </div>
  );
}

function formatValor(valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

function isObj(valor) {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}

function valorVazio(valor) {
  return valor === null || valor === undefined || valor === "" || (Array.isArray(valor) && valor.length === 0);
}

// Um valor "é arquivo" quando ele (ou o lado oposto do diff, já que um dos
// dois pode estar vazio) tem cara de anexo: {nome, path, ...} ou lista deles.
function ehValorArquivo(valor) {
  if (valorVazio(valor)) return false;
  if (Array.isArray(valor)) return valor.every((v) => isObj(v) && typeof v.nome === "string");
  return isObj(valor) && typeof valor.nome === "string";
}

// Compara as sub-chaves de dois objetos (nível único) e devolve só as que
// mudaram, evitando repetir o que já era igual antes e depois.
function diffSubcampos(antes, depois) {
  const chaves = new Set([...Object.keys(antes || {}), ...Object.keys(depois || {})]);
  const linhas = [];
  chaves.forEach((chave) => {
    const valorAntes = antes?.[chave];
    const valorDepois = depois?.[chave];
    if (JSON.stringify(valorAntes) !== JSON.stringify(valorDepois)) {
      linhas.push({ chave, antes: valorAntes, depois: valorDepois });
    }
  });
  return linhas;
}

const LIMITE_NOME_ARQUIVO = 40;

// Nome de arquivo real (ex.: comprovante com data/valor no nome) pode ser bem
// mais longo que o card do histórico — trunca com "…" em vez de deixar o
// texto estourar em várias linhas.
function truncarNomeArquivo(nome) {
  return nome.length > LIMITE_NOME_ARQUIVO ? `${nome.slice(0, LIMITE_NOME_ARQUIVO)}…` : nome;
}

// Resume um valor para exibição curta no histórico: booleanos viram Sim/Não,
// um arquivo anexado ({nome, path, ...}) mostra só o nome (truncado, a menos
// que `truncar` seja false — usado no `title` pra mostrar o nome completo no
// hover), listas e objetos mostram um resumo dos itens preenchidos em vez do
// JSON bruto.
function resumoValor(valor, truncar = true) {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (Array.isArray(valor)) {
    return valor.length === 0 ? "—" : valor.map((v) => resumoValor(v, truncar)).join(", ");
  }
  if (isObj(valor)) {
    if (typeof valor.nome === "string") return truncar ? truncarNomeArquivo(valor.nome) : valor.nome;
    const partes = Object.entries(valor)
      .filter(([, v]) => !(v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)))
      .map(([chave, v]) => `${chave}: ${resumoValor(v, truncar)}`);
    return partes.length > 0 ? partes.join(", ") : "—";
  }
  return String(valor);
}
