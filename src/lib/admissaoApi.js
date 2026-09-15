import { supabase, isSupabaseConfigured } from "./supabaseClient";

const CHECKLIST_PADRAO = {
  dadosPessoais: false,
  documentos: false,
  exameAdmissional: false,
  assinaturaContrato: false,
  integracaoDominio: false,
};

function paraAdmissao(row) {
  return {
    id: row.id,
    candidatoId: row.candidato_id ?? null,
    nome: row.nome,
    cargo: row.cargo || "",
    foto: row.foto_url || null,
    filial: row.filial || "",
    dataPrevista: row.data_prevista || "",
    checklist: { ...CHECKLIST_PADRAO, ...(row.checklist || {}) },
  };
}

// Sem Supabase configurado (modo demo), guardamos as admissões só em memória
// para o fluxo "Efetivar contratação" do Recrutamento poder ser navegado sem
// backend — os dados somem ao recarregar a página.
let proximoIdLocal = 1;
let admissoesLocais = [];

export async function listarAdmissoes() {
  if (!isSupabaseConfigured) return admissoesLocais.map(paraAdmissao);
  const { data, error } = await supabase
    .from("rh_admissoes")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data.map(paraAdmissao);
}

export async function criarAdmissao(dados) {
  const payload = {
    candidato_id: dados.candidatoId || null,
    nome: dados.nome,
    cargo: dados.cargo || null,
    filial: dados.filial || null,
    data_prevista: dados.dataPrevista || null,
    checklist: CHECKLIST_PADRAO,
  };

  if (!isSupabaseConfigured) {
    const nova = { id: `local-${proximoIdLocal++}`, ...payload };
    admissoesLocais = [...admissoesLocais, nova];
    return paraAdmissao(nova);
  }

  const { data, error } = await supabase.from("rh_admissoes").insert(payload).select().single();
  if (error) throw new Error(error.message);
  return paraAdmissao(data);
}

export async function excluirAdmissao(admissaoId) {
  if (!isSupabaseConfigured) {
    admissoesLocais = admissoesLocais.filter((a) => a.id !== admissaoId);
    return;
  }

  const { error } = await supabase.from("rh_admissoes").delete().eq("id", admissaoId);
  if (error) throw new Error(error.message);
}

export async function atualizarChecklistAdmissao(admissaoId, checklist) {
  if (!isSupabaseConfigured) {
    admissoesLocais = admissoesLocais.map((a) => (a.id === admissaoId ? { ...a, checklist } : a));
    return paraAdmissao(admissoesLocais.find((a) => a.id === admissaoId));
  }

  const { data, error } = await supabase
    .from("rh_admissoes")
    .update({ checklist })
    .eq("id", admissaoId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return paraAdmissao(data);
}
