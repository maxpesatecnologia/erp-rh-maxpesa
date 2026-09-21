import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { registrarAuditoria } from "./auditoriaApi";

const TABELA = "rh_desligamentos";

// Timestamp + nome de quem fez a ação, gravados direto na linha (além do log
// em rh_auditoria) — é o que alimenta o UltimaEdicaoBadge sem precisar juntar
// com a tabela de auditoria toda vez que uma lista é carregada.
function carimboEdicao(usuario) {
  return { atualizado_por: usuario?.nome ?? null, atualizado_em: new Date().toISOString() };
}

// Nunca deve derrubar a ação principal (salvar desligamento etc.) — se o log
// de auditoria falhar, só avisa no console.
async function auditar(args) {
  try {
    await registrarAuditoria(args);
  } catch (e) {
    console.warn("Falha ao registrar auditoria:", e.message);
  }
}

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
    atualizadoPor: row.atualizado_por || null,
    atualizadoEm: row.atualizado_em || null,
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

export async function criarDesligamento(dados, usuario) {
  const payload = {
    colaborador_id: dados.colaboradorId,
    motivo: dados.motivo || null,
    data_desligamento: dados.dataDesligamento || null,
    checklist: CHECKLIST_PADRAO,
    em_checklist: false,
    observacao: null,
    historico: [],
    ...carimboEdicao(usuario),
  };

  if (!isSupabaseConfigured) {
    const novo = { id: `local-${proximoIdLocal++}`, ...payload };
    desligamentosLocais = [...desligamentosLocais, novo];
    const desligamento = paraDesligamento(novo);
    await auditar({ tabela: TABELA, registroId: desligamento.id, registroLabel: desligamento.colaboradorId, acao: "criacao", usuario, depois: dados });
    return desligamento;
  }

  const { data, error } = await supabase.from("rh_desligamentos").insert(payload).select().single();
  if (error) throw new Error(error.message);
  const desligamento = paraDesligamento(data);
  await auditar({ tabela: TABELA, registroId: desligamento.id, registroLabel: desligamento.colaboradorId, acao: "criacao", usuario, depois: dados });
  return desligamento;
}

