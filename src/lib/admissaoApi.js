import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { registrarAuditoria } from "./auditoriaApi";

const TABELA = "rh_admissoes";

// Timestamp + nome de quem fez a ação, gravados direto na linha (além do log
// em rh_auditoria) — é o que alimenta o UltimaEdicaoBadge sem precisar juntar
// com a tabela de auditoria toda vez que uma lista é carregada.
function carimboEdicao(usuario) {
  return { atualizado_por: usuario?.nome ?? null, atualizado_em: new Date().toISOString() };
}

// Nunca deve derrubar a ação principal (salvar admissão etc.) — se o log de
// auditoria falhar, só avisa no console.
async function auditar(args) {
  try {
    await registrarAuditoria(args);
  } catch (e) {
    console.warn("Falha ao registrar auditoria:", e.message);
  }
}

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
    historico: row.historico || [],
    atualizadoPor: row.atualizado_por || null,
    atualizadoEm: row.atualizado_em || null,
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

export async function criarAdmissao(dados, usuario) {
  const payload = {
    candidato_id: dados.candidatoId || null,
    nome: dados.nome,
    cargo: dados.cargo || null,
    filial: dados.filial || null,
    data_prevista: dados.dataPrevista || null,
    checklist: CHECKLIST_PADRAO,
    historico: [],
    ...carimboEdicao(usuario),
  };

  if (!isSupabaseConfigured) {
    const nova = { id: `local-${proximoIdLocal++}`, ...payload };
    admissoesLocais = [...admissoesLocais, nova];
    const admissao = paraAdmissao(nova);
    await auditar({ tabela: TABELA, registroId: admissao.id, registroLabel: admissao.nome, acao: "criacao", usuario, depois: dados });
    return admissao;
  }

  const { data, error } = await supabase.from("rh_admissoes").insert(payload).select().single();
  if (error) throw new Error(error.message);
  const admissao = paraAdmissao(data);
  await auditar({ tabela: TABELA, registroId: admissao.id, registroLabel: admissao.nome, acao: "criacao", usuario, depois: dados });
  return admissao;
}

export async function excluirAdmissao(admissaoId, usuario) {
  if (!isSupabaseConfigured) {
    const admissaoNome = admissoesLocais.find((a) => a.id === admissaoId)?.nome ?? null;
    admissoesLocais = admissoesLocais.filter((a) => a.id !== admissaoId);
    await auditar({ tabela: TABELA, registroId: admissaoId, registroLabel: admissaoNome, acao: "exclusao", usuario });
    return;
  }

  const { data, error } = await supabase.from("rh_admissoes").delete().eq("id", admissaoId).select().single();
  if (error) throw new Error(error.message);
  await auditar({ tabela: TABELA, registroId: admissaoId, registroLabel: data?.nome ?? null, acao: "exclusao", usuario });
}

// `historico` é opcional — quando informado, é a lista completa (já com a
// nova entrada) que substitui o histórico salvo. Quem monta cada entrada é
// a tela (ver criarEntradaHistorico em AdmissaoDigital.jsx).
// `checklistAnterior` é opcional mas quem chama sempre tem ele à mão (é o
// checklist antes do toggle/anexo) — sem ele, o diff de auditoria não tem
// "antes" pra comparar e mostra TODAS as chaves do checklist como alteradas
// em toda edição, mesmo as etapas que nem foram tocadas (ex.: exame
// admissional aparecendo "alterado" só porque alguém anexou um documento).
export async function atualizarChecklistAdmissao(admissaoId, checklist, historico, usuario, checklistAnterior) {
  const payload = {
    ...(historico !== undefined ? { checklist, historico } : { checklist }),
    ...carimboEdicao(usuario),
  };
  const antes = checklistAnterior !== undefined ? { checklist: checklistAnterior } : undefined;

  if (!isSupabaseConfigured) {
    admissoesLocais = admissoesLocais.map((a) => (a.id === admissaoId ? { ...a, ...payload } : a));
    const admissao = paraAdmissao(admissoesLocais.find((a) => a.id === admissaoId));
    await auditar({ tabela: TABELA, registroId: admissaoId, registroLabel: admissao?.nome, acao: "edicao", usuario, antes, depois: { checklist } });
    return admissao;
  }

  const { data, error } = await supabase
    .from("rh_admissoes")
    .update(payload)
    .eq("id", admissaoId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  const admissao = paraAdmissao(data);
  await auditar({ tabela: TABELA, registroId: admissaoId, registroLabel: admissao.nome, acao: "edicao", usuario, antes, depois: { checklist } });
  return admissao;
}
