import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { calcularDiasPeriodo } from "./feriasCalculo";

function paraFerias(row) {
  return {
    id: row.id,
    colaboradorId: row.colaborador_id,
    periodoAquisitivoInicio: row.periodo_aquisitivo_inicio,
    periodoAquisitivoFim: row.periodo_aquisitivo_fim,
    dataInicio: row.data_inicio,
    dataFim: row.data_fim,
    dias: row.dias,
    status: row.status,
    observacaoColaborador: row.observacao_colaborador || "",
    observacaoRh: row.observacao_rh || "",
    prorrogacoes: row.prorrogacoes || [],
  };
}

// Sem Supabase configurado (modo demo), guardamos as solicitações só em memória —
// somem ao recarregar a página, só para dar para navegar o fluxo sem backend.
let proximoIdLocal = 1;
let feriasLocais = [];

export async function listarFerias() {
  if (!isSupabaseConfigured) return feriasLocais.map(paraFerias);
  const { data, error } = await supabase
    .from("rh_ferias_solicitacoes")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data.map(paraFerias);
}

export async function criarSolicitacaoFerias(dados) {
  const payload = {
    colaborador_id: dados.colaboradorId,
    periodo_aquisitivo_inicio: dados.periodoAquisitivo.inicio,
    periodo_aquisitivo_fim: dados.periodoAquisitivo.fim,
    data_inicio: dados.dataInicio,
    data_fim: dados.dataFim,
    dias: dados.dias,
    status: "Pendente",
    observacao_colaborador: dados.observacao || null,
    observacao_rh: null,
    prorrogacoes: [],
  };

  if (!isSupabaseConfigured) {
    const nova = { id: `local-${proximoIdLocal++}`, created_at: new Date().toISOString(), ...payload };
    feriasLocais = [...feriasLocais, nova];
    return paraFerias(nova);
  }

  const { data, error } = await supabase.from("rh_ferias_solicitacoes").insert(payload).select().single();
  if (error) throw new Error(error.message);
  return paraFerias(data);
}

function atualizarLocal(id, patch) {
  feriasLocais = feriasLocais.map((f) => (f.id === id ? { ...f, ...patch } : f));
  return paraFerias(feriasLocais.find((f) => f.id === id));
}

export async function aprovarFerias(feriasId) {
  const payload = { status: "Aprovada" };
  if (!isSupabaseConfigured) return atualizarLocal(feriasId, payload);

  const { data, error } = await supabase
    .from("rh_ferias_solicitacoes")
    .update(payload)
    .eq("id", feriasId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return paraFerias(data);
}

export async function recusarFerias(feriasId, motivo) {
  const payload = { status: "Recusada", observacao_rh: motivo };
  if (!isSupabaseConfigured) return atualizarLocal(feriasId, payload);

  const { data, error } = await supabase
    .from("rh_ferias_solicitacoes")
    .update(payload)
    .eq("id", feriasId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return paraFerias(data);
}

export async function cancelarFerias(feriasId, motivo) {
  const payload = { status: "Cancelada", observacao_rh: motivo };
  if (!isSupabaseConfigured) return atualizarLocal(feriasId, payload);

  const { data, error } = await supabase
    .from("rh_ferias_solicitacoes")
    .update(payload)
    .eq("id", feriasId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return paraFerias(data);
}

// Prorrogação: RH define uma nova data de término para uma solicitação já aprovada.
// O período/dias anteriores ficam registrados em `prorrogacoes` (histórico), e a
// solicitação segue "Aprovada" com a nova data e a nova contagem de dias.
export async function prorrogarFerias(feriasAtual, novaDataFim, motivo) {
  const novosDias = calcularDiasPeriodo(feriasAtual.dataInicio, novaDataFim);
  const registroProrrogacao = {
    dataFimAnterior: feriasAtual.dataFim,
    diasAnterior: feriasAtual.dias,
    dataFimNova: novaDataFim,
    diasNovos: novosDias,
    motivo,
    data: new Date().toISOString(),
  };
  const payload = {
    data_fim: novaDataFim,
    dias: novosDias,
    prorrogacoes: [...feriasAtual.prorrogacoes, registroProrrogacao],
  };

  if (!isSupabaseConfigured) return atualizarLocal(feriasAtual.id, payload);

  const { data, error } = await supabase
    .from("rh_ferias_solicitacoes")
    .update(payload)
    .eq("id", feriasAtual.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return paraFerias(data);
}
