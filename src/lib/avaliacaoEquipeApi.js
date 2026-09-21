import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { registrarAuditoria } from "./auditoriaApi";

const TABELA = "rh_avaliacoes_equipe";

// Timestamp + nome de quem fez a ação, gravados direto na linha (além do log
// em rh_auditoria) — é o que alimenta o UltimaEdicaoBadge sem precisar juntar
// com a tabela de auditoria toda vez que uma lista é carregada.
function carimboEdicao(usuario) {
  return { atualizado_por: usuario?.nome ?? null, atualizado_em: new Date().toISOString() };
}

// Nunca deve derrubar a ação principal (registrar avaliação) — se o log de
// auditoria falhar, só avisa no console.
async function auditar(args) {
  try {
    await registrarAuditoria(args);
  } catch (e) {
    console.warn("Falha ao registrar auditoria:", e.message);
  }
}

// Times fixos da operação — mesmo conjunto para todas as filiais. Se um novo
// time for criado, basta incluir aqui; nada mais no app depende de outra lista.
export const EQUIPES = [
  "Comercial",
  "Operacional",
  "Segurança do Trabalho",
  "Suprimentos",
  "RH",
  "Manutenção",
  "Operação",
];

// Indicadores fixos que compõem a nota geral (média simples dos 4) — mesma
// régua pra todo time, pra dar pra comparar histórico e comparar times entre si.
export const INDICADORES_EQUIPE = [
  { key: "clima", label: "Clima da equipe" },
  { key: "produtividade", label: "Produtividade / entregas" },
  { key: "seguranca", label: "Segurança do trabalho" },
  { key: "quadro", label: "Quadro / dotação de pessoal" },
];

export function notaGeralDaAvaliacao(indicadores) {
  const valores = INDICADORES_EQUIPE.map((i) => Number(indicadores?.[i.key])).filter((v) => Number.isFinite(v));
  if (valores.length === 0) return null;
  return valores.reduce((soma, v) => soma + v, 0) / valores.length;
}

function paraAvaliacaoEquipe(row) {
  return {
    id: row.id,
    equipe: row.equipe,
    periodo: row.periodo,
    indicadores: row.indicadores || {},
    pontosAtencao: row.pontos_atencao || "",
    observacoes: row.observacoes || "",
    gestorResponsavel: row.gestor_responsavel,
    criadoEm: row.created_at,
    atualizadoPor: row.atualizado_por || null,
    atualizadoEm: row.atualizado_em || null,
  };
}

// Sem Supabase configurado (modo demo), guardamos as avaliações só em memória
// para a tela poder ser navegada sem backend — os dados somem ao recarregar a página.
let proximoIdLocal = 1;
let avaliacoesLocais = [];

export async function listarAvaliacoesEquipe() {
  if (!isSupabaseConfigured) return avaliacoesLocais.map(paraAvaliacaoEquipe);
  const { data, error } = await supabase
    .from("rh_avaliacoes_equipe")
    .select("*")
    .order("periodo", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(paraAvaliacaoEquipe);
}

// Registro é append-only: cada avaliação é a "foto" do time num período — não
// existe edição/exclusão, é assim que o histórico fica confiável pra comparar.
export async function criarAvaliacaoEquipe(dados, usuario) {
  const payload = {
    equipe: dados.equipe,
    periodo: dados.periodo,
    indicadores: dados.indicadores || {},
    pontos_atencao: dados.pontosAtencao || "",
    observacoes: dados.observacoes || "",
    gestor_responsavel: dados.gestorResponsavel,
    ...carimboEdicao(usuario),
  };

  if (!isSupabaseConfigured) {
    const nova = { id: `local-${proximoIdLocal++}`, ...payload, created_at: new Date().toISOString() };
    avaliacoesLocais = [nova, ...avaliacoesLocais];
    const avaliacao = paraAvaliacaoEquipe(nova);
    await auditar({
      tabela: TABELA,
      registroId: avaliacao.id,
      registroLabel: avaliacao.equipe,
      acao: "criacao",
      usuario,
      depois: dados,
    });
    return avaliacao;
  }

  const { data, error } = await supabase.from("rh_avaliacoes_equipe").insert(payload).select().single();
  if (error) throw new Error(error.message);
  const avaliacao = paraAvaliacaoEquipe(data);
  await auditar({
    tabela: TABELA,
    registroId: avaliacao.id,
    registroLabel: avaliacao.equipe,
    acao: "criacao",
    usuario,
    depois: dados,
  });
  return avaliacao;
}
