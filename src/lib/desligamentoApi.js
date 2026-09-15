import { supabase, isSupabaseConfigured } from "./supabaseClient";

const CHECKLIST_PADRAO = {
  entrevistaDesligamento: false,
  devolucaoEquipamentos: false,
  exameDemissional: false,
  acertoRescisorio: false,
  homologacaoSindicato: false,
  baixaDominio: false,
};

function paraDesligamento(row) {
  return {
    id: row.id,
    colaboradorId: row.colaborador_id,
    motivo: row.motivo || "",
    dataDesligamento: row.data_desligamento || "",
    checklist: { ...CHECKLIST_PADRAO, ...(row.checklist || {}) },
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

export async function atualizarChecklistDesligamento(desligamentoId, checklist) {
  if (!isSupabaseConfigured) {
    desligamentosLocais = desligamentosLocais.map((d) => (d.id === desligamentoId ? { ...d, checklist } : d));
    return paraDesligamento(desligamentosLocais.find((d) => d.id === desligamentoId));
  }

  const { data, error } = await supabase
    .from("rh_desligamentos")
    .update({ checklist })
    .eq("id", desligamentoId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return paraDesligamento(data);
}
