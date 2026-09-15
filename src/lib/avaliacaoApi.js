import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const CICLO_ATUAL = "2026.1 (semestral)";

// Template de competências usado ao abrir um novo ciclo — pode virar um template
// por cargo/área mais pra frente, mas hoje é único para todos os colaboradores.
export const COMPETENCIAS_PADRAO = [
  { nome: "Qualidade técnica", peso: 30 },
  { nome: "Comunicação", peso: 20 },
  { nome: "Trabalho em equipe", peso: 25 },
  { nome: "Proatividade", peso: 25 },
];

function paraAvaliacao(row) {
  return {
    id: row.id,
    colaboradorId: row.colaborador_id,
    ciclo: row.ciclo,
    status: row.status,
    competencias: row.competencias || [],
    metas: row.metas || [],
    pdi: row.pdi || [],
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

export async function criarAvaliacao(dados) {
  const payload = {
    colaborador_id: dados.colaboradorId,
    ciclo: dados.ciclo || CICLO_ATUAL,
    status: "rascunho",
    competencias: dados.competencias || [],
    metas: dados.metas || [],
    pdi: [],
  };

  if (!isSupabaseConfigured) {
    const nova = { id: `local-${proximoIdLocal++}`, ...payload };
    avaliacoesLocais = [...avaliacoesLocais, nova];
    return paraAvaliacao(nova);
  }

  const { data, error } = await supabase.from("rh_avaliacoes").insert(payload).select().single();
  if (error) throw new Error(error.message);
  return paraAvaliacao(data);
}

// Atualização parcial — usada tanto para salvar notas (competencias/metas) quanto
// o status recalculado e o PDI. Só envia os campos presentes em `dados`.
export async function atualizarAvaliacao(avaliacaoId, dados) {
  const payload = {};
  if (dados.competencias !== undefined) payload.competencias = dados.competencias;
  if (dados.metas !== undefined) payload.metas = dados.metas;
  if (dados.pdi !== undefined) payload.pdi = dados.pdi;
  if (dados.status !== undefined) payload.status = dados.status;

  if (!isSupabaseConfigured) {
    avaliacoesLocais = avaliacoesLocais.map((a) => (a.id === avaliacaoId ? { ...a, ...payload } : a));
    return paraAvaliacao(avaliacoesLocais.find((a) => a.id === avaliacaoId));
  }

  const { data, error } = await supabase
    .from("rh_avaliacoes")
    .update(payload)
    .eq("id", avaliacaoId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return paraAvaliacao(data);
}

export async function excluirAvaliacao(avaliacaoId) {
  if (!isSupabaseConfigured) {
    avaliacoesLocais = avaliacoesLocais.filter((a) => a.id !== avaliacaoId);
    return;
  }

  const { error } = await supabase.from("rh_avaliacoes").delete().eq("id", avaliacaoId);
  if (error) throw new Error(error.message);
}
