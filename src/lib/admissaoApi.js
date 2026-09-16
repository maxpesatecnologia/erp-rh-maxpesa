import { supabase, isSupabaseConfigured } from "./supabaseClient";

// Documentos pessoais exigidos na etapa "Upload de documentos" — cada um
// precisa estar anexado individualmente para a etapa poder ser concluída.
// `multiplo: true` (ex.: "dependente") aceita mais de um arquivo no mesmo
// item — a anexo vira uma lista em vez de um único objeto — pra dar pra
// anexar o documento de cada dependente sem precisar de um item por pessoa.
export const DOCUMENTOS_PESSOAIS_ADMISSAO = [
  { chave: "cin", label: "CIN (Carteira de Identidade Nacional)" },
  { chave: "cpf", label: "CPF" },
  { chave: "comprovanteResidencia", label: "Comprovante de residência" },
  { chave: "ctps", label: "Carteira de Trabalho (CTPS)" },
  { chave: "dependente", label: "Documento do dependente (certidão de nascimento/CPF)", multiplo: true },
];

export function documentoEhMultiplo(chave) {
  return DOCUMENTOS_PESSOAIS_ADMISSAO.find((doc) => doc.chave === chave)?.multiplo ?? false;
}

const ANEXOS_DOCUMENTOS_PADRAO = Object.fromEntries(
  DOCUMENTOS_PESSOAIS_ADMISSAO.map((doc) => [doc.chave, doc.multiplo ? [] : null])
);

const CHECKLIST_PADRAO = {
  dadosPessoais: false,
  documentos: false,
  exameAdmissional: false,
  assinaturaContrato: false,
  integracaoDominio: false,
};

export function todosDocumentosAnexados(documentosAnexos) {
  return DOCUMENTOS_PESSOAIS_ADMISSAO.every((doc) =>
    doc.multiplo ? (documentosAnexos?.[doc.chave]?.length ?? 0) > 0 : Boolean(documentosAnexos?.[doc.chave])
  );
}

function paraAdmissao(row) {
  const checklistSalvo = row.checklist || {};
  const checklist = { ...CHECKLIST_PADRAO, ...checklistSalvo };
  // documentosAnexos fica aninhado dentro do próprio checklist — evita precisar
  // de uma coluna nova no banco só pra guardar os metadados dos anexos.
  checklist.documentosAnexos = { ...ANEXOS_DOCUMENTOS_PADRAO, ...(checklistSalvo.documentosAnexos || {}) };
  return {
    id: row.id,
    candidatoId: row.candidato_id ?? null,
    nome: row.nome,
    cargo: row.cargo || "",
    foto: row.foto_url || null,
    filial: row.filial || "",
    dataPrevista: row.data_prevista || "",
    checklist,
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
