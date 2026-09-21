import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { registrarAuditoria } from "./auditoriaApi";

const TABELA = "rh_comunicados";

// Timestamp + nome de quem fez a ação, gravados direto na linha (além do log
// em rh_auditoria) — é o que alimenta o UltimaEdicaoBadge sem precisar juntar
// com a tabela de auditoria toda vez que uma lista é carregada.
function carimboEdicao(usuario) {
  return { atualizado_por: usuario?.nome ?? null, atualizado_em: new Date().toISOString() };
}

// Nunca deve derrubar a ação principal (publicar comunicado) — se o log de
// auditoria falhar, só avisa no console.
async function auditar(args) {
  try {
    await registrarAuditoria(args);
  } catch (e) {
    console.warn("Falha ao registrar auditoria:", e.message);
  }
}

function paraComunicado(row) {
  return {
    id: row.id,
    titulo: row.titulo,
    autor: row.autor,
    data: row.data,
    dataEvento: row.data_evento,
    conteudo: row.conteudo,
    atualizadoPor: row.atualizado_por || null,
    atualizadoEm: row.atualizado_em || null,
  };
}

// Sem Supabase configurado (modo demo), guardamos os comunicados só em memória —
// somem ao recarregar a página, só para dar para navegar o fluxo sem backend.
let proximoIdLocal = 1;
let comunicadosLocais = [];

export async function listarComunicados() {
  if (!isSupabaseConfigured) return comunicadosLocais.map(paraComunicado);
  const { data, error } = await supabase
    .from("rh_comunicados")
    .select("*")
    .order("data", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(paraComunicado);
}

export async function criarComunicado(dados, usuario) {
  const payload = {
    titulo: dados.titulo,
    autor: dados.autor,
    data: dados.data,
    data_evento: dados.dataEvento || null,
    conteudo: dados.conteudo,
    ...carimboEdicao(usuario),
  };

  if (!isSupabaseConfigured) {
    const novo = { id: `local-${proximoIdLocal++}`, ...payload };
    comunicadosLocais = [novo, ...comunicadosLocais];
    const comunicado = paraComunicado(novo);
    await auditar({
      tabela: TABELA,
      registroId: comunicado.id,
      registroLabel: comunicado.titulo,
      acao: "criacao",
      usuario,
      depois: dados,
    });
    return comunicado;
  }

  const { data, error } = await supabase.from("rh_comunicados").insert(payload).select().single();
  if (error) throw new Error(error.message);
  const comunicado = paraComunicado(data);
  await auditar({
    tabela: TABELA,
    registroId: comunicado.id,
    registroLabel: comunicado.titulo,
    acao: "criacao",
    usuario,
    depois: dados,
  });
  return comunicado;
}
