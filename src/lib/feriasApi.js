import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { calcularDiasPeriodo } from "./feriasCalculo";
import { registrarAuditoria } from "./auditoriaApi";

const TABELA = "rh_ferias_solicitacoes";

// Timestamp + nome de quem fez a ação, gravados direto na linha (além do log
// em rh_auditoria) — é o que alimenta o UltimaEdicaoBadge sem precisar juntar
// com a tabela de auditoria toda vez que uma lista é carregada.
function carimboEdicao(usuario) {
  return { atualizado_por: usuario?.nome ?? null, atualizado_em: new Date().toISOString() };
}

// Nunca deve derrubar a ação principal (salvar/aprovar férias etc.) — se o log
// de auditoria falhar, só avisa no console.
async function auditar(args) {
  try {
    await registrarAuditoria(args);
  } catch (e) {
    console.warn("Falha ao registrar auditoria:", e.message);
  }
}

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
    atualizadoPor: row.atualizado_por || null,
    atualizadoEm: row.atualizado_em || null,
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

export async function criarSolicitacaoFerias(dados, usuario) {
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
    ...carimboEdicao(usuario),
  };

  let ferias;
  if (!isSupabaseConfigured) {
    const nova = { id: `local-${proximoIdLocal++}`, created_at: new Date().toISOString(), ...payload };
    feriasLocais = [...feriasLocais, nova];
    ferias = paraFerias(nova);
  } else {
    const { data, error } = await supabase.from("rh_ferias_solicitacoes").insert(payload).select().single();
    if (error) throw new Error(error.message);
    ferias = paraFerias(data);
  }

  await auditar({
    tabela: TABELA,
    registroId: ferias.id,
    registroLabel: dados.colaboradorId ?? ferias.id,
    acao: "criacao",
    usuario,
    depois: dados,
  });
  return ferias;
}

function atualizarLocal(id, patch) {
  feriasLocais = feriasLocais.map((f) => (f.id === id ? { ...f, ...patch } : f));
  return paraFerias(feriasLocais.find((f) => f.id === id));
}

export async function aprovarFerias(feriasId, usuario) {
  const payload = { status: "Aprovada", ...carimboEdicao(usuario) };
  let ferias;
  if (!isSupabaseConfigured) {
    ferias = atualizarLocal(feriasId, payload);
  } else {
    const { data, error } = await supabase
      .from("rh_ferias_solicitacoes")
      .update(payload)
      .eq("id", feriasId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    ferias = paraFerias(data);
  }

  await auditar({
    tabela: TABELA,
    registroId: feriasId,
    registroLabel: ferias.colaboradorId ?? feriasId,
    acao: "edicao",
    usuario,
    depois: { status: "Aprovada" },
  });
  return ferias;
}

export async function recusarFerias(feriasId, motivo, usuario) {
  const payload = { status: "Recusada", observacao_rh: motivo, ...carimboEdicao(usuario) };
  let ferias;
  if (!isSupabaseConfigured) {
    ferias = atualizarLocal(feriasId, payload);
  } else {
    const { data, error } = await supabase
      .from("rh_ferias_solicitacoes")
      .update(payload)
      .eq("id", feriasId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    ferias = paraFerias(data);
  }

  await auditar({
    tabela: TABELA,
    registroId: feriasId,
    registroLabel: ferias.colaboradorId ?? feriasId,
    acao: "edicao",
    usuario,
    depois: { status: "Recusada", observacao_rh: motivo },
  });
  return ferias;
}

export async function cancelarFerias(feriasId, motivo, usuario) {
  const payload = { status: "Cancelada", observacao_rh: motivo, ...carimboEdicao(usuario) };
  let ferias;
  if (!isSupabaseConfigured) {
    ferias = atualizarLocal(feriasId, payload);
  } else {
    const { data, error } = await supabase
      .from("rh_ferias_solicitacoes")
      .update(payload)
      .eq("id", feriasId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    ferias = paraFerias(data);
  }

  await auditar({
    tabela: TABELA,
    registroId: feriasId,
    registroLabel: ferias.colaboradorId ?? feriasId,
    acao: "edicao",
    usuario,
    depois: { status: "Cancelada", observacao_rh: motivo },
  });
  return ferias;
}

// Prorrogação: RH define uma nova data de término para uma solicitação já aprovada.
// O período/dias anteriores ficam registrados em `prorrogacoes` (histórico), e a
// solicitação segue "Aprovada" com a nova data e a nova contagem de dias.
export async function prorrogarFerias(feriasAtual, novaDataFim, motivo, usuario) {
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
    ...carimboEdicao(usuario),
  };

  let ferias;
  if (!isSupabaseConfigured) {
    ferias = atualizarLocal(feriasAtual.id, payload);
  } else {
    const { data, error } = await supabase
      .from("rh_ferias_solicitacoes")
      .update(payload)
      .eq("id", feriasAtual.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    ferias = paraFerias(data);
  }

  await auditar({
    tabela: TABELA,
    registroId: feriasAtual.id,
    registroLabel: feriasAtual.colaboradorId ?? feriasAtual.id,
    acao: "edicao",
    usuario,
    depois: { data_fim: novaDataFim, dias: novosDias, motivo },
  });
  return ferias;
}
