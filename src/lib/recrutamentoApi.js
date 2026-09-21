import { supabase } from "./supabaseClient";
import { registrarAuditoria } from "./auditoriaApi";

const TABELA = "rh_candidatos";

// Timestamp + nome de quem fez a ação, gravados direto na linha (além do log
// em rh_auditoria) — é o que alimenta o UltimaEdicaoBadge sem precisar juntar
// com a tabela de auditoria toda vez que uma lista é carregada.
function carimboEdicao(usuario) {
  return { atualizado_por: usuario?.nome ?? null, atualizado_em: new Date().toISOString() };
}

// Nunca deve derrubar a ação principal (mover candidato etc.) — se o log de
// auditoria falhar, só avisa no console.
async function auditar(args) {
  try {
    await registrarAuditoria(args);
  } catch (e) {
    console.warn("Falha ao registrar auditoria:", e.message);
  }
}

function paraCandidato(row) {
  return {
    id: row.id,
    nome: row.nome,
    vaga: row.vaga,
    origem: row.origem,
    estagioId: row.estagio_id,
    faseAtual: row.fase_atual,
    atualizadoPor: row.atualizado_por || null,
    atualizadoEm: row.atualizado_em || null,
  };
}

export async function listarCandidatos() {
  const { data, error } = await supabase
    .from("rh_candidatos")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data.map(paraCandidato);
}

export async function criarCandidato(dados, usuario) {
  const { data, error } = await supabase
    .from("rh_candidatos")
    .insert({ nome: dados.nome, vaga: dados.vaga || null, origem: dados.origem || null, ...carimboEdicao(usuario) })
    .select()
    .single();
  if (error) throw new Error(error.message);
  const candidato = paraCandidato(data);
  await auditar({
    tabela: TABELA,
    registroId: candidato.id,
    registroLabel: candidato.nome,
    acao: "criacao",
    usuario,
    depois: dados,
  });
  return candidato;
}

export async function moverCandidato(candidatoId, estagioId, usuario) {
  const { data, error } = await supabase
    .from("rh_candidatos")
    .update({ estagio_id: estagioId, ...carimboEdicao(usuario) })
    .eq("id", candidatoId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  const candidato = paraCandidato(data);
  await auditar({
    tabela: TABELA,
    registroId: candidatoId,
    registroLabel: candidato.nome,
    acao: "edicao",
    usuario,
    depois: { estagioId },
  });
  return candidato;
}

export async function excluirCandidato(candidatoId, usuario, candidatoNome) {
  const { error } = await supabase.from("rh_candidatos").delete().eq("id", candidatoId);
  if (error) throw new Error(error.message);
  await auditar({
    tabela: TABELA,
    registroId: candidatoId,
    registroLabel: candidatoNome,
    acao: "exclusao",
    usuario,
  });
}

export async function atualizarCandidato(candidatoId, dados, usuario, dadosAnteriores) {
  const { data, error } = await supabase
    .from("rh_candidatos")
    .update({
      nome: dados.nome,
      vaga: dados.vaga || null,
      origem: dados.origem || null,
      fase_atual: dados.faseAtual || null,
      ...carimboEdicao(usuario),
    })
    .eq("id", candidatoId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  const candidato = paraCandidato(data);
  await auditar({
    tabela: TABELA,
    registroId: candidatoId,
    registroLabel: candidato.nome,
    acao: "edicao",
    usuario,
    antes: dadosAnteriores,
    depois: dados,
  });
  return candidato;
}