// Corrige/preenche a data de um desligamento já existente — usado pelo campo
// "Data de demissão" no Cadastro de Colaboradores (ver NovoColaboradorForm),
// separado de criarDesligamento porque esse já tem registro em rh_desligamentos.
export async function atualizarDataDesligamento(desligamentoId, dataDesligamento, usuario) {
  const carimbo = carimboEdicao(usuario);

  if (!isSupabaseConfigured) {
    desligamentosLocais = desligamentosLocais.map((d) =>
      d.id === desligamentoId ? { ...d, data_desligamento: dataDesligamento, ...carimbo } : d
    );
    const desligamento = paraDesligamento(desligamentosLocais.find((d) => d.id === desligamentoId));
    await auditar({ tabela: TABELA, registroId: desligamentoId, registroLabel: desligamento?.colaboradorId, acao: "edicao", usuario, depois: { dataDesligamento } });
    return desligamento;
  }

  const { data, error } = await supabase
    .from("rh_desligamentos")
    .update({ data_desligamento: dataDesligamento, ...carimbo })
    .eq("id", desligamentoId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  const desligamento = paraDesligamento(data);
  await auditar({ tabela: TABELA, registroId: desligamentoId, registroLabel: desligamento.colaboradorId, acao: "edicao", usuario, depois: { dataDesligamento } });
  return desligamento;
}

export async function excluirDesligamento(desligamentoId, usuario) {
  if (!isSupabaseConfigured) {
    const colaboradorId = desligamentosLocais.find((d) => d.id === desligamentoId)?.colaborador_id ?? null;
    desligamentosLocais = desligamentosLocais.filter((d) => d.id !== desligamentoId);
    await auditar({ tabela: TABELA, registroId: desligamentoId, registroLabel: colaboradorId, acao: "exclusao", usuario });
    return;
  }

  const { data, error } = await supabase.from("rh_desligamentos").delete().eq("id", desligamentoId).select().single();
  if (error) throw new Error(error.message);
  await auditar({ tabela: TABELA, registroId: desligamentoId, registroLabel: data?.colaborador_id ?? null, acao: "exclusao", usuario });
}

// `historico` é opcional — quando informado, é a lista completa (já com a
// nova entrada) que substitui o histórico salvo. Quem monta cada entrada é
// a tela (ver criarEntradaHistorico em DesligamentoDigital.jsx).
export async function atualizarChecklistDesligamento(desligamentoId, checklist, historico, usuario) {
  const payload = {
    ...(historico !== undefined ? { checklist, historico } : { checklist }),
    ...carimboEdicao(usuario),
  };

  if (!isSupabaseConfigured) {
    desligamentosLocais = desligamentosLocais.map((d) => (d.id === desligamentoId ? { ...d, ...payload } : d));
    const desligamento = paraDesligamento(desligamentosLocais.find((d) => d.id === desligamentoId));
    await auditar({ tabela: TABELA, registroId: desligamentoId, registroLabel: desligamento?.colaboradorId, acao: "edicao", usuario, depois: { checklist } });
    return desligamento;
  }

  const { data, error } = await supabase
    .from("rh_desligamentos")
    .update(payload)
    .eq("id", desligamentoId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  const desligamento = paraDesligamento(data);
  await auditar({ tabela: TABELA, registroId: desligamentoId, registroLabel: desligamento.colaboradorId, acao: "edicao", usuario, depois: { checklist } });
  return desligamento;
}

export async function enviarDesligamentoParaChecklist(desligamentoId, usuario) {
  const carimbo = carimboEdicao(usuario);

  if (!isSupabaseConfigured) {
    desligamentosLocais = desligamentosLocais.map((d) =>
      d.id === desligamentoId ? { ...d, em_checklist: true, ...carimbo } : d
    );
    const desligamento = paraDesligamento(desligamentosLocais.find((d) => d.id === desligamentoId));
    await auditar({ tabela: TABELA, registroId: desligamentoId, registroLabel: desligamento?.colaboradorId, acao: "edicao", usuario, depois: { emChecklist: true } });
    return desligamento;
  }

  const { data, error } = await supabase
    .from("rh_desligamentos")
    .update({ em_checklist: true, ...carimbo })
    .eq("id", desligamentoId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  const desligamento = paraDesligamento(data);
  await auditar({ tabela: TABELA, registroId: desligamentoId, registroLabel: desligamento.colaboradorId, acao: "edicao", usuario, depois: { emChecklist: true } });
  return desligamento;
}

// Importação em massa (ex.: histórico de desligamentos antigos + situação
// atual dos em andamento) — cada linha já vem com o checklist calculado a
// partir das colunas de etapa da planilha (ver ImportarDesligamentosForm).
// Uma única entrada de auditoria cobre a importação inteira (não uma por linha).
export async function importarDesligamentos(linhas, usuario) {
  const carimbo = carimboEdicao(usuario);
  const payloads = linhas.map((dados) => ({
    colaborador_id: dados.colaboradorId,
    motivo: dados.motivo || null,
    data_desligamento: dados.dataDesligamento || null,
    checklist: { ...CHECKLIST_PADRAO, ...dados.checklist },
    em_checklist: false,
    observacao: null,
    historico: [],
    ...carimbo,
  }));

  if (!isSupabaseConfigured) {
    const novos = payloads.map((payload) => ({ id: `local-${proximoIdLocal++}`, ...payload }));
    desligamentosLocais = [...desligamentosLocais, ...novos];
    const desligamentos = novos.map(paraDesligamento);
    await auditar({
      tabela: TABELA,
      registroId: "importacao",
      registroLabel: `Importação de ${desligamentos.length} desligamento(s)`,
      acao: "criacao",
      usuario,
      depois: { quantidade: desligamentos.length },
    });
    return desligamentos;
  }

  const { data, error } = await supabase.from("rh_desligamentos").insert(payloads).select();
  if (error) throw new Error(error.message);
  const desligamentos = data.map(paraDesligamento);
  await auditar({
    tabela: TABELA,
    registroId: "importacao",
    registroLabel: `Importação de ${desligamentos.length} desligamento(s)`,
    acao: "criacao",
    usuario,
    depois: { quantidade: desligamentos.length },
  });
  return desligamentos;
}

export async function atualizarObservacaoDesligamento(desligamentoId, observacao, usuario) {
  const carimbo = carimboEdicao(usuario);

  if (!isSupabaseConfigured) {
    desligamentosLocais = desligamentosLocais.map((d) =>
      d.id === desligamentoId ? { ...d, observacao, ...carimbo } : d
    );
    const desligamento = paraDesligamento(desligamentosLocais.find((d) => d.id === desligamentoId));
    await auditar({ tabela: TABELA, registroId: desligamentoId, registroLabel: desligamento?.colaboradorId, acao: "edicao", usuario, depois: { observacao } });
    return desligamento;
  }

  const { data, error } = await supabase
    .from("rh_desligamentos")
    .update({ observacao, ...carimbo })
    .eq("id", desligamentoId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  const desligamento = paraDesligamento(data);
  await auditar({ tabela: TABELA, registroId: desligamentoId, registroLabel: desligamento.colaboradorId, acao: "edicao", usuario, depois: { observacao } });
  return desligamento;
}
