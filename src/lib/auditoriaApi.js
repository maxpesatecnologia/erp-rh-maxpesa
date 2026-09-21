import { supabase, isSupabaseConfigured } from "./supabaseClient";

// Log central de auditoria: todo módulo que cria/edita/exclui um registro chama
// registrarAuditoria() depois do write ter sucesso. Guarda quem fez, quando e o
// diff raso entre o estado anterior e o novo — é o que alimenta tanto o badge
// "Editado por X · data" no cantinho de cada registro (filtrando por tabela +
// registroId) quanto a tela /auditoria, só para admin (sem filtro de registro).
//
// Never deve derrubar a ação principal que chamou (salvar colaborador, aprovar
// férias etc.): quem chama envolve em try/catch silencioso — ver padrão em
// colaboradoresApi.js.
export const MODULOS_AUDITADOS = [
  { tabela: "rh_colaboradores", label: "Cadastro de Colaboradores" },
  { tabela: "rh_candidatos", label: "Recrutamento & Seleção" },
  { tabela: "rh_pastas_cargos", label: "Banco de Currículos (pastas)" },
  { tabela: "rh_curriculos", label: "Banco de Currículos" },
  { tabela: "rh_admissoes", label: "Admissão Digital" },
  { tabela: "rh_desligamentos", label: "Desligamento Digital" },
  { tabela: "rh_ferias_solicitacoes", label: "Gestão de Férias" },
  { tabela: "rh_avaliacoes", label: "Avaliação de Desempenho" },
  { tabela: "rh_avaliacoes_equipe", label: "Avaliação de Equipes" },
  { tabela: "rh_comunicados", label: "Comunicação Interna" },
];

export function labelModulo(tabela) {
  return MODULOS_AUDITADOS.find((m) => m.tabela === tabela)?.label || tabela;
}

let auditoriaLocal = [];
let proximoIdLocal = 1;

// Diff raso entre dois objetos "de tela" (camelCase). `antes` costuma ser o
// registro já carregado (formato "de exibição") e `depois` o payload bruto
// enviado pela tela (formato "de formulário") — os dois nem sempre usam as
// mesmas chaves para o mesmo campo (ex.: `cnh: {numero,...}` vs `cnhNumero`).
// Por isso, quando `depois` vem preenchido (criação/edição), só comparamos as
// chaves que ele traz — evita "diferenças" fantasmas de campos que só existem
// no formato de exibição (id, documentos, carimbos de auditoria etc.) e que
// nunca fizeram parte do que foi de fato submetido.
function calcularDiff(antes, depois) {
  const chaves = depois ? Object.keys(depois) : Object.keys(antes || {});
  const alteracoes = {};
  for (const chave of chaves) {
    const valorAntes = antes ? antes[chave] : undefined;
    const valorDepois = depois ? depois[chave] : undefined;
    if (JSON.stringify(valorAntes) !== JSON.stringify(valorDepois)) {
      alteracoes[chave] = { antes: valorAntes ?? null, depois: valorDepois ?? null };
    }
  }
  return alteracoes;
}

function paraEntrada(row) {
  return {
    id: row.id,
    tabela: row.tabela,
    registroId: row.registro_id,
    registroLabel: row.registro_label,
    acao: row.acao,
    usuarioId: row.usuario_id,
    usuarioNome: row.usuario_nome,
    usuarioEmail: row.usuario_email,
    usuarioRole: row.usuario_role,
    alteracoes: row.alteracoes || {},
    criadoEm: row.created_at,
  };
}

export async function registrarAuditoria({ tabela, registroId, registroLabel, acao, usuario, antes, depois }) {
  const entrada = {
    tabela,
    registro_id: String(registroId),
    registro_label: registroLabel ?? null,
    acao,
    usuario_id: usuario?.id ?? null,
    usuario_nome: usuario?.nome ?? "Usuário desconhecido",
    usuario_email: usuario?.email ?? null,
    usuario_role: usuario?.role ?? null,
    alteracoes: calcularDiff(antes, depois),
  };

  if (!isSupabaseConfigured) {
    auditoriaLocal = [
      { id: `local-${proximoIdLocal++}`, ...entrada, created_at: new Date().toISOString() },
      ...auditoriaLocal,
    ];
    return;
  }

  const { error } = await supabase.from("rh_auditoria").insert(entrada);
  if (error) {
    console.warn("Falha ao registrar auditoria:", error.message);
  }
}

export async function listarAuditoria(filtros = {}) {
  const { tabela, registroId, usuarioId, acao, dataInicio, dataFim } = filtros;

  if (!isSupabaseConfigured) {
    return auditoriaLocal
      .filter((e) => !tabela || e.tabela === tabela)
      .filter((e) => !registroId || e.registro_id === String(registroId))
      .filter((e) => !usuarioId || e.usuario_id === usuarioId)
      .filter((e) => !acao || e.acao === acao)
      .filter((e) => !dataInicio || e.created_at >= dataInicio)
      .filter((e) => !dataFim || e.created_at <= dataFim)
      .map(paraEntrada);
  }

  let query = supabase.from("rh_auditoria").select("*").order("created_at", { ascending: false });
  if (tabela) query = query.eq("tabela", tabela);
  if (registroId) query = query.eq("registro_id", String(registroId));
  if (usuarioId) query = query.eq("usuario_id", usuarioId);
  if (acao) query = query.eq("acao", acao);
  if (dataInicio) query = query.gte("created_at", dataInicio);
  if (dataFim) query = query.lte("created_at", dataFim);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.map(paraEntrada);
}
