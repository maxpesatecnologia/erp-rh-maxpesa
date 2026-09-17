import { supabase, isSupabaseConfigured } from "./supabaseClient";

// Etapas que só podem ser marcadas como concluídas depois de anexar o
// documento correspondente (via de confirmação de devolução, atestado do
// exame demissional, termo do acerto rescisório).
export const DOCUMENTOS_ETAPAS_DESLIGAMENTO = {
  devolucaoEquipamentos: { chave: "confirmacaoDevolucao", label: "Via de confirmação da devolução" },
  exameDemissional: { chave: "atestadoExameDemissional", label: "Atestado do exame demissional" },
  acertoRescisorio: { chave: "termoAcertoRescisorio", label: "Termo do acerto rescisório" },
};

const CHECKLIST_PADRAO = {
  entrevistaDesligamento: false,
  devolucaoEquipamentos: false,
  exameDemissional: false,
  acertoRescisorio: false,
  devolucaoEquipamentosAnexo: null,
  exameDemissionalAnexo: null,
  acertoRescisorioAnexo: null,
};

function paraDesligamento(row) {
  const checklistSalvo = row.checklist || {};
  const checklist = {};
  Object.keys(CHECKLIST_PADRAO).forEach((chave) => {
    checklist[chave] = checklistSalvo[chave] ?? CHECKLIST_PADRAO[chave];
  });
  return {
    id: row.id,
    colaboradorId: row.colaborador_id,
    motivo: row.motivo || "",
    dataDesligamento: row.data_desligamento || "",
    checklist,
    emChecklist: row.em_checklist ?? false,
    observacao: row.observacao || "",
    historico: row.historico || [],
  };
}

// Sem Supabase configurado (modo demo), guardamos os desligamentos só em
// memória para o fluxo "Iniciar desligamento" do Cadastro de Colaboradores
// poder ser navegado sem backend — os dados somem ao recarregar a página.
let proximoIdLocal = 1;
let desligamentosLocais = [];

export async function listarDesligamentos() {
  if (!isSupabaseConfigured) return desligamentosLocais.map(paraDesligamento);
  const { data, error } = await supabase
    .from("rh_desligamentos")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data.map(paraDesligamento);
}

export async function criarDesligamento(dados) {
  const payload = {
    colaborador_id: dados.colaboradorId,
    motivo: dados.motivo || null,
    data_desligamento: dados.dataDesligamento || null,
    checklist: CHECKLIST_PADRAO,
    em_checklist: false,
    observacao: null,
    historico: [],
  };

  if (!isSupabaseConfigured) {
    const novo = { id: `local-${proximoIdLocal++}`, ...payload };
    desligamentosLocais = [...desligamentosLocais, novo];
    return paraDesligamento(novo);
  }

  const { data, error } = await supabase.from("rh_desligamentos").insert(payload).select().single();
  if (error) throw new Error(error.message);
  return paraDesligamento(data);
}

export async function excluirDesligamento(desligamentoId) {
  if (!isSupabaseConfigured) {
    desligamentosLocais = desligamentosLocais.filter((d) => d.id !== desligamentoId);
    return;
  }

  const { error } = await supabase.from("rh_desligamentos").delete().eq("id", desligamentoId);
  if (error) throw new Error(error.message);
}

// `historico` é opcional — quando informado, é a lista completa (já com a
// nova entrada) que substitui o histórico salvo. Quem monta cada entrada é
// a tela (ver criarEntradaHistorico em DesligamentoDigital.jsx).
export async function atualizarChecklistDesligamento(desligamentoId, checklist, historico) {
  const payload = historico !== undefined ? { checklist, historico } : { checklist };

  if (!isSupabaseConfigured) {
    desligamentosLocais = desligamentosLocais.map((d) => (d.id === desligamentoId ? { ...d, ...payload } : d));
    return paraDesligamento(desligamentosLocais.find((d) => d.id === desligamentoId));
  }

  const { data, error } = await supabase
    .from("rh_desligamentos")
    .update(payload)
    .eq("id", desligamentoId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return paraDesligamento(data);
}

export async function enviarDesligamentoParaChecklist(desligamentoId) {
  if (!isSupabaseConfigured) {
    desligamentosLocais = desligamentosLocais.map((d) =>
      d.id === desligamentoId ? { ...d, em_checklist: true } : d
    );
    return paraDesligamento(desligamentosLocais.find((d) => d.id === desligamentoId));
  }

  const { data, error } = await supabase
    .from("rh_desligamentos")
    .update({ em_checklist: true })
    .eq("id", desligamentoId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return paraDesligamento(data);
}

// Importação em massa (ex.: histórico de desligamentos antigos + situação
// atual dos em andamento) — cada linha já vem com o checklist calculado a
// partir das colunas de etapa da planilha (ver ImportarDesligamentosForm).
export async function importarDesligamentos(linhas) {
  const payloads = linhas.map((dados) => ({
    colaborador_id: dados.colaboradorId,
    motivo: dados.motivo || null,
    data_desligamento: dados.dataDesligamento || null,
    checklist: { ...CHECKLIST_PADRAO, ...dados.checklist },
    em_checklist: false,
    observacao: null,
    historico: [],
  }));

  if (!isSupabaseConfigured) {
    const novos = payloads.map((payload) => ({ id: `local-${proximoIdLocal++}`, ...payload }));
    desligamentosLocais = [...desligamentosLocais, ...novos];
    return novos.map(paraDesligamento);
  }

  const { data, error } = await supabase.from("rh_desligamentos").insert(payloads).select();
  if (error) throw new Error(error.message);
  return data.map(paraDesligamento);
}

export async function atualizarObservacaoDesligamento(desligamentoId, observacao) {
  if (!isSupabaseConfigured) {
    desligamentosLocais = desligamentosLocais.map((d) =>
      d.id === desligamentoId ? { ...d, observacao } : d
    );
    return paraDesligamento(desligamentosLocais.find((d) => d.id === desligamentoId));
  }

  const { data, error } = await supabase
    .from("rh_desligamentos")
    .update({ observacao })
    .eq("id", desligamentoId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return paraDesligamento(data);
}
