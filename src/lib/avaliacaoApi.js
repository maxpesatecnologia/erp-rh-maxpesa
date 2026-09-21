import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { registrarAuditoria } from "./auditoriaApi";

const TABELA = "rh_avaliacoes";

export const CICLO_ATUAL = "2026.1 (semestral)";

// Template de competências usado ao abrir um novo ciclo — pode virar um template
// por cargo/área mais pra frente, mas hoje é único para todos os colaboradores.
export const COMPETENCIAS_PADRAO = [
  { nome: "Qualidade técnica", peso: 30 },
  { nome: "Comunicação", peso: 20 },
  { nome: "Trabalho em equipe", peso: 25 },
  { nome: "Proatividade", peso: 25 },
];

// Timestamp + nome de quem fez a ação, gravados direto na linha (além do log
// em rh_auditoria) — é o que alimenta o UltimaEdicaoBadge sem precisar juntar
// com a tabela de auditoria toda vez que uma lista é carregada.
function carimboEdicao(usuario) {
  return { atualizado_por: usuario?.nome ?? null, atualizado_em: new Date().toISOString() };
}

// Nunca deve derrubar a ação principal (salvar notas, PDI etc.) — se o log de
// auditoria falhar, só avisa no console.
async function auditar(args) {
  try {
    await registrarAuditoria(args);
  } catch (e) {
    console.warn("Falha ao registrar auditoria:", e.message);
  }
}

function paraAvaliacao(row) {
  return {
    id: row.id,
    colaboradorId: row.colaborador_id,
    ciclo: row.ciclo,
    status: row.status,
    competencias: row.competencias || [],
    metas: row.metas || [],
    pdi: row.pdi || [],
    atualizadoPor: row.atualizado_por || null,
    atualizadoEm: row.atualizado_em || null,
  };
}

// Sem Supabase configurado (modo demo), guardamos as avaliações só em memória
// para a tela poder ser navegada sem backend — os dados somem ao recarregar a página.
let proximoIdLocal = 1;
let avaliacoesLocais = [];

export async function listarAvaliacoes() {
  if (!isSupabaseConfigured) return avaliacoesLocais.map(paraAvaliacao);
  const { data, error } = await supabase
    .from("rh_avaliacoes")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data.map(paraAvaliacao);
}

export async function criarAvaliacao(dados, usuario) {
  const payload = {
    colaborador_id: dados.colaboradorId,
    ciclo: dados.ciclo || CICLO_ATUAL,
    status: "rascunho",
    competencias: dados.competencias || [],
    metas: dados.metas || [],
    pdi: [],
    ...carimboEdicao(usuario),
  };

  let avaliacao;
  if (!isSupabaseConfigured) {
    const nova = { id: `local-${proximoIdLocal++}`, ...payload };
    avaliacoesLocais = [...avaliacoesLocais, nova];
    avaliacao = paraAvaliacao(nova);
  } else {
    const { data, error } = await supabase.from("rh_avaliacoes").insert(payload).select().single();
    if (error) throw new Error(error.message);
    avaliacao = paraAvaliacao(data);
  }

  await auditar({
    tabela: TABELA,
    registroId: avaliacao.id,
    registroLabel: dados.colaboradorId ?? avaliacao.id,
    acao: "criacao",
    usuario,
    depois: dados,
  });
  return avaliacao;
}

// Atualização parcial — usada tanto para salvar notas (competencias/metas) quanto
// o status recalculado e o PDI. Só envia os campos presentes em `dados`.
export async function atualizarAvaliacao(avaliacaoId, dados, usuario) {
  const payload = { ...carimboEdicao(usuario) };
  if (dados.competencias !== undefined) payload.competencias = dados.competencias;
  if (dados.metas !== undefined) payload.metas = dados.metas;
  if (dados.pdi !== undefined) payload.pdi = dados.pdi;
  if (dados.status !== undefined) payload.status = dados.status;

  let avaliacao;
  if (!isSupabaseConfigured) {
    avaliacoesLocais = avaliacoesLocais.map((a) => (a.id === avaliacaoId ? { ...a, ...payload } : a));
    avaliacao = paraAvaliacao(avaliacoesLocais.find((a) => a.id === avaliacaoId));
  } else {
    const { data, error } = await supabase
      .from("rh_avaliacoes")
      .update(payload)
      .eq("id", avaliacaoId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    avaliacao = paraAvaliacao(data);
  }

  await auditar({
    tabela: TABELA,
    registroId: avaliacaoId,
    registroLabel: avaliacao.colaboradorId ?? avaliacaoId,
    acao: "edicao",
    usuario,
    depois: dados,
  });
  return avaliacao;
}

export async function excluirAvaliacao(avaliacaoId, usuario) {
  let registroLabel = avaliacaoId;

  if (!isSupabaseConfigured) {
    const existente = avaliacoesLocais.find((a) => a.id === avaliacaoId);
    if (existente) registroLabel = existente.colaborador_id ?? avaliacaoId;
    avaliacoesLocais = avaliacoesLocais.filter((a) => a.id !== avaliacaoId);
  } else {
    const { data, error } = await supabase.from("rh_avaliacoes").delete().eq("id", avaliacaoId).select();
    if (error) throw new Error(error.message);
    registroLabel = data?.[0]?.colaborador_id ?? avaliacaoId;
  }

  await auditar({
    tabela: TABELA,
    registroId: avaliacaoId,
    registroLabel,
    acao: "exclusao",
    usuario,
  });
}
